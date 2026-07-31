import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RankUpCard from '../components/celebration/RankUpCard'
import LevelUpOverlay from '../components/celebration/LevelUpOverlay'
import XpRewardCard from '../components/celebration/XpRewardCard'
import RankProgressCard from '../components/celebration/RankProgressCard'
import StreakMilestoneCard from '../components/celebration/StreakMilestoneCard'
import MissionCompleteCard from '../components/celebration/MissionCompleteCard'
import CertificateCard from '../components/celebration/CertificateCard'
import { isMongoId } from '../utils/mongoId'
import { buildTierRows, allCompleteRows, nextTierFor } from '../utils/rankReqs'
import { useAuth } from './AuthContext'
import { getRankProgress, clearApiCache } from '../api/api'

// Global queue for celebratory "moments" triggered by server XP responses (A9 shape).
// A single hook — useCelebrate() — is called from every earn point (wired via
// useXpAnimation). Moments are shown ONE AT A TIME, never stacked; the queue order is
// xp-reward popup (the game-style ±XP card, which also flashes the level-up inline) →
// rank-up (C1) → certificate (C15). When the reward popup is suppressed (opts.reward:false,
// e.g. passive study pings) a level crossing falls back to the inline LevelUpOverlay (C2).
const CelebrationContext = createContext(() => {})
// Separate, non-breaking channel that reports whether a celebration card is on screen right
// now. The onboarding tour subscribes to this so it never starts on top of a load-time popup
// (e.g. the daily-login-bonus XP card) — it waits until the celebration queue is clear.
const CelebrationBusyContext = createContext(false)

// Cheap, network-free gate for the category-cleared milestone fetch. Returns false when a
// /progress/rank-progress call could not possibly surface a new crossing — so we never spend
// a request on every earn (Render 512MB / Mongo M0: no wasted round-trips). Skips when:
//   • the hunter is at S — there is no higher tier to work toward, or
//   • every category of the next tier has ALREADY been celebrated this browser (we're only
//     waiting on the rank-up itself, which the earn response drives synchronously).
// Uses the freshly server-computed rank on the earn summary first (authoritative for this
// earn), falling back to the cached auth rank.
function shouldCheckMilestone(u, summary) {
  const curRank = summary.rankAfter || summary.rankBefore || u.rank || 'E'
  const tier = nextTierFor(curRank)
  if (!tier) return false
  try {
    const seen = JSON.parse(localStorage.getItem(`arise:rankms:v1:${u.id || u.username || 'me'}:${tier.letter}`) || 'null')
    if (Array.isArray(seen) && tier.atoms.every((a) => seen.includes(a.label))) return false
  } catch { /* unreadable storage → allow the fetch */ }
  return true
}

export function CelebrationProvider({ children }) {
  const [queue, setQueue] = useState([])
  const current = queue[0] || null
  const location = useLocation()
  const navigate = useNavigate()
  const lastPath = useRef(location.pathname)
  // Read auth via a ref so `celebrate` can stay identity-stable (deps []) — every earn site
  // keeps `celebrate` in an effect's deps, so a changing identity would re-run those effects.
  const { user } = useAuth()
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])
  const milestoneBusy = useRef(false)

  // celebrate(summary, { reward }) — `reward` defaults true and shows the full XP popup.
  // Pass reward:false for passive/background earns (study pings) so they only surface a
  // level-up/rank-up, never a full popup on every tick.
  const celebrate = useCallback((summary, opts = {}) => {
    if (!summary) return
    const reward = opts.reward !== false
    const earned = Number(summary.xpEarned)
    const hasXp = Number.isFinite(earned) && earned !== 0
    const hasLevel = summary.levelUp && summary.levelAfter
    const moments = []
    // The one game-style popup: any XP change (up or down) lands as a card with the
    // ±XP number and the level bar filling/draining. A level crossing flashes inline,
    // so we do NOT also queue a separate LevelUpOverlay.
    if (reward && hasXp) {
      moments.push({
        type: 'xpReward',
        xpEarned: earned,
        xpBefore: Number(summary.xpBefore ?? 0),
        xpAfter: Number(summary.xpAfter ?? 0),
        levelAfter: summary.levelAfter ?? 1,
        levelUp: !!summary.levelUp,
        titleUnlocked: summary.levelUp ? (summary.titleUnlocked || null) : null,
        dailyBonus: !!summary.dailyBonusEarned,
        sourceLabel: summary.sourceLabel || null,
        breakdown: Array.isArray(summary.breakdown) && summary.breakdown.length ? summary.breakdown : null,
      })
    } else if (hasLevel) {
      // C2 — inline level-up (used when the popup is suppressed but the learner leveled).
      moments.push({
        type: 'levelUp',
        levelAfter: summary.levelAfter,
        xpAfter: summary.xpAfter ?? null,
        titleUnlocked: summary.titleUnlocked || null,
      })
    }
    // Ascension Progress — the per-category "completed vs remaining" card. Queued AFTER the XP
    // popup and BEFORE the rank-up cinematic, so the sequence reads: ±XP → progress bars → (only
    // when every bar is full) rank-up. A caller may pass an explicit summary.rankProgress (the
    // demo does); otherwise, on ANY real rank-up (rankUp:true from any earn endpoint — quiz, code,
    // mission, mock) we synthesize the all-complete card for the reached tier. A server rank-up
    // means every gate for that tier passed, so this needs no extra fetch and works everywhere.
    let rankProgress = summary.rankProgress
    if (!rankProgress && summary.rankUp && summary.rankAfter) {
      const rows = allCompleteRows(summary.rankAfter)
      if (rows.length) rankProgress = { rankAfter: summary.rankAfter, rows, allMet: true }
    }
    if (rankProgress && Array.isArray(rankProgress.rows) && rankProgress.rows.length) {
      moments.push({ type: 'rankProgress', ...rankProgress })
    }
    // C1 — rank-up full-screen card (queued AFTER the XP popup). Only shows the title here
    // when it wasn't already surfaced by the popup/level-up, so it never appears twice.
    if (summary.rankUp && summary.rankAfter) {
      const titleShown = (reward && hasXp && summary.levelUp) || hasLevel
      moments.push({
        type: 'rankUp',
        rankBefore: summary.rankBefore || null,
        rankAfter: summary.rankAfter,
        titleUnlocked: titleShown ? null : (summary.titleUnlocked || null),
      })
    }
    // C5 — streak milestone (3/7/14/30). Independent of rank; queued after any XP popup.
    // Pass summary.streakMilestone = { days, bonusXp?, shield? }.
    if (summary.streakMilestone && summary.streakMilestone.days) {
      const sm = summary.streakMilestone
      moments.push({ type: 'streakMilestone', days: sm.days, bonusXp: sm.bonusXp || 0, shield: !!sm.shield })
    }
    // C14 — mission completion. Queued after the XP popup; pass summary.missionComplete =
    // { title, rank?, xpEarned?, next?: { id, title, rank } }.
    if (summary.missionComplete && summary.missionComplete.title) {
      const mc = summary.missionComplete
      moments.push({ type: 'missionComplete', title: mc.title, rank: mc.rank || null, xpEarned: Number(mc.xpEarned || 0), next: mc.next || null })
    }
    // C15 — certificate earned. Most emotional moment → queued LAST (after any rank-up).
    // Pass summary.certificate = { title, kind?, icon?, color?, name?, href? }.
    if (summary.certificate && summary.certificate.title) {
      const c = summary.certificate
      moments.push({ type: 'certificate', title: c.title, kind: c.kind || null, icon: c.icon || null, color: c.color || null, name: c.name || null, href: c.href || '/skill-arena/certificates' })
    }

    if (moments.length) setQueue((q) => [...q, ...moments])

    // ── Category-cleared milestone (async, additive) ────────────────────────────────────
    // When a POSITIVE earn makes a single rank category CROSS its requirement for the next
    // tier (the 20th coding problem, the 3rd subject badge, the last required mission…), pop
    // the Ascension Progress card ONCE for that crossing — the just-cleared category is
    // highlighted and the remaining categories show their real standing. We fire on the
    // TRANSITION (tracked per user+tier in localStorage), so 21, 22, 23… never re-trigger,
    // and a value that jumps PAST its threshold (e.g. XP 3480→3530) still counts. A full
    // rank-up (all categories met) is already handled by the synchronous sequence above, so
    // we skip when rankUp is true or an explicit rankProgress was supplied (the dev demo).
    const u = userRef.current
    const earnedPositive = Number.isFinite(earned) && earned > 0
    if (earnedPositive && !summary.rankUp && !summary.rankProgress
        && u && u.role !== 'GUEST' && !milestoneBusy.current) {
      const uid = u.id || u.username || 'me'
      const wantRank = shouldCheckMilestone(u, summary)
      milestoneBusy.current = true
      ;(async () => {
        try {
          clearApiCache('rankProgress')
          const rp = (await getRankProgress()).data

          // ── C5: streak milestone (3/7/14/30) — independent of rank, fires for everyone ──
          // The server (StreakService) already awarded the one-off bonus XP; here we only pop
          // the celebration the first time this run crosses a milestone. A localStorage marker
          // (highest milestone celebrated) makes it fire once, and resets when the streak breaks
          // (streak < marker) so a fresh run can earn them again.
          const streak = Number(rp?.streak || 0)
          const skey = `arise:streakms:v1:${uid}`
          let celebrated = 0
          try { celebrated = Number(JSON.parse(localStorage.getItem(skey) || '0')) || 0 } catch { celebrated = 0 }
          if (streak < celebrated) {
            celebrated = 0
            try { localStorage.setItem(skey, '0') } catch { /* storage blocked */ }
          }
          const hit = [3, 7, 14, 30].filter((m) => m <= streak).pop() || 0
          if (hit > celebrated) {
            try { localStorage.setItem(skey, JSON.stringify(hit)) } catch { /* storage blocked */ }
            const bonusXp = { 3: 25, 7: 50, 14: 100, 30: 200 }[hit] || 0
            setQueue((q) => [...q, { type: 'streakMilestone', days: hit, bonusXp, shield: hit === 7 || hit === 14 }])
          }

          // ── Rank category cleared — only when a new crossing for the next tier is possible ──
          const tier = wantRank ? nextTierFor(rp?.rank || 'E') : null
          if (tier) {
            const rows = buildTierRows(rp, tier)
            const metLabels = rows.filter((r) => r.met).map((r) => r.label)
            const key = `arise:rankms:v1:${uid}:${tier.letter}`
            let seen = null
            try { seen = JSON.parse(localStorage.getItem(key) || 'null') } catch { seen = null }
            if (!Array.isArray(seen)) {
              // First look at this tier — baseline silently so already-met categories don't fire.
              try { localStorage.setItem(key, JSON.stringify(metLabels)) } catch { /* storage full/blocked */ }
            } else {
              const cleared = metLabels.filter((l) => !seen.includes(l))
              if (cleared.length) {
                // Persist the union so each category can only ever celebrate once.
                try { localStorage.setItem(key, JSON.stringify([...new Set([...seen, ...metLabels])])) } catch { /* ignore */ }
                // allMet is impossible here (all met ⇒ backend rankUp ⇒ handled above), so this is
                // always the partial "Continue" card, queued AFTER any XP popup already shown.
                setQueue((q) => [...q, { type: 'rankProgress', rankAfter: tier.letter, rows, allMet: false, cleared }])
              }
            }
          }
        } catch { /* progress is a nicety — never block or error the earn flow */ }
        finally { milestoneBusy.current = false }
      })()
    }
  }, [])

  const advance = useCallback(() => setQueue((q) => q.slice(1)), [])

  // Never trap the hunter: a real page change clears pending moments so a full-screen
  // card can never block the next screen. We key this on `pathname` (not `location.key`)
  // on purpose: some pages (e.g. the mission detail unsaved-changes guard) push/pop a
  // same-URL history "sentinel", which changes location.key without leaving the page.
  // Clearing on those would wipe an XP reward popup the instant it's queued.
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname
      setQueue([])
    }
  }, [location.pathname])

  return (
    <CelebrationContext.Provider value={celebrate}>
      <CelebrationBusyContext.Provider value={current != null}>
        {children}
      </CelebrationBusyContext.Provider>
      {current?.type === 'xpReward' && (
        <XpRewardCard
          xpEarned={current.xpEarned}
          xpBefore={current.xpBefore}
          xpAfter={current.xpAfter}
          levelUp={current.levelUp}
          titleUnlocked={current.titleUnlocked}
          dailyBonus={current.dailyBonus}
          label={current.sourceLabel}
          breakdown={current.breakdown}
          onClose={advance}
        />
      )}
      {current?.type === 'levelUp' && (
        <LevelUpOverlay
          levelAfter={current.levelAfter}
          xpAfter={current.xpAfter}
          titleUnlocked={current.titleUnlocked}
          onClose={advance}
        />
      )}
      {current?.type === 'rankProgress' && (
        <RankProgressCard
          rankAfter={current.rankAfter}
          rows={current.rows}
          allMet={current.allMet}
          cleared={current.cleared}
          onClose={advance}
        />
      )}
      {current?.type === 'streakMilestone' && (
        <StreakMilestoneCard
          days={current.days}
          bonusXp={current.bonusXp}
          shield={current.shield}
          onClose={advance}
        />
      )}
      {current?.type === 'rankUp' && (
        <RankUpCard
          rankBefore={current.rankBefore}
          rankAfter={current.rankAfter}
          titleUnlocked={current.titleUnlocked}
          onClose={advance}
        />
      )}
      {current?.type === 'missionComplete' && (
        <MissionCompleteCard
          title={current.title}
          rank={current.rank}
          xpEarned={current.xpEarned}
          next={current.next}
          onStartNext={() => {
            const nid = current.next?.id
            navigate(nid && isMongoId(nid) ? `/missions/${nid}` : '/missions')
            advance()
          }}
          onClose={advance}
        />
      )}
      {current?.type === 'certificate' && (
        <CertificateCard
          title={current.title}
          kind={current.kind}
          icon={current.icon}
          color={current.color}
          name={current.name}
          onView={() => { navigate(current.href || '/skill-arena/certificates'); advance() }}
          onClose={advance}
        />
      )}
    </CelebrationContext.Provider>
  )
}

export function useCelebrate() {
  return useContext(CelebrationContext)
}

// True while any celebration card (XP reward, rank-up, daily bonus, etc.) is showing. Used by
// the onboarding tour to defer its start until the screen is clear.
export function useCelebrationActive() {
  return useContext(CelebrationBusyContext)
}

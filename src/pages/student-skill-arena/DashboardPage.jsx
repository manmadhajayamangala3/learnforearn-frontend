import { useState, useEffect, useMemo, useCallback, useRef, memo, lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TEST_DELAY_MS } from '../../components/loaders/_config'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useBackClose from '../../hooks/useBackClose'
import SystemAwakeningLoader from '../../components/loaders/SystemAwakeningLoader'
import DungeonPortalLoader from '../../components/loaders/DungeonPortalLoader'
import { CheckCircle, Search, Trophy, Info, Menu, Sun, Moon } from 'lucide-react'
import {
  getProgressSummary, getRoadmap, getBulkSubjectStatus,
  getSubjects, getSubject, getRoadmaps, getDashboardBootstrap,
  getHunterStats, clearApiCache, getQuests, studyPing, getQuizHistory, getCertificates,
  recordConceptOpen, peekApiCache, claimDailyLogin, getRankProgress,
} from '../../api/api'
import { isGuest } from '../../utils/auth'
import ResumeConceptCard from './ResumeConceptCard'
import XpFloatLayer from '../../components/XpFloatLayer'
import useXpAnimation from '../../hooks/useXpAnimation'
import CountUp from '../../components/CountUp'
import StreakFlame from '../../components/StreakFlame'
import StreakAtRiskBanner from '../../components/StreakAtRiskBanner'
import { badgeMeta } from '../../utils/badgeMeta'
import { subjectBadgeTitle } from '../../utils/subjectBadgeTitle'
import { useAuth } from '../../context/AuthContext'
import { useCelebrationActive } from '../../context/CelebrationContext'
import blurOnEnter from '../../utils/blurOnEnter'
import { useTheme } from '../../context/ThemeContext'
import { getRank } from '../../utils/slRank'
import { RANK_LADDER } from '../../constants/ranks'
import { levelProgress, LEVEL_TITLES, titleForLevel } from '../../utils/slLevel'
import toast from 'react-hot-toast'
import { getApiError } from '../../utils/apiError'
import { logApiError } from '../../utils/devLog'
import {
  NAV_ITEMS,
  computeStats, subjectGateRank,
} from './dashboard/dashboardUtils'
import '../../styles/pages/dashboard/index.css'
import '../../styles/pages/shared/certificates.css'

// Heavy panels — lazy so default arena view ships a smaller initial chunk.
const ConceptInlinePanel  = lazy(() => import('./panels/ConceptInlinePanel'))
const RoadmapPanel        = lazy(() => import('./panels/RoadmapPanel'))
const SubjectPanel        = lazy(() => import('./panels/SubjectPanel'))
const MissionOverviewCard = lazy(() => import('./MissionOverviewCard'))
const BookmarkQueueCard = lazy(() => import('./BookmarkQueueCard'))
const LearningInsights = lazy(() => import('./LearningInsights'))
const OnboardingTour = lazy(() => import('../../components/onboarding/OnboardingTour'))
// Hunter Profile drawer — statically imported (not lazy) so the avatar menu opens instantly
// with no Suspense/loading flash. It is small and its CSS (certificates.css) is already loaded.
import HunterProfileDrawer from './panels/HunterProfileDrawer'
// ─── Extracted modal components ────────────────────────────
import AboutRoadmapModal   from './modals/AboutRoadmapModal'
import AboutGateModal      from './modals/AboutGateModal'
import InstructionsModal   from './modals/InstructionsModal'
// ─── Extracted mobile components ───────────────────────────
import MobileAvatarMenu    from './mobile/MobileAvatarMenu'
import MobileStatsPopup    from './mobile/MobileStatsPopup'
import MobileQuestsPopup   from './mobile/MobileQuestsPopup'
import MobileNavDrawer     from './mobile/MobileNavDrawer'

const HIST_TYPE_LABEL = {
  CONCEPT: 'Skill Trial',
  SUBJECT: 'Gate Test',
  ROADMAP: 'Path Exam',
  APTITUDE_MOCK: 'Aptitude Mock',
}
function fmtHistDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
const HIST_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'CONCEPT', label: 'Skill Trials' },
  { id: 'SUBJECT', label: 'Gate Tests' },
  { id: 'ROADMAP', label: 'Path Exams' },
  { id: 'APTITUDE_MOCK', label: 'Aptitude Mocks' },
]

// Hoisted to module scope + memoized so it is a STABLE component type: previously
// declared inside DashboardPage, it was recreated every render, remounting all gate
// cards on each quest tick / search keystroke. Closure deps are now passed as props
// (same names) — rendered output is identical.
const GateCard = memo(function GateCard({ s, pOvr, quizStatuses, summaryBadgeMap, openSubjectPanel, setAboutGate, startQuiz }) {
  const p = pOvr !== undefined ? pOvr : (s.percentage ?? (s.totalConcepts > 0 ? Math.round((s.completedCount / s.totalConcepts) * 100) : 0))
  const gr        = subjectGateRank(s)
  const allLearned = p >= 100
  const hasBadge  = s.hasBadge ?? quizStatuses[s.id]?.hasBadge ?? summaryBadgeMap[s.id] ?? false
  const gateClosed = allLearned && hasBadge
  const sealed    = p === 0
  const enabled   = s.totalConcepts > 0
  const gateColor = gr.color
  const gateStyle = useMemo(() => ({
    '--gate-color': gateColor,
    '--gate-bar-bg': gateClosed ? gateColor : `${gateColor}88`,
    '--gate-status-color': gateClosed ? gateColor : sealed ? '#0cbd09' : `${gateColor}BB`,
    '--progress-pct': `${p}%`,
  }), [gateColor, gateClosed, sealed, p])
  return (
    <div
      className={`sl-gate-card dash-gate-card ${enabled ? 'is-enabled' : 'is-disabled'}`}
      style={gateStyle}
      onClick={() => enabled && openSubjectPanel(s.id)}>
      {/* Top row: title left, rank + about right */}
      <div className="dash-gate-card__top">
        <div className="sl-gate-title dash-gate-card__title">{s.title}</div>
        <div className="dash-gate-card__actions">
          {gateClosed && <Trophy size={11} color="#4ADE80" />}
          <span className={`rank-badge dash-rank-badge-xxs ${gr.cls}`}>{gr.label}</span>
          <button
            className="dash-gate-card__info-btn"
            style={{ '--gate-color': gateColor }}
            onClick={e => { e.stopPropagation(); setAboutGate(s) }}
            title="About this gate"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      <div className="sl-gate-meta">{s.totalConcepts > 0 ? `${s.totalConcepts} skills` : 'Coming soon'}</div>
      {!allLearned && (
        <div className="sl-gate-bar-track">
          <div className="sl-gate-bar-fill dash-gate-bar-fill--dynamic" />
        </div>
      )}
      {gateClosed ? (
        <div className="sl-gate-status dash-gate-status--dynamic">GATE CLOSED SUCCESSFULLY</div>
      ) : allLearned ? (
        <button
          className="dash-gate-final-btn"
          onClick={e => { e.stopPropagation(); startQuiz('subject', s.id, s.title, s.icon) }}
        >
          ⚔ TAKE FINAL TEST
        </button>
      ) : (
        <div className="sl-gate-status dash-gate-status--dynamic">
          {sealed ? '' : `IN PROGRESS ${p}%`}
        </div>
      )}
    </div>
  )
})

// B5: time-of-day word for the dynamic greeting.
function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

// B5: the single nearest milestone — next rank if there is one, else next level.
function nearestMilestone(xp, level) {
  const next = RANK_LADDER.find(r => r.min > xp)
  if (next) return `${(next.min - xp).toLocaleString()} XP to ${next.letter}-Rank`
  const lp = levelProgress(xp)
  const toNext = Math.max(0, lp.span - lp.into)
  return `${toNext.toLocaleString()} XP to Level ${level + 1}`
}

// C4: resolve the dashboard resume target from server history, else recommend a first gate.
function computeResumeTarget(resumeConcept, summary) {
  if (resumeConcept?.conceptId) {
    const gate = (summary?.subjectProgress || []).find(s => s.subjectId === resumeConcept.subjectId)
    return {
      kind: 'resume',
      conceptId: resumeConcept.conceptId,
      subjectId: resumeConcept.subjectId,
      conceptTitle: resumeConcept.conceptTitle,
      subjectTitle: resumeConcept.subjectTitle,
      subjectIcon: resumeConcept.subjectIcon,
      pct: gate?.percentage ?? 0,
    }
  }
  const sp = summary?.subjectProgress || []
  const rec = sp.find(s => s.percentage > 0 && !s.hasBadge) || sp.find(s => !s.hasBadge) || sp[0]
  if (rec) return { kind: 'recommend', subjectId: rec.subjectId, subjectTitle: rec.title, subjectIcon: rec.icon, pct: rec.percentage ?? 0 }
  return null
}

export default function DashboardPage() {
  const { user, logout, markTourSeen } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Seed initial state from a warm bootstrap cache (same 30s TTL the bootstrap uses) so a
  // quick remount (e.g. dashboard → quiz → back) paints content immediately instead of the
  // full-screen loader. The bootstrap effect below still runs and refreshes to identical data.
  const bootSeed = useMemo(() => peekApiCache('dashboardBootstrap', 30_000), [])

  const [summary, setSummary]         = useState(bootSeed?.progressSummary ?? null)
  const [loading, setLoading]         = useState(!bootSeed)

  const [activeView, setActiveView]   = useState(() => searchParams.get('view') || 'arena')
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => searchParams.get('subject') || null)
  const [selectedConceptId, setSelectedConceptId] = useState(() => searchParams.get('concept') || null)
  const [conceptNavList, setConceptNavList] = useState([])
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(null)
  // C4: last-opened concept (server history) for the "Continue where you left off" card.
  const [resumeConcept, setResumeConcept] = useState(bootSeed?.resumeConcept ?? null)
  // C3: floating XP when the daily study quest completes on a background ping.
  const { floats: xpFloats, processResult: processXp, cleanup: cleanupXp } = useXpAnimation()

  // Daily-quest state now comes from the server (survives reloads, syncs across devices,
  // and awards real XP). Shape: { quests:[{id,label,xp,done,progressSeconds?,targetSeconds?}],
  // doneCount, totalCount, earnedXp, studySeconds, studyTargetSeconds, studyDone, conceptDone }.
  const [questData, setQuestData]     = useState(bootSeed?.quests ?? null)
  const [recentHistory, setRecentHistory] = useState(bootSeed?.quizHistory ?? [])
  const [historyItems, setHistoryItems]   = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('ALL')
  const [certs, setCerts]                 = useState([])
  const [certsLoaded, setCertsLoaded]     = useState(false)
  const [aboutGate, setAboutGate]           = useState(null)
  const [aboutRoadmap, setAboutRoadmap]     = useState(null)
  const [hunterStats, setHunterStats]       = useState(null)
  const [avatarOpen, setAvatarOpen]         = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileAvatarMenu, setMobileAvatarMenu] = useState(false)
  const [mobilePopup, setMobilePopup]       = useState(null) // 'status' | 'badges' | null
  const [quizIntent, setQuizIntent]         = useState(null)

  // Browser Back / back-gesture closes the open mobile overlay instead of leaving the page.
  // Driven from this always-mounted page (enabled = the overlay's open flag) — the same
  // pattern the Navbar uses — so the history entry is pushed/popped cleanly on toggle.
  useBackClose(mobileMenuOpen, () => setMobileMenuOpen(false))
  useBackClose(mobileAvatarMenu, () => setMobileAvatarMenu(false))
  useBackClose(mobilePopup === 'stats', () => setMobilePopup(null))
  useBackClose(mobilePopup === 'quests', () => setMobilePopup(null))

  const handleAvatarClick = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setMobileAvatarMenu(o => !o)
    } else {
      setAvatarOpen(o => !o)
    }
  }

  // useCallback so memoized GateCards don't remount when this handler is passed down.
  const startQuiz = useCallback((type, refId, title, icon) =>
    setQuizIntent({ type, refId, title, icon: icon ?? null }), [])
  // useCallback so the memoized InstructionsModal doesn't re-render every parent tick.
  const confirmQuiz = useCallback(() => {
    if (!quizIntent) return
    navigate(`/skill-arena/quiz/${quizIntent.type}/${quizIntent.refId}`)
    setQuizIntent(null)
  }, [quizIntent, navigate])
  const [panelRefreshKey, setPanelRefreshKey] = useState(0)

  const [subjects, setSubjects]       = useState([])
  const [quizStatuses, setQuizStatuses] = useState({})
  const [gatesLoaded, setGatesLoaded] = useState(false)
  const [gateSearch, setGateSearch]   = useState('')

  const [allRoadmaps, setAllRoadmaps] = useState(bootSeed?.roadmaps ?? [])
  const [pathsLoaded, setPathsLoaded] = useState(false)
  const [pathSearch, setPathSearch]   = useState('')

  const lastScrollY = useRef(0)
  const navHiddenRef = useRef(false)
  // Fire-and-forget "loaded" timers started from event handlers (sl:refresh, loadGates,
  // loadPaths). Tracked so they can be cleared if the page unmounts before they fire.
  const pendingTimersRef = useRef([])
  useEffect(() => () => { pendingTimersRef.current.forEach(clearTimeout); pendingTimersRef.current = [] }, [])

  // C7 — streak at-risk nudge. Eligible only when the hunter HAS a streak, has done NOTHING
  // qualifying today, and fewer than 4 hours remain in their day. Shown at most once per day
  // (marked in localStorage the moment it becomes eligible). Never for hunters with no streak.
  const [atRisk, setAtRisk] = useState(null)
  useEffect(() => {
    if (!summary || (summary.streak ?? 0) <= 0 || summary.activeToday) { setAtRisk(null); return }
    const now = new Date()
    const eod = new Date(now); eod.setHours(23, 59, 59, 999)
    const hoursLeft = (eod - now) / 3600000
    if (hoursLeft >= 4) { setAtRisk(null); return }
    const uid = user?.id || user?.username || 'me'
    const key = `arise:atrisk:${uid}`
    const today = new Date().toISOString().slice(0, 10)
    try { if (localStorage.getItem(key) === today) { setAtRisk(null); return } } catch { /* storage blocked */ }
    try { localStorage.setItem(key, today) } catch { /* ignore */ }
    setAtRisk({ streak: summary.streak, hoursLeft })
  }, [summary, user?.id, user?.username])

  // C6 — "your shield saved your streak" acknowledgment. When a shield was auto-consumed to
  // bridge a missed day, the summary carries shieldSavedToday; tell the hunter once (deduped
  // per day in localStorage) so the save is loss-aversion positive, not a silent rescue.
  useEffect(() => {
    if (!summary?.shieldSavedToday) return
    const uid = user?.id || user?.username || 'me'
    const key = `arise:shieldsaved:${uid}`
    const today = new Date().toISOString().slice(0, 10)
    try { if (localStorage.getItem(key) === today) return } catch { /* storage blocked */ }
    try { localStorage.setItem(key, today) } catch { /* ignore */ }
    const left = summary?.shields ?? 0
    toast(`Your shield saved your streak. ${left} shield${left === 1 ? '' : 's'} left.`, { icon: '🛡️' })
  }, [summary?.shieldSavedToday, summary?.shields, user?.id, user?.username])

  // Auto-hide navbar on page scroll (reappears when scrolling up).
  // Paused while subject / path / concept panels are open — locks AutoHideNav too
  // (panel inner scroll was still toggling html.nav-hidden via App-level listener).
  useEffect(() => {
    const root = document.documentElement
    const sidePanelOpen = Boolean(selectedSubjectId || selectedRoadmapId || selectedConceptId)

    const resetNav = () => {
      navHiddenRef.current = false
      lastScrollY.current = window.scrollY
      root.classList.remove('nav-hidden')
    }

    if (sidePanelOpen) root.classList.add('dash-panel-lock')
    else root.classList.remove('dash-panel-lock')

    if (loading || sidePanelOpen) {
      resetNav()
      return () => {
        root.classList.remove('dash-panel-lock')
        resetNav()
      }
    }

    const onScroll = () => {
      const y = window.scrollY
      const last = lastScrollY.current
      let nav = navHiddenRef.current
      if (y < 60) nav = false
      else if (y > last + 6) nav = true
      else if (y < last - 6) nav = false
      if (nav !== navHiddenRef.current) {
        navHiddenRef.current = nav
        root.classList.toggle('nav-hidden', nav)
      }
      lastScrollY.current = y
    }

    resetNav()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      root.classList.remove('dash-panel-lock')
      resetNav()
    }
  }, [loading, activeView, selectedSubjectId, selectedRoadmapId, selectedConceptId])

  useEffect(() => {
    let active = true
    const applyBootstrap = (data) => {
      if (!active || !data) return
      setSummary(data.progressSummary)
      setQuestData(data.quests)
      setRecentHistory(data.quizHistory || [])
      setAllRoadmaps(data.roadmaps || [])
      setResumeConcept(data.resumeConcept ?? null)
      pendingTimersRef.current.push(setTimeout(() => setPathsLoaded(true), TEST_DELAY_MS))
      setLoading(false)
    }
    const fallbackIndividual = () => {
      getProgressSummary()
        .then(s => { if (active) setSummary(s.data) })
        .catch(err => { if (active) toast.error(getApiError(err, 'We could not load your progress. Please refresh.')) })
        .finally(() => { if (active) setLoading(false) })
      getQuests()
        .then(r => { if (active) setQuestData(r.data) })
        .catch(err => logApiError('quests', err))
      getQuizHistory(5)
        .then(r => { if (active) setRecentHistory(r.data || []) })
        .catch(err => logApiError('quiz-history', err))
      getRoadmaps()
        .then(r => {
          if (!active) return
          setAllRoadmaps(r.data)
          pendingTimersRef.current.push(setTimeout(() => setPathsLoaded(true), TEST_DELAY_MS))
        })
        .catch(err => {
          logApiError('roadmaps-paths', err)
          if (active) setPathsLoaded(true)
        })
    }
    getDashboardBootstrap()
      .then(r => applyBootstrap(r.data))
      .catch(err => {
        logApiError('dashboard-bootstrap', err)
        if (active) fallbackIndividual()
      })
    return () => { active = false }
  }, [])

  // Hunter stats (roadmap badge metadata) — only needed on the Badges tab.
  useEffect(() => {
    if (activeView !== 'badges') return
    let active = true
    getHunterStats()
      .then(r => { if (active) setHunterStats(r.data) })
      .catch(err => logApiError('hunter-stats', err))
    return () => { active = false }
  }, [activeView])

  // Full attempt history — loaded lazily the first time the History view is opened.
  useEffect(() => {
    if (activeView !== 'history' || historyLoaded) return
    let active = true
    getQuizHistory(0)
      .then(r => { if (active) { setHistoryItems(r.data || []); setHistoryLoaded(true) } })
      // On failure, still resolve the loaded flag so the History tab shows its empty
      // state instead of spinning forever (matches the Certificates tab's behavior).
      .catch(err => { logApiError('quiz-history-full', err); if (active) setHistoryLoaded(true) })
    return () => { active = false }
  }, [activeView, historyLoaded])

  // Earned certificates — loaded lazily the first time the Certificates view is opened.
  useEffect(() => {
    if (activeView !== 'certificates' || certsLoaded) return
    let active = true
    getCertificates()
      .then(r => { if (active) { setCerts(r.data || []); setCertsLoaded(true) } })
      .catch(err => { logApiError('certificates', err); if (active) setCertsLoaded(true) })
    return () => { active = false }
  }, [activeView, certsLoaded])

  // Re-fetch everything when a concept is cleared (dispatched from QuizResultPage)
  useEffect(() => {
    const refresh = () => {
      clearApiCache('progressSummary', 'hunterStats', 'quests', 'subjects', 'subject:*', 'concept:*', 'quizStatus:*', 'roadmapStatus:*', 'certificates', 'quizHistory:*', 'dashboardBootstrap')
      getProgressSummary().then(s => {
        setSummary(s.data)
      }).catch(err => logApiError('progress-refresh', err))
      getQuests().then(r => setQuestData(r.data)).catch(err => logApiError('quests-refresh', err))
      getQuizHistory(5).then(r => setRecentHistory(r.data || [])).catch(err => logApiError('quiz-history-refresh', err))
      setHistoryLoaded(false)
      setCertsLoaded(false)
      getHunterStats().then(r => setHunterStats(r.data)).catch(err => logApiError('hunter-stats-refresh', err))
      setPanelRefreshKey(k => k + 1)
      getSubjects().then(r => {
        setSubjects(r.data)
        pendingTimersRef.current.push(setTimeout(() => setGatesLoaded(true), TEST_DELAY_MS))
        const ids = r.data.map(s => s.id)
        if (ids.length > 0) {
          getBulkSubjectStatus(ids)
            .then(res => setQuizStatuses(res.data))
            .catch(err => logApiError('quiz-status-refresh', err))
        }
      }).catch(err => {
        logApiError('subjects-refresh', err)
        setGatesLoaded(true)
      })
      getRoadmaps().then(r => {
        setAllRoadmaps(r.data)
        pendingTimersRef.current.push(setTimeout(() => setPathsLoaded(true), TEST_DELAY_MS))
      }).catch(err => {
        logApiError('roadmaps-refresh', err)
        setPathsLoaded(true)
      })
    }
    window.addEventListener('sl:refresh', refresh)
    return () => window.removeEventListener('sl:refresh', refresh)
  }, [])

  // Sync the open subject/concept panel and active tab FROM the URL. Runs on mount and
  // whenever the query changes — including the browser Back/Forward buttons / back-gesture —
  // so Back walks concept → subject → arena (each drill-in pushed a history entry via
  // setSearchParams). Clearing when a param is absent is what lets Back close the panels.
  useEffect(() => {
    let active = true
    const view    = searchParams.get('view') || 'arena'
    const subject = searchParams.get('subject')
    const concept = searchParams.get('concept')

    if (active) {
      setSelectedSubjectId(subject || null)
      setSelectedConceptId(concept || null)
      if (!concept) setConceptNavList([])

      if (concept) setActiveView('gates')
      else if (['gates', 'paths', 'badges', 'history', 'certificates'].includes(view)) setActiveView(view)
      else setActiveView('arena')
    }

    if (view === 'gates' || subject || concept) loadGates()
    if (view === 'paths') loadPaths()
    return () => { active = false }
  }, [searchParams]) // eslint-disable-line


  // Study-time quest: ping the server every 5 min while the arena is open. The server
  // measures REAL elapsed time between pings (capped per ping), so the 45-minute quest
  // survives reloads, counts across sessions/devices, and awards real XP exactly once —
  // unlike the old client-only 20-min timer that reset on every remount and gave no XP.
  useEffect(() => {
    if (loading || questData?.studyDone) return  // wait for shell; stop when study quest done
    let cancelled = false
    // C3: when a ping is the one that completes the 45-min study quest, the response carries
    // xpEarned (+ level/title flags) — fire the floating XP and any level-up cinematic.
    const applyPing = (r) => {
      if (cancelled) return
      setQuestData(r.data)
      if (r.data?.xpEarned) processXp(r.data, undefined, { label: 'DAILY QUEST', breakdown: [{ label: 'Study Quest Complete', amount: r.data.xpEarned, icon: '📖' }] })
    }
    // First ping establishes the server-side baseline (lastPingAt); no time credited yet.
    studyPing().then(applyPing).catch(() => {})
    const t = setInterval(() => {
      if (document.hidden) return  // don't credit time while the tab is backgrounded
      studyPing().then(applyPing).catch(() => {})
    }, 5 * 60_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [loading, questData?.studyDone, processXp])

  // C17 — daily login bonus. Once the shell is ready, claim the +10 "showed up today" XP.
  // Idempotent server-side (once per IST day), so a re-mount or refresh never double-awards;
  // when granted we play the reward popup and refresh the summary so the XP total updates.
  const loginBonusFired = useRef(false)
  useEffect(() => {
    if (loading || loginBonusFired.current || user?.role === 'GUEST') return
    loginBonusFired.current = true
    claimDailyLogin()
      .then(r => {
        if (r.data?.xpEarned > 0) {
          processXp(r.data, undefined, { label: 'DAILY LOGIN', breakdown: [{ label: 'Showed up today', amount: r.data.xpEarned, icon: '📅' }] })
          getProgressSummary().then(s => setSummary(s.data)).catch(() => {})
        }
      })
      .catch(() => {})
  }, [loading, user?.role, processXp])

  // C3: clear any pending XP-float timers on unmount.
  useEffect(() => cleanupXp, [cleanupXp])

  const loadGates = () => {
    if (gatesLoaded) return
    getSubjects().then(r => {
      setSubjects(r.data)
      pendingTimersRef.current.push(setTimeout(() => setGatesLoaded(true), TEST_DELAY_MS))
      const ids = r.data.map(s => s.id)
      if (ids.length > 0) {
        getBulkSubjectStatus(ids)
          .then(res => setQuizStatuses(res.data))
          .catch(err => logApiError('quiz-status-gates', err))
      }
    }).catch(err => {
      logApiError('subjects-gates', err)
      toast.error('Could not load gates. Please try again.')
      setGatesLoaded(true)
    })
  }

  const loadPaths = () => {
    if (pathsLoaded) return
    getRoadmaps().then(r => {
      setAllRoadmaps(r.data)
      pendingTimersRef.current.push(setTimeout(() => setPathsLoaded(true), TEST_DELAY_MS))
    }).catch(err => {
      logApiError('roadmaps-paths', err)
      toast.error('Could not load paths. Please try again.')
      setPathsLoaded(true)
    })
  }

  const switchView = (view) => {
    setActiveView(view)
    setGateSearch(''); setPathSearch('')
    setSelectedSubjectId(null); setSelectedConceptId(null); setConceptNavList([])
    setSelectedRoadmapId(null)
    setSearchParams(view === 'arena' ? {} : { view })
    if (view === 'gates') loadGates()
    if (view === 'paths') loadPaths()
  }

  // useCallback so memoized GateCards keep a stable onClick and don't re-render on
  // unrelated state changes (quest ticks, search keystrokes). Identity only changes
  // when the active view changes — rare and correct.
  const openSubjectPanel = useCallback((id) => {
    setSelectedSubjectId(id)
    setSelectedConceptId(null); setConceptNavList([])
    const params = activeView === 'arena' ? {} : { view: activeView }
    setSearchParams({ ...params, subject: id })
  }, [activeView, setSearchParams])

  const closeSubjectPanel = () => {
    setSelectedSubjectId(null); setSelectedConceptId(null); setConceptNavList([])
    setSearchParams(activeView === 'arena' ? {} : { view: activeView })
  }

  const openRoadmapPanel = (id) => {
    setSelectedRoadmapId(id)
    setSelectedSubjectId(null); setSelectedConceptId(null); setConceptNavList([])
  }

  const closeRoadmapPanel = () => setSelectedRoadmapId(null)

  const openConcept = (conceptId, navList) => {
    setSelectedConceptId(conceptId)
    setConceptNavList(navList)
    const params = { ...(activeView !== 'arena' ? { view: activeView } : {}) }
    if (selectedSubjectId) params.subject = selectedSubjectId
    params.concept = conceptId
    setSearchParams(params)
    // C4: bookmark this concept server-side (fire-and-forget) and optimistically update the
    // resume card so it's fresh the moment the hunter returns to the arena view.
    recordConceptOpen(conceptId).catch(() => {})
    const c = (navList || []).find(x => x.id === conceptId)
    const subj = subjects.find(s => s.id === selectedSubjectId)
    if (selectedSubjectId) {
      setResumeConcept({
        conceptId,
        subjectId: selectedSubjectId,
        conceptTitle: c?.title || '',
        subjectTitle: subj?.title || '',
        subjectIcon: subj?.icon || '',
        resumed: true,
      })
    }
  }

  // C4: one-tap resume. History → open the exact concept. Recommendation → open the
  // recommended gate's first incomplete concept (resolved from getSubject).
  const handleResume = () => {
    if (!resumeTarget) return
    if (resumeTarget.kind === 'resume') {
      setSearchParams({ subject: resumeTarget.subjectId, concept: resumeTarget.conceptId })
      return
    }
    getSubject(resumeTarget.subjectId)
      .then(r => {
        const concepts = r.data?.concepts || []
        const first = concepts.find(c => !c.completed) || concepts[0]
        setSearchParams(first
          ? { subject: resumeTarget.subjectId, concept: first.id }
          : { subject: resumeTarget.subjectId })
      })
      .catch(() => setSearchParams({ subject: resumeTarget.subjectId }))
  }

  const handleConceptClose = (action, targetId) => {
    if (action === 'prev' || action === 'next') {
      setSelectedConceptId(targetId)
      const params = { ...(activeView !== 'arena' ? { view: activeView } : {}) }
      if (selectedSubjectId) params.subject = selectedSubjectId
      params.concept = targetId
      setSearchParams(params)
    } else {
      setSelectedConceptId(null); setConceptNavList([])
      const params = { ...(activeView !== 'arena' ? { view: activeView } : {}) }
      if (selectedSubjectId) params.subject = selectedSubjectId
      setSearchParams(params)
    }
  }

  const xp             = summary?.xp    ?? user?.xp    ?? 0
  const rank           = useMemo(() => getRank(xp, summary?.rank ?? user?.rank), [xp, summary?.rank, user?.rank])
  const level          = summary?.level ?? user?.level ?? 1
  const levelPct       = useMemo(() => levelProgress(xp).pct, [xp])
  const stats          = useMemo(() => computeStats(summary?.subjectProgress), [summary])
  const initials       = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const questList      = questData?.quests || []
  const doneCount      = questData?.doneCount ?? questList.filter(q => q.done).length
  const totalQuests    = questData?.totalCount ?? questList.length
  const earnedXp       = questData?.earnedXp ?? 0

  // B5: dynamic arena greeting — time-of-day + first name + streak + single nearest milestone.
  const streakCount    = summary?.streak ?? 0
  const firstName      = user?.fullName?.split(' ')[0] || 'Hunter'
  const greetLabel     = greetingWord()
  const milestoneText  = nearestMilestone(xp, level)
  const hasProgress    = xp > 0 || streakCount > 0

  // ── C21: first-run "System" tour ─────────────────────────────────────────────
  // Narrated spotlight over the real dashboard. Auto-runs exactly once per registered account —
  // gated purely on the server flag user.tourArenaDone (authoritative: survives hard refresh,
  // next login and other devices). ?tour=1 force-starts it for testing/replay (never touches the
  // flag). Guests and admins never see it. The tour also waits for any load-time celebration
  // (e.g. the daily-login-bonus XP popup) to clear before it starts, so the two never overlap.
  const [tourOn, setTourOn] = useState(false)
  const [tourArmed, setTourArmed] = useState(false)
  const tourStarted = useRef(false)
  const tourViewRef = useRef(null)
  const celebrationActive = useCelebrationActive()
  const sawCelebration = useRef(false)

  // Mobile layout kicks in at ≤768px (side panels + desktop nav links hide; nav moves behind the
  // hamburger and status/quests/profile move behind the avatar sheet). The tour swaps to a
  // hamburger/avatar-based step set below it. Kept separate so desktop is never disturbed.
  const [isMobileTour, setIsMobileTour] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobileTour(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const tourSteps = useMemo(() => {
    // ── MOBILE step set (≤768px) ─────────────────────────────────────────────
    // Side panels and desktop nav links don't exist on mobile — the map lives behind the
    // hamburger and Status/Quests/Badges/Instructions behind the avatar sheet. Same engine,
    // same once-only gating; steps open those overlays via `drawer`/`avatar` flags (onStep).
    if (isMobileTour) {
      return [
        { view: 'arena',
          title: `Welcome, ${firstName}.`,
          body: 'This is your Skill Arena — where you learn real tech skills like a game and level up from complete beginner to job-ready. Here’s a quick look around; it moves on its own, tap Next to jump ahead.' },
        { view: 'arena', drawer: true, targets: ['.mnav-drawer', '.sl-mob-menu-btn'], place: 'bottom',
          title: 'This is your map',
          body: 'Tap the menu any time to move around: Overview (this home screen), Dungeon Gates (your subjects), Hunter Paths (career roadmaps) and Missions (real projects you build).' },
        { view: 'gates', target: '.sl-cards-grid .sl-gate-card',
          title: 'Gates are your subjects',
          body: 'A Dungeon Gate is simply a subject — like HTML, Java or Python. Open one to see the Skills inside and start learning, at your own pace.' },
        { view: 'gates',
          title: 'Skills & Trials',
          body: 'Inside a Gate are Skills — each is one short lesson followed by a Trial (a quick quiz). Pass the Trial to clear the Skill and earn XP. Passing the quiz is the only way forward — no shortcuts.' },
        { view: 'paths', target: '.dash-path-card',
          title: 'Paths are career roadmaps',
          body: 'A Hunter Path is a career roadmap — it lines up the right subjects, in the right order, for a job like Full-Stack or Data. Follow one and you’ll always know what to learn next.' },
        { view: 'arena', avatar: true, targets: ['.dash-mob-menu', '.sl-mob-avatar'],
          title: 'Everything about you lives here',
          body: 'Tap your avatar for your Stats and streak, your Badges, Certificates and Titles, your Daily Quests, and the Hunter Instructions — a live checklist that tells you exactly what to do next to reach your next Rank (E up to S).' },
        { view: 'arena',
          title: `You’re all set, ${firstName}.`,
          body: 'Pick a Gate and clear your very first Skill — that’s all it takes to begin. Your climb starts now.',
          cta: 'Enter the dungeon' },
      ]
    }

    // ── DESKTOP step set (>768px) ────────────────────────────────────────────
    return [
    { view: 'arena',
      title: `Welcome, ${firstName}.`,
      body: 'This is your Skill Arena — where you learn real tech skills like a game and level up from complete beginner to job-ready. Give me a moment and I’ll show you around; it moves on its own, so hover any card to pause.' },
    { view: 'arena', target: '.sl-dash-left-panel',
      title: 'This side is all about you',
      body: 'Your Level and XP (the points you earn for everything you finish) and your daily streak sit up top — with quick links to the Badges, Certificates and Titles you unlock as you grow.' },
    { view: 'arena', target: '.sl-dash-nav-links',
      title: 'This is your map',
      body: 'Four places to explore, always up here: Overview (this home screen), Dungeon Gates (your subjects), Hunter Paths (career roadmaps) and Missions (real projects you build).' },
    { view: 'gates', targets: ['.sl-cards-grid .sl-gate-card', '[data-tour-nav="gates"]'],
      title: 'Gates are your subjects',
      body: 'A Dungeon Gate is simply a subject — like HTML, Java or Python. Open one to see the Skills inside and start learning, at your own pace.' },
    { view: 'gates',
      title: 'Skills & Trials',
      body: 'Inside a Gate are Skills — each is one short lesson followed by a Trial (a quick quiz). Pass the Trial to clear the Skill and earn XP. Passing the quiz is the only way forward — no shortcuts.' },
    { view: 'paths', targets: ['.dash-path-card', '[data-tour-nav="paths"]'],
      title: 'Paths are career roadmaps',
      body: 'A Hunter Path is a career roadmap — it lines up the right subjects, in the right order, for a job like Full-Stack or Data. Follow one and you’ll always know what to learn next.' },
    { view: 'arena', target: '.sl-dash-right-panel',
      title: 'Daily Quests & your activity',
      body: 'Small Daily Quests give you bonus XP just for showing up, and Recent Activity shows your latest trials — an easy way to see how you’re doing day to day.' },
    { view: 'arena', target: '.sl-nav-avatar',
      title: 'Always know your next step',
      body: 'Open your profile here for the Hunter Instructions — a live checklist that tells you exactly what to do next to reach your next Rank (your overall class, from E up to S).' },
    { view: 'arena',
      title: `You’re all set, ${firstName}.`,
      body: 'Pick a Gate and clear your very first Skill — that’s all it takes to begin. Your climb starts now.',
      cta: 'Enter the dungeon' },
    ]
  }, [firstName, isMobileTour])

  // Step 1 — decide eligibility and "arm" the tour (does not show it yet). Marks the account
  // as seen up front (optimistic local flip + fire-and-forget server write).
  useEffect(() => {
    if (loading || tourStarted.current) return
    // Only registered students get the guided tour — never guests or admins.
    const isRegisteredStudent = !!user && user.role !== 'GUEST' && user.role !== 'ADMIN'
    if (!isRegisteredStudent) return
    const forced = searchParams.get('tour') === '1'
    if (!forced && user.tourArenaDone) return // server flag is authoritative
    tourStarted.current = true
    if (!forced) markTourSeen('arena') // the ?tour=1 replay must never mark the account done
    setTourArmed(true)
    // Depend only on values stable across markTourSeen's optimistic user flip (which mutates
    // user.tourArenaDone). Including the full `user` object here would re-run this effect on the flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.role, user?.id, searchParams])

  // Step 2 — actually show the tour once nothing else is on screen. If a load-time celebration
  // (daily-login bonus, XP popup…) is up, wait for it to close first. When no celebration ever
  // appears, a short grace lets a late-arriving popup register before we commit to starting.
  useEffect(() => {
    if (!tourArmed || tourOn) return undefined
    if (celebrationActive) { sawCelebration.current = true; return undefined }
    const delay = sawCelebration.current ? 400 : 1100
    const t = setTimeout(() => setTourOn(true), delay)
    return () => clearTimeout(t)
  }, [tourArmed, tourOn, celebrationActive])

  // Pre-warm the rank-progress data the Hunter Profile drawer reads on open, so its live
  // checklist shows real numbers immediately instead of the static fallback. The drawer itself
  // is statically imported (no chunk to fetch). Runs once on idle after the dashboard settles.
  const drawerWarmed = useRef(false)
  useEffect(() => {
    if (loading || drawerWarmed.current || isGuest(user)) return
    drawerWarmed.current = true
    const warm = () => { getRankProgress().catch(() => { /* cache warm is best-effort */ }) }
    const ric = window.requestIdleCallback
    if (ric) { const id = ric(warm, { timeout: 2000 }); return () => window.cancelIdleCallback?.(id) }
    const t = setTimeout(warm, 1200)
    return () => clearTimeout(t)
  }, [loading, user])

  const closeTour = useCallback(() => {
    setTourOn(false)
    // Disarm so the "show when armed" effect can't re-trigger and re-open the tour after a
    // Skip/Done (tourOn flips back to false while tourArmed was still true — the re-appear bug).
    setTourArmed(false)
    tourViewRef.current = null
    // Close any overlay the mobile tour opened so Skip/Done never leaves the drawer/sheet up.
    setMobileMenuOpen(false)
    setMobileAvatarMenu(false)
    // "Seen" is already persisted server-side when the tour is armed (markTourSeen), so nothing
    // to write here. The forced ?tour=1 replay just cleans the query param below.
    if (searchParams.get('tour')) {
      const p = new URLSearchParams(searchParams)
      p.delete('tour')
      setSearchParams(p, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // The tour drives the arena for the hunter — switch to the view each step is about
  // (Gates / Paths / back to arena) so the spotlight lands on the real thing.
  const handleTourStep = useCallback((s) => {
    // Mobile arena tour: open exactly the overlay this step spotlights (the nav drawer or the
    // avatar sheet), and close it otherwise. Harmless no-ops on desktop — those steps never set
    // the flags, so both stay false.
    setMobileMenuOpen(!!s?.drawer)
    setMobileAvatarMenu(!!s?.avatar)
    if (s?.view && s.view !== tourViewRef.current) {
      tourViewRef.current = s.view
      switchView(s.view)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Badge lookup from the progress summary — a resilient fallback so an earned badge still
  // shows on a gate card even if the parallel bulk-status call failed or hasn't returned yet.
  const summaryBadgeMap = useMemo(() => {
    const m = {}
    ;(summary?.subjectProgress || []).forEach(sp => { m[sp.subjectId] = sp.hasBadge })
    return m
  }, [summary])

  const filteredSubjects = useMemo(() =>
    subjects.filter(s =>
      s.title.toLowerCase().includes(gateSearch.toLowerCase())
    ), [subjects, gateSearch])

  const filteredRoadmaps = useMemo(() =>
    allRoadmaps.filter(r =>
      r.title.toLowerCase().includes(pathSearch.toLowerCase()) ||
      (r.roleTarget || '').toLowerCase().includes(pathSearch.toLowerCase())
    ), [allRoadmaps, pathSearch])

  // ── Memoized view slices ──────────────────────────────────────────────────
  // Hoisted out of renderMiddle so they don't recompute on every quest tick /
  // keystroke re-render. Output + ordering are byte-identical to the inline versions.
  const cleared = useMemo(
    () => (summary?.subjectProgress ?? []).filter(s => s.hasBadge), [summary])
  const inProgress = useMemo(
    () => (summary?.subjectProgress ?? []).filter(s => s.percentage > 0 && !s.hasBadge), [summary])

  // C4: resume-card target — the last-opened concept (server history), else a recommended
  // first gate derived from the progress summary. Gate % comes from subjectProgress.
  // Plain render-scope computation (the React Compiler memoizes it); cheap either way.
  const resumeTarget = computeResumeTarget(resumeConcept, summary)
  const enrolledPaths = useMemo(
    () => allRoadmaps.filter(r => r.enrolled && !r.paused), [allRoadmaps])

  const allBadges = useMemo(() => {
    const subjectBadges = (summary?.subjectProgress ?? []).map(s => ({
      key: `s-${s.subjectId}`,
      earned: s.hasBadge,
      color: s.color || '#9B6ED4',
      icon: s.icon || '📚',
      title: subjectBadgeTitle(s.title),
      subtitle: s.title,
      kind: 'Subject Mastery',
    }))
    const earnedR = new Map((hunterStats?.roadmapBadges ?? []).map(b => [b.roadmapId, b]))
    const roadmapBadges = allRoadmaps.map(r => {
      const eb = earnedR.get(r.id)
      return {
        key: `r-${r.id}`,
        earned: !!eb,
        color: r.color || '#9B6ED4',
        icon: r.icon || '🗺️',
        title: eb ? badgeMeta(eb.badge).label : (r.roleTarget || r.title),
        subtitle: r.title,
        kind: 'Career Path',
      }
    })
    return [...roadmapBadges, ...subjectBadges].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))
  }, [summary, hunterStats, allRoadmaps])

  const allCerts = useMemo(() => {
    const bySubject = new Map()
    const byRoadmap = new Map()
    certs.forEach(c => {
      if (c.type === 'SUBJECT') bySubject.set(c.refId, c)
      else if (c.type === 'ROADMAP') byRoadmap.set(c.refId, c)
    })
    const subjectCerts = (summary?.subjectProgress ?? []).map(s => {
      const c = bySubject.get(s.subjectId)
      return {
        key: `s-${s.subjectId}`, earned: !!c, certId: c?.id, code: c?.code,
        color: c?.color || s.color || '#9B6ED4', icon: c?.icon || s.icon || '📚',
        title: s.title, kind: 'Subject Mastery',
      }
    })
    const roadmapCerts = allRoadmaps.map(r => {
      const c = byRoadmap.get(r.id)
      return {
        key: `r-${r.id}`, earned: !!c, certId: c?.id, code: c?.code,
        color: c?.color || r.color || '#7C3AED', icon: c?.icon || r.icon || '🗺️',
        title: c?.credentialTitle || r.roleTarget || r.title, kind: 'Career Path',
      }
    })
    return [...roadmapCerts, ...subjectCerts].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))
  }, [certs, summary, allRoadmaps])

  const filteredHistory = useMemo(
    () => historyFilter === 'ALL' ? historyItems : historyItems.filter(i => i.type === historyFilter),
    [historyFilter, historyItems])

  // Counts / arena strip hoisted out of renderMiddle (a plain function — hooks can't live
  // there) so each .filter().length runs only when its source list changes. Output is
  // identical to the previous inline expressions.
  const badgesEarnedCount  = useMemo(() => allBadges.filter(b => b.earned).length, [allBadges])
  const certsEarnedCount   = useMemo(() => allCerts.filter(c => c.earned).length, [allCerts])
  const historyPassedCount = useMemo(() => historyItems.filter(i => i.passed).length, [historyItems])
  const arenaStatCards = useMemo(() => [
    { label: 'SKILLS LEARNED', value: summary?.completedConcepts ?? 0, color: '#9B6ED4' },
    { label: 'GATES CLOSED',  value: cleared.length,    color: '#4ADE80' },
    { label: 'DAY STREAK',     value: summary?.streak ?? 0, suffix: (summary?.streak ?? 0) === 1 ? 'day' : 'days', color: '#F59E0B', streak: true },
  ], [summary, cleared])

  const renderMiddle = () => {
    if (activeView === 'arena') {
      // Active enrolled roadmaps from allRoadmaps (loaded lazily)
      const activePath    = enrolledPaths[0] ?? null

      return (
        <div className="dash-arena-view">

          {/* ── Streak at-risk nudge (C7) ── */}
          {atRisk && (
            <StreakAtRiskBanner
              streak={atRisk.streak}
              hoursLeft={atRisk.hoursLeft}
              onGo={() => { setAtRisk(null); handleResume() }}
              onDismiss={() => setAtRisk(null)}
            />
          )}

          {/* ── Continue where you left off (C4) ── */}
          <ResumeConceptCard target={resumeTarget} onResume={handleResume} />

          {/* ── Hunter overview strip ── */}
          <div className="dash-arena-stats">
            {arenaStatCards.map(stat => (
              <div key={stat.label} className="dash-arena-stat" style={{ '--stat-color': stat.color }}>
                <div className="dash-arena-stat__value">
                  {stat.streak
                    ? <StreakFlame count={stat.value} size={18} shields={summary?.shields ?? 0} />
                    : stat.value}
                </div>
                {stat.suffix && <div className="dash-arena-stat__suffix">{stat.suffix}</div>}
                <div className="dash-arena-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Active hunter path ── */}
          {!pathsLoaded ? (
            <div className="dash-no-path dash-no-path--loading" aria-busy="true">
              <div className="dash-no-path__label">LOADING PATH…</div>
            </div>
          ) : activePath ? (
            <div
              className="dash-active-path"
              style={{ '--path-color': activePath.color, '--progress-pct': `${activePath.overallPercentage ?? 0}%` }}
              onClick={() => { switchView('paths'); openRoadmapPanel(activePath.id) }}>
              <div className="dash-active-path__row">
                <span className="dash-active-path__icon">{activePath.icon}</span>
                <div className="dash-flex-1">
                  <div className="dash-active-path__title">{activePath.title}</div>
                  <div className="dash-active-path__label">ACTIVE HUNTER PATH</div>
                </div>
                <span className="dash-active-path__pct">{activePath.overallPercentage ?? 0}%</span>
              </div>
              <div className="dash-active-path__track">
                <div className="dash-active-path__fill" />
              </div>
            </div>
          ) : (
            <div className="dash-no-path" onClick={() => switchView('paths')}>
              <div className="dash-no-path__label">Pick a path, start ranking up</div>
              <div className="dash-no-path__cta">→ Choose a Hunter Path to start climbing</div>
            </div>
          )}

          {/* ── Missions overview (accepted / in-progress / accomplished) ── */}
          <Suspense fallback={null}>
            <MissionOverviewCard />
          </Suspense>

          {/* ── C18: saved-for-later study queue (renders only when bookmarks exist) ── */}
          <Suspense fallback={null}>
            <BookmarkQueueCard />
          </Suspense>

          {/* ── C12 + C13: weak-area nudge + personal bests (renders only with real data) ── */}
          <Suspense fallback={null}>
            <LearningInsights />
          </Suspense>

          {/* ── In-progress gates ── */}
          {inProgress.length > 0 && (
            <div>
              <div className="dash-active-hunts__label">ACTIVE HUNTS</div>
              <div className="dash-active-hunts">
                {inProgress.map(s => {
                  const allLearned = s.percentage >= 100
                  return (
                    <div key={s.subjectId} className="dash-hunt-item-wrap">
                      <div
                        className={`dash-hunt-item ${allLearned ? 'dash-hunt-item--ready' : 'dash-hunt-item--active'}`}
                        style={{ '--progress-pct': `${s.percentage}%` }}
                        onClick={() => openSubjectPanel(s.subjectId)}>
                        <span className="dash-hunt-item__icon">{s.icon}</span>
                        <div className="dash-flex-1">
                          <div className="dash-hunt-item__title">{s.title}</div>
                          {allLearned ? (
                            <div className="dash-hunt-item__learned">SKILLS LEARNED</div>
                          ) : (
                            <div className="dash-hunt-item__progress">
                              <div className="dash-progress-track dash-progress-track--sm dash-flex-1">
                                <div className="dash-progress-fill" style={{ '--accent': '#9B6ED4' }} />
                              </div>
                              <span className="dash-hunt-item__pct">{s.percentage}%</span>
                            </div>
                          )}
                        </div>
                        {allLearned ? (
                          <button
                            className="dash-hunt-test-btn"
                            onClick={e => { e.stopPropagation(); startQuiz('subject', s.subjectId, s.title, s.icon) }}
                          >
                            <Trophy size={10} /> TAKE FINAL TEST
                          </button>
                        ) : (
                          <span className="dash-hunt-badge">HUNT</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )
    }

    if (activeView === 'gates') {
      return (
        <>
          <div className="sl-panel-title">All Dungeon Gates</div>
          <div className="dash-search-wrap dash-search-wrap--gates">
            <Search size={13} className="dash-search-icon" />
            <input className="form-input dash-search-input"
              placeholder="Scout gates…" value={gateSearch} onChange={e => setGateSearch(e.target.value)} onKeyDown={blurOnEnter} />
          </div>
          {!gatesLoaded ? (
            <div className="flex-center dash-flex-center-fill--h200"><DungeonPortalLoader panel height={200} /></div>
          ) : filteredSubjects.length === 0 ? (
            <div className="dash-empty-invite">
              <p className="dash-empty-invite__line">No gates match that search — try another, or open them all.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setGateSearch('')}>
                Show all gates
              </button>
            </div>
          ) : (
            <div className="sl-cards-grid dash-cards-grid-2">
              {filteredSubjects.map((s) => (
                <GateCard
                  key={s.id}
                  s={s}
                  quizStatuses={quizStatuses}
                  summaryBadgeMap={summaryBadgeMap}
                  openSubjectPanel={openSubjectPanel}
                  setAboutGate={setAboutGate}
                  startQuiz={startQuiz}
                />
              ))}
            </div>
          )}
        </>
      )
    }

    if (activeView === 'paths') {
      return (
        <>
          <div className="sl-panel-title">Hunter Paths</div>
          <div className="dash-search-wrap dash-search-wrap--paths">
            <Search size={13} className="dash-search-icon" />
            <input className="form-input dash-search-input"
              placeholder="Scout paths…" value={pathSearch} onChange={e => setPathSearch(e.target.value)} onKeyDown={blurOnEnter} />
          </div>
          {!pathsLoaded ? (
            <div className="flex-center dash-flex-center-fill--h200"><DungeonPortalLoader panel height={200} /></div>
          ) : (
            <div className="sl-cards-grid dash-cards-grid-2">
              {filteredRoadmaps.map(r => {
                const pct = r.overallPercentage ?? 0
                const isActive   = r.enrolled && !r.paused
                const isPaused   = r.enrolled && r.paused
                const isComplete = r.allSubjectsDone
                const pathColor  = r.color
                return (
                  <div
                    key={r.id}
                    className={`sl-gate-card dash-path-card${selectedRoadmapId === r.id ? ' is-selected' : ''}`}
                    style={{
                      '--path-color': pathColor,
                      '--path-icon-bg': `${pathColor}22`,
                      '--path-status-border': `${pathColor}40`,
                      '--progress-pct': `${pct}%`,
                      '--gate-bar-bg': isComplete ? pathColor : `${pathColor}88`,
                      '--gate-status-color': isComplete ? pathColor : isPaused ? 'var(--text-muted)' : isActive ? `${pathColor}BB` : '#0cbd09',
                    }}
                    onClick={() => openRoadmapPanel(r.id)}>

                    {/* Title row */}
                    <div className="dash-path-card__top">
                      <div className="dash-path-card__title-row">
                        <div className="dash-path-card__icon-wrap">{r.icon}</div>
                        <div className="sl-gate-title dash-path-card__title">{r.title}</div>
                      </div>
                      <div className="dash-path-card__actions">
                        {r.enrolled && (
                          <span className={`dash-path-card__status ${isPaused ? 'is-paused' : 'is-active'}`}>
                            {isPaused ? 'PAUSED' : 'ACTIVE'}
                          </span>
                        )}
                        <button
                          className="dash-gate-card__info-btn"
                          style={{ '--gate-color': pathColor }}
                          onClick={async e => {
                            e.stopPropagation()
                            // If rich data already loaded, use instantly — no network call
                            const hasRich = r.overview || (r.roleTargets && r.roleTargets.length > 0)
                              || (r.outcomes && r.outcomes.length > 0)
                            if (hasRich) { setAboutRoadmap(r); return }
                            // First time only: fetch detail to get rich fields
                            const fresh = await getRoadmap(r.id).catch(() => null)
                            setAboutRoadmap(fresh ? fresh.data : r)
                          }}
                          title="About this path"
                        >
                          <Info size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Role target */}
                    <div className="dash-path-card__desc">
                      {r.roleTarget}
                    </div>

                    {/* Meta */}
                    <div className="sl-gate-meta">{r.subjectCount ?? '?'} gates · {r.estimatedWeeks}w</div>

                    {/* Progress bar */}
                    {isActive && pct > 0 && (
                      <div className="sl-gate-bar-track dash-path-card__bar">
                        <div className="sl-gate-bar-fill dash-gate-bar-fill--dynamic" />
                      </div>
                    )}

                    {/* Status line */}
                    <div className="sl-gate-status dash-gate-status--dynamic">
                      {isComplete ? 'ALL GATES CLEARED' : isPaused ? 'PATH PAUSED' : isActive ? (pct > 0 ? `IN PROGRESS ${pct}%` : 'PATH ACTIVE') : 'BEGIN YOUR PATH'}
                    </div>

                    {/* Final test button */}
                    {isComplete && (
                      <button
                        className="dash-gate-final-btn dash-gate-final-btn--sm"
                        onClick={e => { e.stopPropagation(); startQuiz('roadmap', r.id, r.title, r.icon) }}
                      >
                        <Trophy size={12} /> TAKE PATH FINAL TEST
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )
    }

    if (activeView === 'badges') {
      const all = allBadges
      const earnedCount = badgesEarnedCount
      return (
        <>
          <div className="sl-panel-title">Your Badges</div>
          <div className="coll-summary">
            <strong>{earnedCount}</strong> of {all.length} earned · locked badges unlock when you clear the gate or path
          </div>
          {!summary ? (
            <div className="flex-center dash-flex-center-fill--h200"><DungeonPortalLoader panel height={200} /></div>
          ) : (
            <div className="badge-grid badge-grid--panel">
              {all.map(b => (
                <div
                  key={b.key}
                  className={`badge-card${b.earned ? '' : ' is-locked'}`}
                  style={{ '--bc': b.earned ? b.color : '#64748b' }}>
                  <div className="badge-card__glow" aria-hidden="true" />
                  <div className="badge-card__medal">
                    <span className="badge-card__medal-icon">{b.earned ? b.icon : '🔒'}</span>
                    <span className="badge-card__medal-ring" aria-hidden="true" />
                  </div>
                  <div className="badge-card__kind">{b.kind}</div>
                  <div className="badge-card__title">{b.title}</div>
                  <div className="badge-card__subtitle">{b.subtitle}</div>
                  <div className={`badge-card__earned${b.earned ? '' : ' is-locked'}`}>
                    {b.earned ? '✓ Earned' : 'Locked'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )
    }

    if (activeView === 'certificates') {
      const all = allCerts
      const earnedCount = certsEarnedCount
      const openCert = (id) => window.open(`/skill-arena/certificates/${id}`, '_blank', 'noopener')
      return (
        <>
          <div className="sl-panel-title">Your Certificates</div>
          <div className="coll-summary">
            <strong>{earnedCount}</strong> of {all.length} earned · click an earned certificate to open &amp; download it
          </div>
          {!certsLoaded || !summary ? (
            <div className="flex-center dash-flex-center-fill--h200"><DungeonPortalLoader panel height={200} /></div>
          ) : (
            <div className="badge-grid badge-grid--panel">
              {all.map(c => {
                const clickable = c.earned && c.certId
                return (
                  <div
                    key={c.key}
                    className={`badge-card${c.earned ? '' : ' is-locked'}${clickable ? ' is-clickable' : ''}`}
                    style={{ '--bc': c.earned ? c.color : '#64748b' }}
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => openCert(c.certId) : undefined}
                    onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCert(c.certId) } } : undefined}>
                    <div className="badge-card__glow" aria-hidden="true" />
                    <div className="badge-card__medal">
                      <span className="badge-card__medal-icon">{c.earned ? c.icon : '🔒'}</span>
                      <span className="badge-card__medal-ring" aria-hidden="true" />
                    </div>
                    <div className="badge-card__kind">{c.kind}</div>
                    <div className="badge-card__title">{c.title}</div>
                    <div className="badge-card__subtitle">{c.earned ? c.code : 'Not earned yet'}</div>
                    <div className={`badge-card__earned${c.earned ? '' : ' is-locked'}`}>
                      {c.earned ? 'View & download ↗' : 'Locked'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )
    }

    if (activeView === 'titles') {
      const currentTitle = titleForLevel(level)
      const earnedCount = LEVEL_TITLES.filter(t => level >= t.level).length
      return (
        <>
          <div className="sl-panel-title">Your Titles</div>
          <div className="coll-summary">
            <strong>{earnedCount}</strong> of {LEVEL_TITLES.length} unlocked · titles unlock automatically as your Hunter Level rises
          </div>
          <div className="badge-grid badge-grid--panel">
            {LEVEL_TITLES.map(t => {
              const earned = level >= t.level
              const isCurrent = earned && currentTitle.level === t.level
              return (
                <div
                  key={t.level}
                  className={`badge-card${earned ? '' : ' is-locked'}`}
                  style={{ '--bc': earned ? t.color : '#64748b' }}>
                  <div className="badge-card__glow" aria-hidden="true" />
                  <div className="badge-card__medal">
                    <span className="badge-card__medal-icon">{earned ? t.icon : '🔒'}</span>
                    <span className="badge-card__medal-ring" aria-hidden="true" />
                  </div>
                  <div className="badge-card__kind">{isCurrent ? 'Current Title' : 'Hunter Title'}</div>
                  <div className="badge-card__title">{t.title}</div>
                  <div className="badge-card__subtitle">{t.level === 1 ? 'Starting title' : `Reach Level ${t.level}`}</div>
                  <div className={`badge-card__earned${earned ? '' : ' is-locked'}`}>
                    {earned ? (isCurrent ? '★ Active' : '✓ Unlocked') : 'Locked'}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )
    }

    if (activeView === 'history') {
      const filtered = filteredHistory
      const passed = historyPassedCount
      return (
        <>
          <div className="sl-panel-title">Test &amp; Trial History</div>
          <div className="hist-stats hist-stats--panel">
            <span className="hist-stat"><strong>{historyItems.length}</strong> attempts</span>
            <span className="hist-stat hist-stat--pass"><strong>{passed}</strong> passed</span>
            <span className="hist-stat hist-stat--fail"><strong>{historyItems.length - passed}</strong> failed</span>
          </div>
          <div className="hist-filters">
            {HIST_FILTERS.map(f => (
              <button
                key={f.id}
                className={`hist-filter${historyFilter === f.id ? ' is-active' : ''}`}
                onClick={() => setHistoryFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          {!historyLoaded ? (
            <div className="flex-center dash-flex-center-fill--h200"><DungeonPortalLoader panel height={200} /></div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty-invite">
              <p className="dash-empty-invite__line">No trials logged yet — your first skill trial starts your track record.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => switchView('gates')}>
                Find a gate to clear
              </button>
            </div>
          ) : (
            <div className="hist-list">
              {filtered.map(a => (
                <div key={a.id} className="hist-row">
                  <span className={`dash-activity-dot ${a.passed ? 'is-pass' : 'is-fail'}`} />
                  <div className="hist-row__main">
                    <div className="hist-row__name">{a.name}</div>
                    <div className="hist-row__meta">
                      <span className="hist-row__type">{HIST_TYPE_LABEL[a.type] || 'Quiz'}</span>
                      <span className="hist-row__date">{fmtHistDate(a.takenAt)}</span>
                    </div>
                  </div>
                  <div className="hist-row__score">
                    <div className="hist-row__score-num">{a.score}/{a.total}</div>
                    <div className="hist-row__score-pct">{a.scorePercent}%</div>
                  </div>
                  <span className={`hist-row__result${a.passed ? ' is-pass' : ' is-fail'}`}>
                    {a.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )
    }
  }

  if (loading) return <SystemAwakeningLoader subtitle="SKILL ARENA" />

  return (
    <div className="sl-dashboard-wrapper">
      <XpFloatLayer floats={xpFloats} />
      {tourOn && (
        <Suspense fallback={null}>
          <OnboardingTour steps={tourSteps} onClose={closeTour} onStep={handleTourStep} />
        </Suspense>
      )}
      {/* ══ QUIZ INSTRUCTIONS MODAL ══ */}
      {quizIntent && (
        <InstructionsModal
          intent={quizIntent}
          onClose={() => setQuizIntent(null)}
          onConfirm={confirmQuiz}
        />
      )}

      {/* ══ HUNTER PROFILE DRAWER (desktop + mobile Hunter Profile button) ══ */}
      {/* Statically imported (see top of file) — opens instantly, no Suspense/loading flash. */}
      {avatarOpen && (
        <HunterProfileDrawer user={user} rank={rank} level={level} xp={xp}
          onClose={() => setAvatarOpen(false)} onLogout={logout} />
      )}

      {/* ══ MOBILE: avatar action sheet ══ */}
      {mobileAvatarMenu && (
        <MobileAvatarMenu
          rank={rank} user={user} initials={initials} level={level} xp={xp}
          onClose={() => setMobileAvatarMenu(false)}
          onStatsOpen={() => setMobilePopup('stats')}
          onBadgesOpen={() => switchView('badges')}
          onCertsOpen={() => switchView('certificates')}
          onTitlesOpen={() => switchView('titles')}
          onQuestsOpen={() => setMobilePopup('quests')}
          onProfileOpen={() => setAvatarOpen(true)}
          onLogout={logout}
        />
      )}

      {/* ══ MOBILE: Stats popup ══ */}
      {mobilePopup === 'stats' && (
        <MobileStatsPopup user={user} rank={rank} level={level} xp={xp} stats={stats}
          streak={summary?.streak ?? 0} shields={summary?.shields ?? 0} onClose={() => setMobilePopup(null)} />
      )}

      {/* ══ MOBILE: Daily Quests popup ══ */}
      {mobilePopup === 'quests' && (
        <MobileQuestsPopup questList={questList} doneCount={doneCount} totalQuests={totalQuests}
          earnedXp={earnedXp} onClose={() => setMobilePopup(null)} />
      )}

      {/* ══ NAVBAR ══ */}
      <nav className="sl-dash-nav">

        {/* Mobile: hamburger on LEFT */}
        <button
          className={`sl-mob-menu-btn dash-mob-menu-btn ${mobileMenuOpen ? 'is-open' : 'is-closed'}`}
          onClick={() => setMobileMenuOpen(o => !o)}>
          <Menu size={18} />
        </button>

        {/* Desktop: ARISE logo */}
        <div className="sl-dash-nav-logo" onClick={() => navigate('/')}>ARISE</div>

        {/* Mobile: current section name (center) */}
        <div className="sl-mob-section-title">
          {NAV_ITEMS.find(i => i.view === activeView)?.label
            || (activeView === 'badges' ? 'Badges'
              : activeView === 'history' ? 'History'
              : activeView === 'certificates' ? 'Certificates'
              : activeView === 'titles' ? 'Titles' : 'ARISE')}
        </div>

        {/* Desktop nav links */}
        <div className="sl-dash-nav-links">
          {NAV_ITEMS.map(item => (
            <button key={item.label} data-tour-nav={item.view} className={`sl-nav-link${activeView === item.view ? ' active' : ''}`}
              onClick={() => item.href ? navigate(item.href) : switchView(item.view)}>
              <span className="sl-nav-link__label">{item.label}</span>
              {item.sub && <span className="sl-nav-link__sub">{item.sub}</span>}
            </button>
          ))}
        </div>

        {/* Desktop right */}
        <div className="sl-dash-nav-right">
          <button className="theme-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="sl-nav-xp">
            <span className="sl-nav-xp-label">XP → LVL {level}</span>
            <div className="xp-bar-track dash-nav-xp-bar">
              <div
                className="xp-bar-fill dash-nav-xp-fill"
                style={{ '--progress-pct': `${levelPct}%`, '--rank-color': rank.color }}
              />
            </div>
          </div>
          <span className={`rank-badge dash-nav-rank-badge ${rank.cls}`}>{rank.label}-RANK</span>
          <div
            className="sl-nav-avatar dash-nav-avatar--dynamic"
            style={{ '--avatar-bg': user?.avatarColor || '#9B6ED4', '--rank-color': rank.color }}
            onClick={handleAvatarClick}>{initials}</div>
        </div>

        {/* Mobile: theme toggle + avatar on RIGHT */}
        <button className="sl-mob-theme-btn dash-mob-theme-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <div
          className="sl-mob-avatar dash-nav-avatar--dynamic"
          style={{ '--avatar-bg': user?.avatarColor || '#9B6ED4', '--rank-color': rank.color }}
          onClick={handleAvatarClick}>{initials}</div>
      </nav>

      {/* ══ MOBILE NAV DROPDOWN (slides down from LEFT-anchored hamburger) ══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileNavDrawer
            navItems={NAV_ITEMS}
            activeView={activeView}
            onSelect={(item) => { item.href ? navigate(item.href) : switchView(item.view); setMobileMenuOpen(false) }}
            onClose={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ══ BODY ══ */}
      <div className="sl-dashboard-body">
        <div className="sl-alert-banner">
          <span className="sl-alert-tag">[ SYSTEM ]</span>
          <span className="sl-alert-msg">
            {selectedConceptId
              ? <>Skill detail loaded — complete the Skill trial <span className="sl-alert-plain">(quiz)</span> to master this skill.</>
              : activeView === 'gates'
              ? <>Scout mode active — <strong>{filteredSubjects.length} gates</strong> <span className="sl-alert-plain">(subjects)</span> detected.</>
              : activeView === 'paths'
              ? <>Hunter path registry — <strong>{allRoadmaps.length} paths</strong> <span className="sl-alert-plain">(career roadmaps)</span> available.</>
              : hasProgress
              ? <>{greetLabel}, <strong>{firstName}</strong>.{streakCount > 0 && <> <StreakFlame count={streakCount} size={14} /></>} <span className="sl-alert-plain">— {milestoneText}</span></>
              : <>Welcome, Hunter <strong>{firstName}</strong>. Choose a dungeon gate <span className="sl-alert-plain">(subject)</span> to begin.</>}
          </span>
        </div>

        {selectedConceptId ? (
          /* ══ CONCEPT MODE: 2-col (skills | concept), quests hidden ══ */
          <div className="sl-dashboard-grid sl-grid-concept">
            <SubjectPanel
              key={`${selectedSubjectId}-${panelRefreshKey}`}
              mode="grid"
              subjectId={selectedSubjectId}
              onClose={closeSubjectPanel}
              onSkillClick={openConcept}
              selectedConceptId={selectedConceptId}
              navigate={navigate}
              startQuiz={startQuiz}
            />
            <div className="sl-panel dash-panel-scroll">
              <Suspense fallback={<DungeonPortalLoader panel height={280} />}>
                <ConceptInlinePanel
                  conceptId={selectedConceptId}
                  navList={conceptNavList}
                  onClose={handleConceptClose}
                  navigate={navigate}
                  startQuiz={startQuiz}
                  subjectTitle={subjects.find(s => s.id === selectedSubjectId)?.title || ''}
                />
              </Suspense>
            </div>
          </div>
        ) : (
          /* ══ NORMAL MODE: 3-col (status | gates | quests+rank) ══ */
          <div className="sl-dashboard-grid">
            {/* ═ LEFT: STATUS WINDOW — hidden on mobile (access via avatar) ═ */}
            <div className="sl-panel sl-dash-left-panel">
              <div className="sl-panel-title">Status Window</div>
              <div className="sl-hunter-level-num">{level}</div>
              <div className="sl-hunter-level-label">HUNTER LEVEL</div>
              <div className="sl-power-xp">POWER: <CountUp value={xp} format={(n) => n.toLocaleString()} /> XP</div>
              {(summary?.streak ?? 0) > 0 && (
                <div className="sl-power-streak">
                  <StreakFlame count={summary.streak} size={15} shields={summary?.shields ?? 0} /> day streak
                </div>
              )}

              {stats.map(stat => {
                const isUntouched = stat.totalAll === 0
                const statColor = stat.statColor
                return (
                  <div key={stat.key} className="sl-stat-row">
                    {/* Header row: name + rank badge + pct */}
                    <div className="dash-stat-row-header">
                      <span className="sl-stat-name">{stat.label}</span>
                      {!isUntouched && (
                        <span className="sl-stat-value dash-stat-value--dynamic" style={{ '--stat-color': statColor }}>{stat.pct}%</span>
                      )}
                    </div>

                    {/* Dynamic subject tags — cleared ones highlighted */}
                    <div className="sl-stat-tags dash-stat-tags">
                      {isUntouched ? (
                        <span className="dash-stat-hint">{stat.hint}</span>
                      ) : stat.cleared.length > 0 ? (
                        <span className="dash-stat-cleared" style={{ '--stat-color': statColor }}>{stat.cleared.slice(0, 2).join(' · ')}{stat.cleared.length > 2 ? ` +${stat.cleared.length - 2}` : ''}</span>
                      ) : stat.inProgress.length > 0 ? (
                        <span className="dash-stat-progress">{stat.inProgress[0].title}</span>
                      ) : (
                        <span className="dash-stat-hint">{stat.hint}</span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div
                      className="sl-stat-track dash-stat-track--dynamic"
                      style={{ '--track-mb': isUntouched ? 0 : '0.2rem' }}
                    >
                      <div
                        className="sl-stat-fill dash-stat-fill--dynamic"
                        style={{
                          '--progress-pct': `${isUntouched ? 0 : stat.pct}%`,
                          '--stat-color': statColor,
                          '--stat-color-50': `${statColor}50`,
                          '--stat-glow': stat.pct > 0 ? `0 0 6px ${statColor}55` : 'none',
                        }}
                      />
                    </div>

                    {/* Concepts count + next gate nudge */}
                    {!isUntouched && (
                      <div className="dash-stat-meta">
                        <span className="dash-stat-count">
                          {stat.totalDone}/{stat.totalAll} skills
                        </span>
                        {stat.next && stat.pct < 100 && (
                          <span
                            className="dash-stat-next"
                            style={{ '--stat-color': statColor }}
                            onClick={() => { switchView('gates') }}>
                            → {stat.next.title.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* ── Badges + Certificates entry ── */}
              <div className="dash-badges-section">
                <div className="dash-badges-actions">
                  <button
                    className={`dash-badges-cert-link${activeView === 'badges' ? ' is-active' : ''}`}
                    onClick={() => switchView('badges')}>
                    🎖️ Badges →
                  </button>
                  <button
                    className={`dash-badges-cert-link${activeView === 'certificates' ? ' is-active' : ''}`}
                    onClick={() => switchView('certificates')}>
                    🎓 Certificates →
                  </button>
                  <button
                    className={`dash-badges-cert-link${activeView === 'titles' ? ' is-active' : ''}`}
                    onClick={() => switchView('titles')}>
                    🏅 Titles →
                  </button>
                </div>
              </div>
            </div>

            {/* ═ MIDDLE: gate views ═ */}
            <div className="sl-panel dash-panel-scroll">
              {renderMiddle()}
            </div>

            {/* ═ RIGHT: DAILY QUESTS + RANK — hidden on mobile (access via avatar) ═ */}
            <div className="sl-dash-right-panel dash-right-panel">
              <div className="sl-panel">
                <div className="sl-panel-title">Daily Quests</div>
                {questList.map(q => {
                  const mins       = q.targetSeconds ? Math.floor((q.progressSeconds || 0) / 60) : null
                  const targetMins = q.targetSeconds ? Math.round(q.targetSeconds / 60) : null
                  return (
                    <div key={q.id} className="sl-quest-item">
                      <div className={`sl-quest-check${q.done ? ' done' : ''}`}>
                        {q.done && <CheckCircle size={9} color="#9B6ED4" />}
                      </div>
                      <span className={`sl-quest-label${q.done ? ' done' : ''}`}>
                        {q.label}
                        {q.targetSeconds != null && !q.done && (
                          <span className="sl-quest-progress"> · {mins}/{targetMins}m</span>
                        )}
                      </span>
                      <span className="sl-quest-xp">+{q.xp} XP</span>
                    </div>
                  )
                })}
                <div className="sl-quest-summary">{doneCount} / {totalQuests} QUESTS DONE · +{earnedXp} XP</div>
              </div>

              {/* Recent test/trial activity — quick glance + link to full history */}
              <div className="sl-panel dash-activity-panel">
                <div className="sl-panel-title-row">
                  <div className="sl-panel-title">Recent Activity</div>
                  <button className="dash-activity-more" onClick={() => switchView('history')}>
                    View all →
                  </button>
                </div>
                {recentHistory.length === 0 ? (
                  <div className="dash-activity-empty">
                    <span>No trials yet — clear your first skill to start your streak.</span>
                    <button type="button" className="dash-activity-more dash-activity-empty__cta" onClick={() => switchView('gates')}>
                      Find a gate →
                    </button>
                  </div>
                ) : (
                  recentHistory.map(a => (
                    <div key={a.id} className="dash-activity-item">
                      <span className={`dash-activity-dot${a.passed ? ' is-pass' : ' is-fail'}`} />
                      <span className="dash-activity-name" title={a.name}>{a.name}</span>
                      <span className="dash-activity-score">{a.score}/{a.total}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ ROADMAP PANEL: right overlay on path card click ══ */}
      {selectedRoadmapId && !selectedSubjectId && !selectedConceptId && (
        <Suspense fallback={<DungeonPortalLoader panel height={320} />}>
          <RoadmapPanel
            roadmapId={selectedRoadmapId}
            onClose={closeRoadmapPanel}
            onGateClick={openSubjectPanel}
            navigate={navigate}
            startQuiz={startQuiz}
          />
        </Suspense>
      )}

      {/* ══ SUBJECT PANEL: right overlay when gate clicked (closes roadmap panel) ══ */}
      {selectedSubjectId && !selectedConceptId && (
        <Suspense fallback={<DungeonPortalLoader panel height={320} />}>
          <SubjectPanel
          key={`${selectedSubjectId}-${panelRefreshKey}`}
          mode="overlay"
          subjectId={selectedSubjectId}
          onClose={closeSubjectPanel}
          onSkillClick={openConcept}
          selectedConceptId={selectedConceptId}
          navigate={navigate}
          startQuiz={startQuiz}
        />
        </Suspense>
      )}

      {/* ══ ABOUT GATE MODAL ══ */}
      {aboutRoadmap && (
        <AboutRoadmapModal roadmap={aboutRoadmap} onClose={() => setAboutRoadmap(null)} />
      )}
      {aboutGate && (
        <AboutGateModal subject={aboutGate} onClose={() => setAboutGate(null)} />
      )}
    </div>
  )
}

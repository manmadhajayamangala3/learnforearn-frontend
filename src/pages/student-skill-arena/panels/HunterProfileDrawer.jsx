import { useEffect, useState } from 'react'
import { X, LogOut, UserPlus, Check, Flame, Shield } from 'lucide-react'
import useBodyLock from '../../../hooks/useBodyLock'
import useModalA11y from '../../../hooks/useModalA11y'
import { RANK_LADDER } from '../../../constants/ranks'
import { isGuest } from '../../../utils/auth'
import { getRankProgress } from '../../../api/api'
import { RANK_REQ_TIERS, RANK_ORDER, haveFor } from '../../../utils/rankReqs'
import RegisterCTA from '../../../components/RegisterCTA'
import { CONCEPT_XP_RANGE, QUIZ_XP } from '../../../utils/quizXp'
import { LEVEL_TITLES, titleForLevel, cumulativeXpForLevel } from '../../../utils/slLevel'
import '../../../styles/pages/shared/certificates.css'

// Plain-language glossary for the 3 core themed words a newcomer meets first.
const GLOSSARY = [
  {
    word: 'Skill', plain: 'One lesson / topic', color: '#4ADE80',
    desc: 'The smallest step. One thing you learn — like "CSS Flexbox" or "Java Loops" — followed by a short quiz. (Also shown as a "concept".)',
  },
  {
    word: 'Dungeon Gate', plain: 'A Subject', color: '#60A5FA',
    desc: 'A full subject made up of many skills — such as HTML, JavaScript, or Java. Learn all the skills inside it to master the subject and earn its badge.',
  },
  {
    word: 'Hunter Path', plain: 'A Career Roadmap', color: '#9B6ED4',
    desc: 'A guided, ordered set of subjects for a specific job — like Java Full Stack or MERN. Follow it start to finish to go from beginner to job-ready.',
  },
]

// Shorter one-line words to round out the vocabulary.
const QUICK_WORDS = [
  { k: 'Trial', v: 'a quiz you take to clear a skill or subject' },
  { k: 'XP', v: 'points you earn for passing quizzes & solving problems' },
  { k: 'Level', v: 'grows purely from the XP you earn' },
  { k: 'Rank (E → S)', v: 'earned across skills, coding, mocks, paths & missions' },
  { k: 'Badge', v: 'proof you finished a subject or roadmap' },
]

const HOW_IT_WORKS = [
  { num: '01', color: '#9B6ED4', title: 'Pick a Hunter Path (career roadmap)', desc: 'Open the HUNTER PATH tab and choose a roadmap for the job you want — Java Full Stack, MERN, Python, or Frontend. It lays out the subjects to learn, in the right order.' },
  { num: '02', color: '#60A5FA', title: 'Enter a Dungeon Gate (subject)', desc: 'Open the DUNGEON GATE tab. Each gate is one subject (HTML, CSS, JavaScript…). Go in and learn its skills one by one, at your own pace.' },
  { num: '03', color: '#F59E0B', title: 'Clear skills & earn XP', desc: `Read each skill, then pass its quiz (${QUIZ_XP.concept.pass} out of ${QUIZ_XP.concept.total} to clear). Earn ${QUIZ_XP.concept.base}–${QUIZ_XP.concept.base + (QUIZ_XP.concept.total - QUIZ_XP.concept.pass) * QUIZ_XP.concept.perPoint} XP per skill — the first one each day gives a +${QUIZ_XP.concept.dailyBonus} bonus.` },
]

const XP_TIPS = [
  `First skill cleared today gives +${QUIZ_XP.concept.dailyBonus} bonus XP`,
  `Skill trial: ${CONCEPT_XP_RANGE} (${QUIZ_XP.concept.pass} pass → ${QUIZ_XP.concept.base}, +${QUIZ_XP.concept.perPoint} per extra correct)`,
  'Clear all skills in a gate to unlock the gate final test and badge',
  'Enroll a Hunter Path to track your full career progress',
]

// What it takes to accomplish a mission. Mirrors MissionDetailPage / the board.
const MISSION_REQS = [
  'Open the MISSIONS tab and build the project to its objectives',
  'Connect your GitHub, then submit your public repository link',
  'Deploy it live and submit the demo URL — proof it actually runs',
  'A mission is Accomplished once you submit at least one link',
  'Each repo links to one mission only — build something new for each',
]

// Daily-streak milestones — mirrors backend StreakService (bonus XP awarded once per run).
const STREAK_MILESTONES = [
  { day: 3,  xp: 25,  color: '#4ADE80', label: 'Habit forming' },
  { day: 7,  xp: 50,  color: '#60A5FA', label: 'One week strong', shield: true },
  { day: 14, xp: 100, color: '#9B6ED4', label: 'Two weeks unbroken', shield: true },
  { day: 30, xp: 200, color: '#F59E0B', label: 'A full month' },
]

// Mission-link XP by rank — mirrors backend MissionSubmissionService (repo / live demo).
const MISSION_XP = [
  { rank: 'D', repo: 40,  demo: 50,  color: '#4ADE80' },
  { rank: 'C', repo: 60,  demo: 90,  color: '#60A5FA' },
  { rank: 'B', repo: 100, demo: 140, color: '#9B6ED4' },
  { rank: 'A', repo: 140, demo: 220, color: '#F59E0B' },
  { rank: 'S', repo: 200, demo: 340, color: '#EF4444' },
]

function SectionTitle({ children }) {
  return (
    <div className="dash-section-divider">
      <div className="dash-section-divider__line" />
      <span className="dash-section-divider__label">{children}</span>
      <div className="dash-section-divider__line" />
    </div>
  )
}

export default function HunterProfileDrawer({ user, rank, level = 1, onClose, onLogout }) {
  useBodyLock()
  const drawerRef = useModalA11y(onClose)
  const currentTitle = titleForLevel(level)
  const curRankIdx = Math.max(0, RANK_LADDER.findIndex(r => r.letter === rank.label))

  // Live pillar counts for the rank-progression checklist. Fetched once when the drawer opens
  // (guests have no persisted rank progress, so we skip and fall back to the static list).
  const [rankProg, setRankProg] = useState(null)
  useEffect(() => {
    if (isGuest(user)) return undefined
    let alive = true
    getRankProgress()
      .then(res => { if (alive) setRankProg(res.data) })
      .catch(() => { /* keep static fallback on error */ })
    return () => { alive = false }
  }, [user])

  return (
    <>
      <div onClick={onClose} className="dash-overlay-backdrop dash-overlay-backdrop--drawer" />

      <div ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="hunter-drawer-title" className="dash-hunter-drawer">
        <div className="dash-hunter-drawer__header">
          <span id="hunter-drawer-title" className="dash-hunter-drawer__title">[ HUNTER INSTRUCTIONS ]</span>
          <button type="button" aria-label="Close" onClick={onClose} className="dash-icon-btn"><X size={16} /></button>
        </div>

        <div className="dash-hunter-drawer__body">
          <div>
            <SectionTitle>ABOUT LEARNFOREARN</SectionTitle>
            <div className="dash-hunter-about-card">
              <p className="dash-hunter-about-card__text">
                LearnForEarn is a learning platform with a Solo Leveling (anime) theme — so you level up your tech skills like a game character. Don't worry if you don't know the anime: the game words simply stand for normal learning terms, explained right below.
              </p>
              <div className="dash-hunter-about-card__tags">Learn · Earn XP · Badges · Get Job-Ready</div>
            </div>
          </div>

          <div>
            <SectionTitle>WHAT THE WORDS MEAN</SectionTitle>
            <div className="dash-hunter-glossary">
              {GLOSSARY.map(g => (
                <div
                  key={g.word}
                  className="dash-hunter-term"
                  style={{ '--term-color': g.color, '--term-bg': `${g.color}14`, '--term-border': `${g.color}38` }}
                >
                  <div className="dash-hunter-term__head">
                    <span className="dash-hunter-term__word">{g.word}</span>
                    <span className="dash-hunter-term__eq">means</span>
                    <span className="dash-hunter-term__plain">{g.plain}</span>
                  </div>
                  <div className="dash-hunter-term__desc">{g.desc}</div>
                </div>
              ))}
            </div>
            <div className="dash-hunter-words">
              {QUICK_WORDS.map(w => (
                <div key={w.k} className="dash-hunter-word">
                  <span className="dash-hunter-word__k">{w.k}</span>
                  <span className="dash-hunter-word__v">{w.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>HOW ARISE WORKS</SectionTitle>
            <div className="dash-hunter-steps">
              {HOW_IT_WORKS.map(s => (
                <div key={s.num} className="dash-hunter-step" style={{ '--step-color': s.color, '--step-bg': `${s.color}18`, '--step-border': `${s.color}40` }}>
                  <div className="dash-hunter-step__num">{s.num}</div>
                  <div>
                    <div className="dash-hunter-step__title">{s.title}</div>
                    <div className="dash-hunter-step__desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>HOW TO EARN BADGES</SectionTitle>
            <div className="dash-hunter-badge-guide">
              {[
                {
                  icon: '🏆', color: '#F59E0B', title: 'Gate Badge',
                  steps: [
                    'Enter a Dungeon Gate and clear all skills inside it',
                    'Once all skills are learned, the "Take Final Test" button unlocks',
                    'Pass the gate final test (31/40) to earn the subject badge',
                  ],
                },
                {
                  icon: '🎖️', color: '#9B6ED4', title: 'Hunter Path Badge',
                  steps: [
                    'Enroll in a Hunter Path from the HUNTER PATH tab',
                    'Earn gate badges for every subject in the path',
                    'Once all gates are closed, the Path Final Trial unlocks',
                    'Pass the roadmap final test to earn the path badge',
                  ],
                },
              ].map(b => (
                <div key={b.title} className="dash-hunter-badge-card" style={{ '--badge-color': b.color, '--badge-bg': `${b.color}0A`, '--badge-border': `${b.color}25` }}>
                  <div className="dash-hunter-badge-card__header">
                    <span className="dash-hunter-badge-card__icon">{b.icon}</span>
                    <span className="dash-hunter-badge-card__title">{b.title}</span>
                  </div>
                  <div className="dash-hunter-badge-card__steps">
                    {b.steps.map((step, i) => (
                      <div key={i} className="dash-hunter-badge-step">
                        <span className="dash-hunter-badge-step__num">0{i + 1}</span>
                        <span className="dash-hunter-badge-step__text">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>HOW TO ACCOMPLISH MISSIONS</SectionTitle>
            <div className="dash-hunter-mission">
              <p className="dash-hunter-mission__intro">
                Missions are real projects you build. Submit your work to accomplish one and earn XP —
                a great proof of skill for recruiters.
              </p>
              <div className="dash-hunter-mission__reqs">
                {MISSION_REQS.map((r, i) => (
                  <div key={i} className="dash-hunter-badge-step">
                    <span className="dash-hunter-badge-step__num">0{i + 1}</span>
                    <span className="dash-hunter-badge-step__text">{r}</span>
                  </div>
                ))}
              </div>
              <div className="dash-hunter-mission__xp">
                <div className="dash-hunter-mission__xp-title">[ XP EARNED · BY MISSION RANK ]</div>
                <div className="dash-hunter-mission__row dash-hunter-mission__row--head">
                  <span>RANK</span>
                  <span>REPOSITORY</span>
                  <span>LIVE DEMO</span>
                </div>
                {MISSION_XP.map(r => (
                  <div key={r.rank} className="dash-hunter-mission__row" style={{ '--rank-color': r.color }}>
                    <span className="dash-hunter-mission__rank">{r.rank}-Rank</span>
                    <span className="dash-hunter-mission__val">+{r.repo} XP</span>
                    <span className="dash-hunter-mission__val dash-hunter-mission__val--demo">+{r.demo} XP</span>
                  </div>
                ))}
              </div>
              <p className="dash-hunter-mission__note">
                A live demo pays more than the repo. XP is granted once per link and reversed if you remove it.
              </p>
            </div>
          </div>

          <div>
            <SectionTitle>HUNTER LEVEL &amp; TITLES</SectionTitle>
            <div className="dash-hunter-about-card">
              <p className="dash-hunter-about-card__text">
                Your <strong>Level</strong> rises purely from <strong>XP</strong> — every trial, coding problem, mock and mission adds up. The more you earn, the higher you climb. Reaching milestone levels grants a <strong>Title</strong>. (Your <strong>Rank</strong> is separate — see below.)
              </p>
              <div className="dash-hunter-about-card__tags">
                You are Level {level} · {currentTitle.icon} {currentTitle.title}
              </div>
            </div>
            <div className="dash-hunter-ranks">
              {LEVEL_TITLES.map(t => {
                const reached = level >= t.level
                const isCurrent = reached && currentTitle.level === t.level
                return (
                  <div
                    key={t.level}
                    className={`dash-hunter-rank-row${isCurrent ? ' is-current' : ''}${!reached ? ' is-locked' : ''}`}
                    style={{ '--rank-color': t.color, '--rank-bg': `${t.color}10`, '--rank-border': `${t.color}35`, '--rank-letter-bg': `${t.color}18` }}
                  >
                    <div className="dash-hunter-rank-row__letter">{t.icon}</div>
                    <div className="dash-hunter-rank-row__info">
                      <span className="dash-hunter-rank-row__label">{t.title}</span>
                      <span className="dash-hunter-rank-row__xp">{t.level === 1 ? 'START' : `Lv ${t.level} · ${cumulativeXpForLevel(t.level).toLocaleString()} XP`}</span>
                    </div>
                    {isCurrent && <span className="dash-hunter-rank-row__now">NOW</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <SectionTitle>DAILY STREAK &amp; REWARDS</SectionTitle>
            <div className="dash-hunter-about-card">
              <p className="dash-hunter-about-card__text">
                Your <strong>streak</strong> counts every day you do <strong>anything</strong> that moves you forward —
                clear a skill, pass a trial, take an aptitude mock, solve a coding problem, or accomplish a mission.
                Any <strong>one</strong> action before midnight keeps the flame alive; miss a whole day and it resets.
              </p>
              <div className="dash-hunter-about-card__tags">
                {rankProg && Number(rankProg.streak) > 0
                  ? <>🔥 Current streak · {rankProg.streak} {Number(rankProg.streak) === 1 ? 'day' : 'days'}</>
                  : <>🔥 Do one action today to start your streak</>}
                {rankProg && Number(rankProg.shields) > 0 && (
                  <> · 🛡️ {rankProg.shields} shield{Number(rankProg.shields) === 1 ? '' : 's'} held</>
                )}
              </div>
            </div>
            <div className="dash-hunter-mission__xp">
              <div className="dash-hunter-mission__xp-title">[ MILESTONE REWARDS ]</div>
              <div className="dash-hunter-mission__row dash-hunter-mission__row--head">
                <span>STREAK</span>
                <span>REWARD</span>
                <span>MILESTONE</span>
              </div>
              {STREAK_MILESTONES.map(m => {
                const reached = rankProg && Number(rankProg.streak) >= m.day
                return (
                  <div
                    key={m.day}
                    className={`dash-hunter-mission__row${reached ? ' is-met' : ''}`}
                    style={{ '--rank-color': m.color }}
                  >
                    <span className="dash-hunter-mission__rank">
                      <Flame size={12} strokeWidth={2.5} /> Day {m.day}
                    </span>
                    <span className="dash-hunter-mission__val">
                      +{m.xp} XP{m.shield && <> · <Shield size={11} strokeWidth={2.5} /></>}
                    </span>
                    <span className="dash-hunter-mission__val dash-hunter-mission__val--demo">{m.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="dash-hunter-mission__note">
              Bonus XP is granted once each time you reach a milestone. Days 7 and 14 each grant a Streak Shield
              (hold up to 2) — if you miss a single day, one is spent automatically to keep your streak alive.
            </p>
          </div>

          <div>
            <SectionTitle>RANK PROGRESSION GUIDE</SectionTitle>
            <div className="dash-hunter-about-card">
              <p className="dash-hunter-about-card__text">
                <strong>Rank</strong> is your overall class — earned across <strong>every</strong> activity, not XP alone. Each tier below needs <strong>all</strong> of its conditions met. Everyone starts at <strong>E-Rank</strong>, and rank is <strong>raise-only</strong> — once earned, it never drops.
              </p>
            </div>
            <div className="dash-hunter-ranks">
              {RANK_LADDER.map((r, idx) => {
                const isCurrent = r.letter === rank.label
                const isUnlocked = idx <= curRankIdx
                return (
                  <div
                    key={r.letter}
                    className={`dash-hunter-rank-row${isCurrent ? ' is-current' : ''}${!isUnlocked ? ' is-locked' : ''}`}
                    style={{ '--rank-color': r.color, '--rank-bg': `${r.color}10`, '--rank-border': `${r.color}35`, '--rank-letter-bg': `${r.color}18` }}
                  >
                    <div className="dash-hunter-rank-row__letter">{r.letter}</div>
                    <div className="dash-hunter-rank-row__info">
                      <span className="dash-hunter-rank-row__label">{r.label}</span>
                      <span className="dash-hunter-rank-row__xp">{r.min === 0 ? 'START' : `${r.min.toLocaleString()}+ XP · +more`}</span>
                    </div>
                    {isCurrent && <span className="dash-hunter-rank-row__now">NOW</span>}
                  </div>
                )
              })}
            </div>
            <div className="dash-hunter-badge-guide">
              {RANK_REQ_TIERS.map(tier => {
                const tierIdx = RANK_ORDER.indexOf(tier.letter)
                const earned = tierIdx <= curRankIdx
                const isNext = tierIdx === curRankIdx + 1
                const rows = tier.atoms.map(a => {
                  const have = haveFor(rankProg, a)
                  const met = earned || (have !== null && have >= (a.bool ? 1 : a.need))
                  return { atom: a, have, met }
                })
                const done = rankProg ? rows.filter(r => r.met).length : 0
                const total = rows.length
                const cls = `dash-hunter-rank-card${earned ? ' is-earned' : ''}${isNext ? ' is-next' : ''}`
                return (
                  <div key={tier.letter} className={cls} style={{ '--badge-color': tier.color, '--badge-bg': `${tier.color}0A`, '--badge-border': `${tier.color}25` }}>
                    <div className="dash-hunter-rank-card__header">
                      <span className="dash-hunter-badge-card__icon">{tier.letter}</span>
                      <span className="dash-hunter-badge-card__title">{tier.letter}-Rank · {tier.xp}+ XP</span>
                      {rankProg && (
                        <span className="dash-hunter-rank-card__status">
                          {earned ? 'EARNED' : isNext ? `NEXT · ${done}/${total}` : `${done}/${total}`}
                        </span>
                      )}
                    </div>
                    <div className="dash-hunter-badge-card__steps">
                      {rows.map(({ atom, have, met }, i) => (
                        <div key={i} className={`dash-hunter-req${met ? ' is-met' : ''}${!met && rankProg && isNext ? ' is-todo' : ''}`}>
                          <span className="dash-hunter-req__mark">{met ? <Check size={12} strokeWidth={3} /> : '○'}</span>
                          <span className="dash-hunter-req__text">{atom.label}</span>
                          {have !== null && (
                            <span className="dash-hunter-req__count">
                              {atom.bool
                                ? (met ? 'Complete' : 'Not yet')
                                : `${Number(have).toLocaleString()}${atom.suffix || ''} / ${atom.need.toLocaleString()}${atom.suffix || ''}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="dash-hunter-xp-tips">
              <div className="dash-hunter-xp-tips__title">[ XP TIPS ]</div>
              {XP_TIPS.map((tip, i) => (
                <div key={i} className="dash-hunter-xp-tip">
                  <span className="dash-hunter-xp-tip__bullet">›</span>{tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sl-drawer-exit-footer dash-hunter-drawer__footer">
          {isGuest(user) && (
            <div className="dash-guest-note dash-guest-note--purple">
              <span className="dash-guest-note__highlight">Guest session</span> — your XP and progress won't be saved permanently.
              <RegisterCTA
                className="dash-guest-cta"
                icon={<UserPlus size={13} />}
                onClick={onClose}
              />
            </div>
          )}
          <div className="dash-hunter-drawer__actions">
            <button onClick={() => { window.location.href = '/' }} className="dash-hunter-exit-btn">
              ← EXIT ARENA
            </button>
            <button onClick={onLogout} className="dash-hunter-logout-btn">
              <LogOut size={13} /> EXIT SYSTEM
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

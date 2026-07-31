import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Flame, Target, Clock, BookOpen, CheckCircle2, ArrowRight, RotateCcw, Sparkles, Code2, Calculator } from 'lucide-react'
import { getLearningInsights } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import CountUp from '../../components/CountUp'
import { EASE } from '../../utils/motion'

// C12 (weak-area) + C13 (personal bests) — one dashboard block, one fetch. Every value is
// server-computed from real attempts/progress (never fabricated). Weak-area now spans ALL
// practice domains — concept trials, coding problems, and aptitude mocks — surfacing the
// most-severe spot per domain (stuck signal ≥2 attempts, never cleared). Personal bests are
// truthful records only — fastest-quiz and most-XP/day are deliberately absent (not tracked).
function fmtDuration(m) {
  const mins = Math.max(0, Math.round(m))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const r = mins % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

const conceptLessonLink = (c) => `/skill-arena/dashboard?view=gates&subject=${encodeURIComponent(c.subjectId || '')}&concept=${encodeURIComponent(c.conceptId)}`
const conceptQuizLink = (c) => `/skill-arena/quiz/concept/${encodeURIComponent(c.conceptId)}`

// Turn a server weak-spot into the domain-specific icon, headline, sub-line and actions.
function describeSpot(s) {
  const subj = s.subjectTitle ? ` · ${s.subjectTitle}` : ''
  if (s.domain === 'coding') {
    return {
      Icon: Code2,
      title: `Stuck on ${s.title}?`,
      sub: `${s.attempts} submissions, not solved yet${subj}`,
      actions: [{ label: 'Open problem', icon: Code2, to: `/code-gym/${encodeURIComponent(s.problemId)}`, primary: true }],
    }
  }
  if (s.domain === 'aptitude') {
    return {
      Icon: Calculator,
      title: 'Aptitude mock not cracked yet',
      sub: `${s.accuracy}% best over ${s.attempts} attempts`,
      actions: [
        { label: 'Retake mock', icon: RotateCcw, to: '/aptitude/mock', primary: true },
        { label: 'Practice topics', icon: Target, to: '/aptitude' },
      ],
    }
  }
  // concept (default)
  return {
    Icon: BookOpen,
    title: s.kind === 'stuck' ? `Stuck on ${s.title}?` : `Weakest area: ${s.title}`,
    sub: s.kind === 'stuck'
      ? `${s.attempts} attempts, not cleared yet${subj}`
      : `${s.accuracy}% accuracy over ${s.attempts} trials${subj}`,
    actions: [
      { label: 'Review concept', icon: Sparkles, to: conceptLessonLink(s), primary: true },
      { label: 'Retake trial', icon: RotateCcw, to: conceptQuizLink(s) },
    ],
  }
}

export default function LearningInsights() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { user } = useAuth()
  const isGuest = !user || user.role === 'GUEST'
  const [data, setData] = useState(null)

  useEffect(() => {
    if (isGuest) return undefined
    let alive = true
    getLearningInsights()
      .then((r) => { if (alive) setData(r.data || {}) })
      .catch(() => { if (alive) setData({}) })
    return () => { alive = false }
  }, [isGuest])

  if (!data) return null

  const bests = data.bests || {}
  const weakSpots = Array.isArray(data.weakSpots) ? data.weakSpots : []

  // Each tile is self-explanatory: a coloured icon (quick visual scan), the number, a short
  // label, and a plain-language descriptor that states the timeframe ("ever" = peak record,
  // "total" = lifetime count) so no student mistakes it for a today-only figure.
  const bestTiles = [
    bests.longestStreak > 0 && { key: 'streak', icon: Flame, tint: '#F59E0B', label: 'Best streak', desc: 'most days in a row', value: bests.longestStreak, format: (n) => `${n}`, suffix: n => n === 1 ? ' day' : ' days' },
    bests.bestAccuracy != null && { key: 'acc', icon: Target, tint: '#22C55E', label: 'Top quiz score', desc: 'highest ever, one quiz', value: bests.bestAccuracy, format: (n) => `${n}%` },
    bests.studyMinutes > 0 && { key: 'time', icon: Clock, tint: '#3B82F6', label: 'Time studied', desc: 'total, all-time', value: bests.studyMinutes, format: fmtDuration },
    bests.conceptsCleared > 0 && { key: 'concepts', icon: BookOpen, tint: '#8B5CF6', label: 'Concepts cleared', desc: 'topics passed in total', value: bests.conceptsCleared },
    bests.quizzesPassed > 0 && { key: 'quizzes', icon: CheckCircle2, tint: '#14B8A6', label: 'Trials passed', desc: 'quizzes aced in total', value: bests.quizzesPassed },
  ].filter(Boolean)

  // Nothing meaningful yet → render nothing (no empty clutter for brand-new hunters).
  if (weakSpots.length === 0 && bestTiles.length === 0) return null

  return (
    <div className="dash-insights">
      {weakSpots.length > 0 && (
        <div className="dash-weak-group">
          {weakSpots.length > 1 && <span className="dash-weak-group__label">FOCUS AREAS — WHERE TO IMPROVE</span>}
          {weakSpots.map((spot, i) => {
            const d = describeSpot(spot)
            const HeadIcon = d.Icon
            return (
              <motion.div
                key={`${spot.domain}-${spot.conceptId || spot.problemId || i}`}
                className={`dash-weak dash-weak--${spot.kind === 'weak' ? 'weak' : 'stuck'}`}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.06, ease: EASE }}
              >
                <div className="dash-weak__head">
                  <span className="dash-weak__icon"><HeadIcon size={15} strokeWidth={2.5} /></span>
                  <div className="dash-weak__text">
                    <span className="dash-weak__title">{d.title}</span>
                    <span className="dash-weak__sub">{d.sub}</span>
                  </div>
                </div>
                <div className="dash-weak__actions">
                  {d.actions.map((a) => {
                    const AIcon = a.icon
                    return (
                      <button
                        key={a.label}
                        type="button"
                        className={`dash-weak__btn${a.primary ? ' dash-weak__btn--primary' : ''}`}
                        onClick={() => navigate(a.to)}
                      >
                        <AIcon size={13} strokeWidth={2.5} /> {a.label}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {bestTiles.length > 0 && (
        <motion.div
          className="dash-bests"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="dash-bests__head">
            <span className="dash-bests__label">PERSONAL BESTS</span>
            <span className="dash-bests__hint">all-time · beat your past self</span>
          </div>
          <div className="dash-bests__grid">
            {bestTiles.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.key} className="dash-bests__tile">
                  <span className="dash-bests__tile-ic" style={{ color: t.tint, background: `${t.tint}1f` }}>
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  <span className="dash-bests__tile-value">
                    <CountUp value={t.value} format={t.format} />
                    {t.suffix ? <span className="dash-bests__tile-unit">{t.suffix(t.value)}</span> : null}
                  </span>
                  <span className="dash-bests__tile-label">{t.label}</span>
                  <span className="dash-bests__tile-desc">{t.desc}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {weakSpots.length > 0 && (
        <span className="dash-insights__foot"><ArrowRight size={11} /> Clearing these lifts your rank progress.</span>
      )}
    </div>
  )
}

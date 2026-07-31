import { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PAGE_MIN_MS } from '../../components/loaders/_config'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EASE } from '../../utils/motion'
import SystemAwakeningLoader from '../../components/loaders/SystemAwakeningLoader'
import { startConceptQuiz, startSubjectQuiz, startRoadmapQuiz, submitQuiz } from '../../api/api'
import { getRank } from '../../utils/slRank'
import { useAuth } from '../../context/AuthContext'
import { getApiError } from '../../utils/apiError'
import { isMongoId } from '../../utils/mongoId'
import { stashQuizReview } from '../../utils/quizReviewOnce'
import { reducedMotion } from '../../utils/motion'
import useHaptic from '../../hooks/useHaptic'
import toast from 'react-hot-toast'
import '../../styles/pages/dashboard/index.css'
import '../../styles/pages/dashboard/quiz-page.css'

const QUIZ_TYPES = { concept: startConceptQuiz, subject: startSubjectQuiz, roadmap: startRoadmapQuiz }

const LETTERS = ['A', 'B', 'C', 'D']

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function timerColor(secs, total) {
  const pct = secs / total
  if (pct < 0.1) return '#EF4444'
  if (pct < 0.25) return '#F59E0B'
  return '#9B6ED4'
}

export default function QuizPage() {
  const { type, refId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const haptic = useHaptic()
  const reduce = useReducedMotion()

  const [quiz, setQuiz]             = useState(null)
  const [answers, setAnswers]       = useState([])
  const [current, setCurrent]       = useState(0)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(null)
  const [totalSeconds, setTotalSeconds] = useState(null)

  const xp      = user?.xp ?? 0
  const rank    = getRank(xp, user?.rank)
  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  useEffect(() => {
    const fn = QUIZ_TYPES[type]
    if (!fn || !isMongoId(refId)) {
      toast.error('That trial link is invalid.')
      navigate(-1)
      return
    }
    let active = true
    let doneTimer
    fn(refId)
      .then(r => {
        if (!active) return
        setQuiz(r.data)
        setAnswers(new Array(r.data.questions.length).fill(-1))
        if (r.data.timeLimitMinutes) {
          const secs = r.data.timeLimitMinutes * 60
          setTimeLeft(secs); setTotalSeconds(secs)
        }
      })
      .catch(err => { if (active) { toast.error(getApiError(err, 'We could not start this trial. Please try again.')); navigate(-1) } })
      .finally(() => { if (active) doneTimer = setTimeout(() => setLoading(false), PAGE_MIN_MS) })
    return () => { active = false; clearTimeout(doneTimer) }
  }, [type, refId])

  const handleSubmit = useCallback(async (currentAnswers) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await submitQuiz({
        type: type.toUpperCase(), refId,
        questionIds: quiz.questions.map(q => q.id),
        answers: currentAnswers || answers,
      })
      stashQuizReview(res.data.attemptId, res.data)
      navigate(`/skill-arena/quiz/result/${res.data.attemptId}?type=${type}&refId=${refId}`, {
        replace: true,
        state: { result: res.data },
      })
    } catch (err) {
      toast.error(getApiError(err, 'We could not submit this trial. Please try again.'))
      setSubmitting(false)
    }
  }, [submitting, type, refId, quiz, answers, navigate])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { handleSubmit(answers); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const selectAnswer = idx =>
    setAnswers(prev => { const a = [...prev]; a[current] = idx; return a })

  // B3: tactile-only feedback — ripple at the tap point + tap haptic. No correctness cue.
  const tapOption = useCallback((e) => {
    haptic('tap')
    if (reducedMotion()) return
    const host = e.currentTarget
    const layer = host.querySelector('.dash-quiz-option__ripple-layer')
    if (!layer) return
    const rect = host.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const span = document.createElement('span')
    span.className = 'dash-quiz-option__ripple'
    span.style.width = span.style.height = `${size}px`
    span.style.left = `${e.clientX - rect.left - size / 2}px`
    span.style.top = `${e.clientY - rect.top - size / 2}px`
    span.addEventListener('animationend', () => span.remove())
    layer.appendChild(span)
  }, [haptic])
  const next = () => current < quiz.questions.length - 1 && setCurrent(c => c + 1)
  const prev = () => current > 0 && setCurrent(c => c - 1)

  // B4: keyboard shortcuts — 1–4 select, Enter advances/submits, ←/→ navigate.
  useEffect(() => {
    if (!quiz) return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const nOpts = quiz.questions[current]?.options?.length || 0
      const last = current === quiz.questions.length - 1
      const ans = answers[current]
      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1
        if (idx < nOpts) { e.preventDefault(); selectAnswer(idx) }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (last) { if (ans !== -1 && !submitting) handleSubmit(answers) }
        else if (ans !== -1) next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); prev()
      } else if (e.key === 'ArrowRight') {
        if (ans !== -1) { e.preventDefault(); next() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [quiz, current, answers, submitting, handleSubmit])

  // B4: one-time keyboard hint — desktop only, dismissible, remembered.
  const [showKbdHint, setShowKbdHint] = useState(() => {
    try {
      if (localStorage.getItem('quiz_kbd_hint_seen')) return false
      return typeof window !== 'undefined'
        && window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches === true
    } catch { return false }
  })
  const dismissKbdHint = useCallback(() => {
    setShowKbdHint(false)
    try { localStorage.setItem('quiz_kbd_hint_seen', '1') } catch { /* ignore */ }
  }, [])

  // ── Loading ──────────────────────────────────────────
  if (loading) return <SystemAwakeningLoader subtitle="LOADING QUIZ" />

  if (!quiz) return (
    <div className="dash-quiz-page">
      <div className="dash-quiz-unavailable">
        <h2 className="dash-quiz-unavailable__title">Quiz not available</h2>
        <p className="dash-quiz-unavailable__text">
          This trial has no questions yet or could not be loaded. Please try again later.
        </p>
        <button type="button" className="dash-quiz-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={13} /> GATES
        </button>
      </div>
    </div>
  )

  const q            = quiz.questions[current]
  const answered     = answers[current]
  const isLast       = current === quiz.questions.length - 1
  const answeredCount = answers.filter(a => a !== -1).length
  const progress     = ((current + 1) / quiz.questions.length) * 100
  const tColor       = timeLeft !== null ? timerColor(timeLeft, totalSeconds) : '#9B6ED4'

  return (
    <div className="dash-quiz-page">

      {/* ── Header (fixed 52px) ── */}
      <header className="dash-quiz-header">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="dash-quiz-back-btn"
        >
          <ArrowLeft size={13} /> GATES
        </button>

        {/* Progress bar in header */}
        <div className="dash-quiz-progress-wrap">
          <div className="dash-quiz-progress-labels">
            <span className="dash-quiz-progress-trial">
              TRIAL {current + 1} / {quiz.questions.length}
            </span>
            <span className="dash-quiz-progress-answered">
              {answeredCount} ANSWERED
            </span>
          </div>
          <div className="dash-quiz-progress-track">
            <div className="dash-quiz-progress-fill" style={{ '--progress-pct': `${progress}%` }} />
          </div>
        </div>

        <div className="dash-quiz-header-right">
          {timeLeft !== null && (
            <div className="dash-quiz-timer" style={{ '--timer-color': tColor }}>
              {formatTime(timeLeft)}
            </div>
          )}
          <span className={`rank-badge ${rank.cls} dash-quiz-rank-badge`}>{rank.label}</span>
          <div
            className="dash-avatar dash-avatar--sm"
            style={{ '--avatar-bg': user?.avatarColor || '#9B6ED4', '--rank-color': rank.color }}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── Body (fills remaining height, no scroll) ── */}
      <div className="dash-quiz-body">
        <div className="dash-quiz-inner">

          {/* Question */}
          <motion.div
            key={`q-${current}`}
            className="dash-quiz-question-card"
            initial={reduce ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="dash-quiz-question-label">
              TRIAL {current + 1}
            </div>
            <div className="dash-quiz-question-text">
              {q.text}
            </div>
          </motion.div>

          {/* Options — fill remaining space evenly */}
          <motion.div
            key={`opts-${current}`}
            className="dash-quiz-options"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE, delay: 0.05 }}
          >
            {q.options.map((opt, i) => {
              const isSelected = answered === i
              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onPointerDown={tapOption}
                  onClick={() => selectAnswer(i)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectAnswer(i)
                    }
                  }}
                  className={`dash-quiz-option${isSelected ? ' is-selected' : ''}`}
                >
                  <span className="dash-quiz-option__ripple-layer" aria-hidden="true" />
                  <div className="dash-quiz-option__letter">
                    {LETTERS[i]}
                  </div>
                  <span className="dash-quiz-option__text">
                    {opt}
                  </span>
                  {isSelected && <div className="dash-quiz-option__dot" />}
                </div>
              )
            })}
          </motion.div>

          {/* Nav dots + actions (always at bottom) */}
          <div className="dash-quiz-nav">
            {/* Question dots */}
            <div className="dash-quiz-dots">
              {quiz.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`dash-quiz-dot${i === current ? ' is-current' : ''}${answers[i] !== -1 ? ' is-answered' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Prev / Next / Submit */}
            <div className="dash-quiz-actions">
              <button
                onClick={prev}
                disabled={current === 0}
                className="dash-quiz-prev-btn"
              >
                ← PREV
              </button>

              {!isLast ? (
                <button
                  onClick={next}
                  disabled={answered === -1}
                  className="dash-quiz-next-btn"
                >
                  NEXT →
                </button>
              ) : answered === -1 ? (
                <button
                  disabled
                  className="dash-quiz-submit-disabled"
                >
                  ANSWER TO SUBMIT
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit(answers)}
                  disabled={submitting}
                  className="dash-quiz-submit-btn"
                >
                  {submitting ? <span className="loading-spinner dash-quiz-submit-btn__spinner" /> : '⚔️'}
                  {submitting ? 'SUBMITTING…' : `SUBMIT (${answeredCount}/${quiz.questions.length})`}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {showKbdHint && (
        <div className="dash-quiz-kbd-hint" role="note">
          <span className="dash-quiz-kbd-hint__text">
            Tip — <kbd>1</kbd>–<kbd>4</kbd> to answer, <kbd>Enter</kbd> to continue, <kbd>←</kbd>/<kbd>→</kbd> to move.
          </span>
          <button type="button" className="dash-quiz-kbd-hint__close" onClick={dismissKbdHint} aria-label="Dismiss hint">✕</button>
        </div>
      )}
    </div>
  )
}

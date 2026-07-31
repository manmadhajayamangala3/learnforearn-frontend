import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '../../utils/motion'
import { PAGE_MIN_MS } from '../../components/loaders/_config'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react'
import SystemAwakeningLoader from '../../components/loaders/SystemAwakeningLoader'
import CountUp from '../../components/CountUp'
import { useCelebrate } from '../../context/CelebrationContext'
import { getAttemptResult } from '../../api/api'
import { badgeMeta } from '../../utils/badgeMeta'
import { getRank } from '../../utils/slRank'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { getApiError } from '../../utils/apiError'
import { peekQuizReview, asQuizSummary } from '../../utils/quizReviewOnce'
import { QUIZ_XP } from '../../utils/quizXp'
import '../../styles/pages/dashboard/index.css'
import '../../styles/pages/dashboard/quiz-result-page.css'

const LETTERS = ['A', 'B', 'C', 'D']

function formatRetry(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - Date.now()
  if (diff <= 0) return 'now'
  const mins = Math.ceil(diff / 60000)
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''}`
  const hrs = Math.ceil(diff / 3600000)
  return `${hrs} hour${hrs !== 1 ? 's' : ''}`
}

export default function QuizResultPage() {
  const { attemptId }    = useParams()
  const [searchParams]   = useSearchParams()
  const location         = useLocation()
  const quizType         = searchParams.get('type')
  const refId            = searchParams.get('refId')
  const navigate         = useNavigate()
  const { user }         = useAuth()
  const reduce           = useReducedMotion()
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasLiveReview, setHasLiveReview] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const celebrate = useCelebrate()
  const firedRef = useRef(false)

  const xp       = user?.xp ?? 0
  const rank     = getRank(xp, user?.rank)
  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    let active = true
    let doneTimer

    const live = location.state?.result ?? peekQuizReview(attemptId)
    if (live?.results?.length) {
      setResult(live)
      setHasLiveReview(true)
      setLoading(false)
      if (live.passed) {
        window.dispatchEvent(new CustomEvent('sl:refresh'))
      }
      return () => { active = false; clearTimeout(doneTimer) }
    }

    getAttemptResult(attemptId)
      .then(r => {
        if (!active) return
        setResult(asQuizSummary(r.data))
        setHasLiveReview(false)
      })
      .catch(err => { if (active) { toast.error(getApiError(err, 'We could not load this result. Please try again.')); navigate(-1) } })
      .finally(() => { if (active) doneTimer = setTimeout(() => setLoading(false), PAGE_MIN_MS) })
    return () => { active = false; clearTimeout(doneTimer) }
  }, [attemptId, location.state, navigate])

  // Free Fire–style reward popup: on a fresh pass (live review only, never on revisit),
  // fire the central celebration pipeline once. It queues the XP reward card (with the
  // +XP count-up, level bar fill, inline level-up + title) then the rank-up card (C1),
  // one at a time — identical to every other earn point in the app.
  useEffect(() => {
    if (firedRef.current || !hasLiveReview || !result) return
    firedRef.current = true
    if (result.passed && result.xpEarned > 0) {
      // Real breakdown: base trial XP, then the +50 daily bonus line when it's the first
      // skill cleared today (dailyBonusEarned). Never invents XP — bonus is split from total.
      const bonus = result.dailyBonusEarned ? QUIZ_XP.concept.dailyBonus : 0
      const breakdown = [{ label: 'Trial Cleared', amount: result.xpEarned - bonus, icon: '⚔️' }]
      if (bonus > 0) breakdown.push({ label: 'First Skill Today', amount: bonus, icon: '⭐' })
      // C15 — a fresh pass that mints a certificate (badge) queues the full-screen certificate
      // moment AFTER the XP popup + any rank-up. Never fires on a revisit (xpEarned is 0 then).
      const cert = result.badge ? (() => {
        const bm = badgeMeta(result.badge)
        return {
          title: bm?.label || result.badge,
          kind: bm?.kind ? `${bm.kind} Mastered` : 'Skill Gate Mastered',
          icon: bm?.icon || '📜',
          color: bm?.color || undefined,
          name: user?.fullName || user?.username || 'Hunter',
          href: '/skill-arena/certificates',
        }
      })() : null
      celebrate({ ...result, sourceLabel: 'TRIAL COMPLETE', breakdown, certificate: cert })
    }
  }, [hasLiveReview, result, celebrate, user?.fullName, user?.username])

  // Memoized so the review slice / wrong-count aren't rebuilt on every showAll toggle
  // or unrelated re-render. Placed before the early returns to satisfy the Rules of
  // Hooks; the values are byte-identical to the previous inline expressions.
  const wrongCount = useMemo(() => {
    if (!result) return 0
    const reviewable = hasLiveReview && (result.results?.length ?? 0) > 0
    return reviewable
      ? result.results.filter(r => !r.correct).length
      : Math.max(0, result.total - result.score)
  }, [result, hasLiveReview])
  const displayed = useMemo(() => {
    if (!result) return []
    const reviewable = hasLiveReview && (result.results?.length ?? 0) > 0
    return reviewable ? (showAll ? result.results : result.results.slice(0, 5)) : []
  }, [result, hasLiveReview, showAll])

  // ─── Loading ───────────────────────────────────────────
  if (loading) return <SystemAwakeningLoader subtitle="LOADING RESULTS" />

  if (!result) return null

  const pct        = Math.round((result.score / result.total) * 100)
  const retryIn    = formatRetry(result.nextRetryAt)
  const hasReview  = hasLiveReview && (result.results?.length ?? 0) > 0

  const PASS_COLOR = '#4ADE80'
  const FAIL_COLOR = '#EF4444'
  const accentColor = result.passed ? PASS_COLOR : FAIL_COLOR

  // Badge config — unique names shared with certificates/history via badgeMeta
  const bm    = result.badge ? badgeMeta(result.badge) : null
  const badge = bm ? { icon: bm.icon, label: `${bm.label} Unlocked!`, color: bm.color } : null

  return (
    <div className="dash-quiz-result-page" style={{ '--accent': accentColor }}>

      {/* ── Top bar ── */}
      <header className="dash-quiz-result-header">
        <button
          className="dash-quiz-result-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} /> GATES
        </button>
        <div className="dash-quiz-result-header-center">
          <span className="dash-quiz-result-status">
            [ SYSTEM ] {result.passed ? 'TRIAL PASSED ✓' : 'TRIAL FAILED ✗'}
          </span>
        </div>
        <div className="dash-quiz-result-header-right">
          <span className={`rank-badge ${rank.cls} dash-quiz-result-rank-badge`}>{rank.label}</span>
          <div
            className="dash-avatar dash-avatar--md"
            style={{ '--avatar-bg': user?.avatarColor || '#9B6ED4', '--rank-color': rank.color }}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="dash-quiz-result-content">
        <div className="dash-quiz-result-inner">

          {/* Score hero card */}
          <motion.div
            className="dash-quiz-result-hero"
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {/* Score */}
            <div className="dash-quiz-result-score">
              {result.score}/{result.total}
            </div>

            {/* Verdict */}
            <div className="dash-quiz-result-verdict">
              {result.passed
                ? <><CheckCircle size={18} /> TRIAL PASSED ✓</>
                : <><XCircle size={18} /> TRIAL FAILED ✗</>}
            </div>

            {/* Stats row */}
            <div className="dash-quiz-result-stats">
              <span>{pct}% ACCURACY</span>
              <span>·</span>
              <span>{result.score} CORRECT</span>
              <span>·</span>
              <span>{wrongCount} WRONG</span>
            </div>

            {/* XP earned */}
            {result.passed && result.xpEarned > 0 && (
              <div className="dash-quiz-result-xp-wrap">
                <div className="dash-quiz-result-xp">
                  <Zap size={14} /> +<CountUp value={result.xpEarned} format={(n) => n} /> XP EARNED
                </div>
                {result.dailyBonusEarned && (
                  <div className="dash-quiz-result-bonus">
                    ⭐ DAILY BONUS +{QUIZ_XP.concept.dailyBonus} XP — First skill today!
                  </div>
                )}
              </div>
            )}

            {/* Retry timer */}
            {!result.passed && retryIn && (
              <div className="dash-quiz-result-retry">
                <RotateCcw size={13} /> RETRY AVAILABLE IN <strong>{retryIn.toUpperCase()}</strong>
              </div>
            )}
          </motion.div>

          {/* Badge banner */}
          {badge && (
            <div
              className="dash-quiz-result-badge-banner"
              style={{
                '--badge-bg': `${badge.color}0D`,
                '--badge-border': `${badge.color}33`,
                '--badge-color': badge.color,
              }}
            >
              <div className="dash-quiz-result-badge-icon">{badge.icon}</div>
              <div className="dash-quiz-result-badge-label">{badge.label}</div>
              <div className="dash-quiz-result-badge-meta">
                {bm.kind} · Certificate ready
              </div>
            </div>
          )}

          {/* Answer review — only immediately after submit (not stored in DB) */}
          {hasReview ? (
          <div>
            <div className="dash-quiz-result-review-header">
              <div className="dash-quiz-result-review-title">
                Trial Review
                {wrongCount > 0 && <span className="dash-quiz-result-review-wrong">({wrongCount} wrong)</span>}
              </div>
              {result.results.length > 5 && (
                <button
                  onClick={() => setShowAll(s => !s)}
                  className="dash-quiz-result-toggle"
                >
                  {showAll ? 'SHOW LESS' : `SHOW ALL ${result.results.length}`}
                </button>
              )}
            </div>

            <div className="dash-quiz-result-review-list">
              {displayed.map((r) => (
                <div
                  key={r.questionId}
                  className={`dash-quiz-result-review-item ${r.correct ? 'is-correct' : 'is-wrong'}`}
                >
                  <div className="dash-quiz-result-review-q">
                    {r.correct
                      ? <CheckCircle size={15} color="#4ADE80" className="dash-quiz-result-review-q__icon" />
                      : <XCircle size={15} color="#EF4444" className="dash-quiz-result-review-q__icon" />}
                    <div className="dash-quiz-result-review-q__text">{r.text}</div>
                  </div>

                  <div className={`dash-quiz-result-options${r.explanation ? ' dash-quiz-result-options--with-explanation' : ''}`}>
                    {r.options.map((opt, oi) => {
                      const isCorrect = oi === r.correctIndex
                      const isStudent = oi === r.studentAnswer
                      return (
                        <span
                          key={oi}
                          className={`dash-quiz-result-option ${isCorrect ? 'is-correct' : (isStudent && !isCorrect) ? 'is-wrong' : 'is-neutral'}`}
                        >
                          {LETTERS[oi]}. {opt}
                          {isCorrect && ' ✓'}
                          {isStudent && !isCorrect && ' ✗'}
                        </span>
                      )
                    })}
                  </div>

                  {r.explanation && (
                    <div className="dash-quiz-result-explanation">
                      <Zap size={11} className="dash-quiz-result-explanation__icon" />
                      {r.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          ) : (
            <p className="dash-quiz-result-summary-note">
              Score saved to your history. Question-by-question review is only available right after you finish a trial.
            </p>
          )}

          {/* Action buttons */}
          <div className="dash-quiz-result-actions">
            {result.passed && badge && (
              <button
                onClick={() => navigate('/skill-arena/certificates')}
                className="dash-quiz-result-primary-btn"
              >
                <Trophy size={16} /> VIEW CERTIFICATE
              </button>
            )}
            {result.passed && (
              <button
                onClick={() => navigate('/skill-arena/dashboard?view=gates')}
                className={badge ? 'dash-quiz-result-secondary-btn' : 'dash-quiz-result-primary-btn'}
              >
                <Trophy size={16} /> CONTINUE HUNT
              </button>
            )}
            {!result.passed && !retryIn && quizType && refId && (
              <button
                onClick={() => navigate(`/skill-arena/quiz/${quizType}/${refId}`)}
                className="dash-quiz-result-primary-btn"
              >
                <RotateCcw size={15} /> RETRY TRIAL
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="dash-quiz-result-secondary-btn"
            >
              ← BACK TO GATES
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

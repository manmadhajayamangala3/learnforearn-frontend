import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { EASE } from '../../utils/motion'

// C4 — "Continue where you left off". Top element of the dashboard arena view.
// Two shapes, same card:
//   kind: 'resume'    → the exact concept the hunter last opened (server history)
//   kind: 'recommend' → first suggested gate when there is no history yet
// One-tap Resume opens that concept/gate directly, removing the biggest friction point.
// Entrance animates transform+opacity only and is disabled under reduced motion.
export default function ResumeConceptCard({ target, onResume }) {
  const reduce = useReducedMotion()
  if (!target) return null

  const isResume = target.kind === 'resume'
  const label = isResume ? 'CONTINUE WHERE YOU LEFT OFF' : 'START YOUR JOURNEY'
  const primary = isResume ? (target.conceptTitle || target.subjectTitle) : target.subjectTitle
  const secondary = isResume ? target.subjectTitle : 'Begin your first skill'
  const cta = isResume ? 'Resume' : 'Start'
  const pct = Math.min(100, Math.max(0, Math.round(target.pct || 0)))

  return (
    <motion.button
      type="button"
      className="dash-resume-card"
      onClick={onResume}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="dash-resume-card__label">{label}</div>
      <div className="dash-resume-card__row">
        {target.subjectIcon && <span className="dash-resume-card__icon">{target.subjectIcon}</span>}
        <div className="dash-flex-1">
          <div className="dash-resume-card__concept">{primary}</div>
          {secondary && <div className="dash-resume-card__subject">{secondary}</div>}
          {isResume && (
            <div className="dash-resume-card__track" aria-hidden="true">
              <div className="dash-resume-card__fill" style={{ '--progress-pct': `${pct}%` }} />
            </div>
          )}
        </div>
        <span className="dash-resume-card__btn">
          {cta} <ArrowRight size={15} strokeWidth={2.5} />
        </span>
      </div>
    </motion.button>
  )
}

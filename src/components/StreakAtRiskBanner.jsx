import { motion, useReducedMotion } from 'framer-motion'
import { Flame, X, ArrowRight } from 'lucide-react'
import { EASE } from '../utils/motion'

// C7 — Streak at-risk nudge. A dismissible banner shown only when the hunter HAS a streak,
// has NOT done any qualifying action today, and fewer than 4 hours remain in their day. One
// quick quest keeps the flame alive. Never shown to hunters without a streak; at most once
// per day (deduped by the caller). transform/opacity only; reduced motion drops the entrance.
//
// Props: streak (number), hoursLeft (number), onGo (open the shortest quest), onDismiss
export default function StreakAtRiskBanner({ streak, hoursLeft, onGo, onDismiss }) {
  const reduce = useReducedMotion()
  const h = Math.max(1, Math.ceil(Number(hoursLeft) || 1))

  return (
    <motion.div
      className="dash-streak-risk"
      role="status"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <motion.span
        className="dash-streak-risk__flame"
        aria-hidden="true"
        animate={reduce ? {} : { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Flame size={18} strokeWidth={2.25} color="#F59E0B" fill="#F59E0B" />
      </motion.span>
      <span className="dash-streak-risk__msg">
        <strong>{h}h left today.</strong> One quest protects your{' '}
        <span className="dash-streak-risk__streak">🔥 {streak}</span>.
      </span>
      <button type="button" className="dash-streak-risk__go" onClick={onGo}>
        Protect it <ArrowRight size={13} strokeWidth={2.5} />
      </button>
      <button type="button" className="dash-streak-risk__x" aria-label="Dismiss" onClick={onDismiss}>
        <X size={15} />
      </button>
    </motion.div>
  )
}

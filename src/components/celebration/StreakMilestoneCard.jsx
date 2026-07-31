import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Flame, Shield } from 'lucide-react'
import CountUp from '../CountUp'
import { EASE } from '../../utils/motion'

// C5 — Streak milestone celebration. Full-screen amber moment fired when a streak reaches a
// threshold (3 / 7 / 14 / 30). Calm, muted palette (soft bloom + a few embers) to match the
// rank cards. Shows the day count with the flame stepping up, milestone copy, the bonus XP
// earned, and — at 7 — the Streak Shield granted. transform/opacity only; reduced motion drops
// the bloom/embers and idle flicker. Dismiss by tap-outside / Esc / Continue; never blocks nav.
//
// Props: days, bonusXp (number|0), shield (bool — a shield was granted at this milestone), onClose
const MILESTONES = {
  3:  { title: 'Habit forming',      sub: 'Three days in a row — the hardest part is behind you.' },
  7:  { title: 'One week strong',    sub: 'Seven days unbroken. You earned a Streak Shield.' },
  14: { title: 'Two weeks unbroken', sub: 'Fourteen days of showing up. This is momentum.' },
  30: { title: 'A full month',       sub: 'Thirty days straight — elite consistency.' },
}
const AMBER = '#F59E0B'
const EMBERS = [
  { x: -120, d: 0.0 }, { x: -60, d: 0.35 }, { x: 40, d: 0.15 }, { x: 110, d: 0.5 }, { x: 0, d: 0.6 },
]

export default function StreakMilestoneCard({ days = 7, bonusXp = 0, shield = false, onClose }) {
  const reduce = useReducedMotion()
  const meta = MILESTONES[days] || { title: `${days}-day streak`, sub: 'Consistency compounds. Keep the flame alive.' }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div
      className="streakms-overlay"
      role="dialog" aria-modal="true" aria-label={`${days} day streak reached`}
      onClick={onClose}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? {} : { opacity: 0 }}
      transition={{ duration: 0.26 }}
    >
      {!reduce && <span className="streakms-bloom" aria-hidden="true" />}
      {!reduce && (
        <div className="streakms-embers" aria-hidden="true">
          {EMBERS.map((e, i) => (
            <motion.span
              key={i}
              className="streakms-ember"
              initial={{ opacity: 0, x: e.x, y: 40, scale: 0.6 }}
              animate={{ opacity: [0, 0.7, 0], y: -180, scale: 1 }}
              transition={{ duration: 2.4, delay: 0.3 + e.d, repeat: Infinity, repeatDelay: 0.6, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="streakms-card"
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <span className="streakms-card__sheen" aria-hidden="true" />

        <motion.div
          className="streakms-flame"
          aria-hidden="true"
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={reduce ? { scale: 1, opacity: 1 } : { scale: [0.5, 1.12, 1], opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : 0.06 }}
        >
          <motion.span
            className="streakms-flame__glow"
            animate={reduce ? {} : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Flame size={64} strokeWidth={2} color={AMBER} fill={AMBER} />
          <span className="streakms-flame__days">{days}</span>
        </motion.div>

        <motion.div
          className="streakms-eyebrow"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.24 }}
        >
          {days}-DAY STREAK
        </motion.div>
        <motion.h2
          className="streakms-title"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: EASE, delay: reduce ? 0 : 0.32 }}
        >
          {meta.title}
        </motion.h2>
        <motion.p
          className="streakms-sub"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.4 }}
        >
          {meta.sub}
        </motion.p>

        <motion.div
          className="streakms-rewards"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.48 }}
        >
          {bonusXp > 0 && (
            <span className="streakms-chip streakms-chip--xp">
              +<CountUp value={bonusXp} format={(n) => n.toLocaleString('en-IN')} /> XP
            </span>
          )}
          {shield && (
            <span className="streakms-chip streakms-chip--shield">
              <Shield size={13} strokeWidth={2.5} /> Streak Shield
            </span>
          )}
        </motion.div>

        <motion.button
          type="button"
          className="streakms-btn"
          onClick={onClose}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: reduce ? 0 : 0.56 }}
        >
          Keep it alive
        </motion.button>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

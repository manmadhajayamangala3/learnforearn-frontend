import { motion, useReducedMotion } from 'framer-motion'
import { Flame, Shield } from 'lucide-react'

// Streak flame with intensity that steps up at milestone thresholds.
// Reusable in navbar, dashboard, greeting, mobile stats popup, and profile.
// Idle pulse uses transform + opacity only and is disabled under reduced motion.
//
// Props:
//   count      — current streak in days
//   size       — flame icon px size (default 18)
//   showCount  — render the number beside the flame (default true)
//   shields    — Streak Shields held (C6); renders a small shield chip when > 0
//   className  — extra classes on the wrapper

const AMBER = '#F59E0B'

// Milestone tiers drive scale + glow. Kept in sync with the streak milestones
// (3 / 7 / 14 / 30) used elsewhere in the engagement system.
function tierFor(count) {
  if (count >= 30) return 4
  if (count >= 14) return 3
  if (count >= 7) return 2
  if (count >= 3) return 1
  return 0
}

const TIER_GLOW = [
  '0 0 4px rgba(245,158,11,0.35)',
  '0 0 7px rgba(245,158,11,0.5)',
  '0 0 11px rgba(245,158,11,0.6)',
  '0 0 16px rgba(245,158,11,0.72)',
  '0 0 22px rgba(245,158,11,0.85)',
]
const TIER_SCALE = [1, 1.05, 1.12, 1.2, 1.3]

export default function StreakFlame({ count = 0, size = 18, showCount = true, shields = 0, className = '' }) {
  const reduce = useReducedMotion()
  const c = Math.max(0, Math.floor(Number(count) || 0))
  const s = Math.max(0, Math.floor(Number(shields) || 0))
  const tier = tierFor(c)
  const active = c > 0
  const scale = TIER_SCALE[tier]

  // Gentle idle breathing — bigger streaks breathe a touch more. transform+opacity only.
  const pulse = !reduce && active
    ? {
        animate: { scale: [scale, scale * 1.06, scale], opacity: [0.9, 1, 0.9] },
        transition: { duration: 2.4 - tier * 0.15, repeat: Infinity, ease: 'easeInOut' },
      }
    : { animate: { scale, opacity: active ? 1 : 0.55 } }

  return (
    <span className={`streak-flame${active ? ' streak-flame--active' : ''} ${className}`.trim()}>
      <motion.span
        className="streak-flame__icon"
        style={{ display: 'inline-flex', filter: active ? `drop-shadow(${TIER_GLOW[tier]})` : 'none', transformOrigin: 'center bottom' }}
        {...pulse}
      >
        <Flame size={size} strokeWidth={2.25} color={AMBER} fill={active ? AMBER : 'none'} />
      </motion.span>
      {showCount && (
        <span className="streak-flame__count" style={{ color: AMBER }}>{c}</span>
      )}
      {s > 0 && (
        <span className="streak-flame__shields" title={`${s} Streak Shield${s > 1 ? 's' : ''} — saves your streak if you miss a day`}>
          <Shield size={Math.round(size * 0.62)} strokeWidth={2.5} />
          {s > 1 && <span className="streak-flame__shields-n">{s}</span>}
        </span>
      )}
    </span>
  )
}

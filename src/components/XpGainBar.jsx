import { motion, useReducedMotion } from 'framer-motion'
import { levelProgress } from '../utils/slLevel'
import { EASE } from '../utils/motion'

// Animated XP progress bar shown when XP changes. Instead of a bare counting number,
// it visually fills (or drains) from the pre-earn position to the post-earn position,
// so an XP change reads as a game-like level bar moving — not just a number ticking.
//
// Server stays authoritative: this only animates toward xpBefore → xpAfter that the
// backend returned (A9). Level math mirrors the backend via levelProgress().
//
// Props:
//   xpBefore — lifetime XP before this earn (server value)
//   xpAfter  — lifetime XP after this earn (server value)
//   earned   — optional signed delta; when set, a "+N"/"−N" chip is tacked onto the XP
//              meta (Free Fire "SCORE … 6145 +58" feel)
//   className — extra classes on the wrapper
//
// Direction:
//   increase → fill eases up (green→accent). A level-up plays fill→overflow→reset→fill.
//   decrease → fill eases down (amber). Never snaps.
// Respects prefers-reduced-motion: jumps straight to the final width, no keyframes.
export default function XpGainBar({ xpBefore = 0, xpAfter = 0, earned = null, delay = 0, className = '' }) {
  const reduce = useReducedMotion()

  const before = levelProgress(Math.max(0, xpBefore))
  const after  = levelProgress(Math.max(0, xpAfter))
  const decreased = xpAfter < xpBefore
  const leveledUp = after.level > before.level
  const leveledDown = after.level < before.level
  const deltaNum = Math.round(Number(earned) || 0)
  const showDelta = earned !== null && deltaNum !== 0

  const startPct = before.pct
  const endPct   = after.pct

  let animate, transition
  if (reduce) {
    animate = { width: `${endPct}%` }
    transition = { duration: 0 }
  } else if (leveledUp) {
    // fill to the top of the old level, briefly overflow, reset, then fill the new level.
    animate = { width: [`${startPct}%`, '100%', '0%', `${endPct}%`] }
    transition = { duration: 1.5, ease: EASE, times: [0, 0.4, 0.44, 1], delay }
  } else if (leveledDown) {
    // drain to the floor of the current level, jump to full of the lower level, then drain.
    animate = { width: [`${startPct}%`, '0%', '100%', `${endPct}%`] }
    transition = { duration: 1.5, ease: EASE, times: [0, 0.4, 0.44, 1], delay }
  } else {
    animate = { width: [`${startPct}%`, `${endPct}%`] }
    transition = { duration: 1.0, ease: EASE, delay }
  }

  return (
    <div className={`xp-gain-bar${decreased ? ' xp-gain-bar--down' : ''} ${className}`.trim()}>
      <div className="xp-gain-bar__meta">
        <span className="xp-gain-bar__level">LVL {after.level}</span>
        <span className="xp-gain-bar__xp">
          {after.into.toLocaleString()} / {after.span.toLocaleString()} XP
          {showDelta && (
            <span className={`xp-gain-bar__delta${deltaNum < 0 ? ' xp-gain-bar__delta--down' : ''}`}>
              {deltaNum > 0 ? '+' : '−'}{Math.abs(deltaNum).toLocaleString()}
            </span>
          )}
        </span>
      </div>
      <div className="xp-gain-bar__track">
        <motion.div
          className="xp-gain-bar__fill"
          initial={{ width: `${startPct}%` }}
          animate={animate}
          transition={transition}
        />
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { levelProgress } from '../../utils/slLevel'
import { EASE } from '../../utils/motion'

// C2 — Level-up overflow. Inline, non-blocking flourish fired when a server XP response
// reports levelUp:true. The mini XP bar fills to 100%, flashes gold at the brim, then
// resets and fills toward the NEW level's real progress (from xpAfter — a display detail;
// the server stays authoritative for XP/level). If a title unlocked (D2), it is named
// here rather than passing silently. Runs mid-session without dimming the screen or
// capturing clicks, and auto-dismisses. Fires before the rank-up card (C1) when both hit.
export default function LevelUpOverlay({ levelAfter, xpAfter, titleUnlocked, onClose }) {
  const reduce = useReducedMotion()
  const finalPct = Math.min(100, Math.max(0, levelProgress(Number(xpAfter) || 0).pct))
  const [pct, setPct] = useState(0)
  const [flash, setFlash] = useState(false)
  const [noTrans, setNoTrans] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    const push = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }
    if (reduce) {
      setPct(finalPct)
      push(() => onClose?.(), 1600)
      return () => timers.current.forEach(clearTimeout)
    }
    const raf = requestAnimationFrame(() => setPct(100))   // overflow the old level
    push(() => setFlash(true), 780)                        // gold flash at the brim
    push(() => setFlash(false), 1120)
    push(() => { setNoTrans(true); setPct(0) }, 1150)      // snap fresh bar to 0…
    push(() => { setNoTrans(false); setPct(finalPct) }, 1220) // …then fill to new progress
    push(() => onClose?.(), 2900)                          // auto-dismiss
    return () => { cancelAnimationFrame(raf); timers.current.forEach(clearTimeout) }
  }, [reduce, finalPct, onClose])

  return createPortal(
    <div className="levelup-layer">
      <motion.div
        className="levelup-card"
        role="status"
        onClick={onClose}
        initial={reduce ? false : { opacity: 0, y: -16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="levelup-eyebrow">LEVEL UP</div>
        <div className="levelup-level">Level {levelAfter}</div>
        <div className={`levelup-bar${flash ? ' levelup-bar--flash' : ''}`} aria-hidden="true">
          <div
            className="levelup-bar__fill"
            style={{ width: `${pct}%`, ...(noTrans ? { transition: 'none' } : {}) }}
          />
        </div>
        {titleUnlocked && (
          <div className="levelup-title">New title: <strong>{titleUnlocked}</strong></div>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}

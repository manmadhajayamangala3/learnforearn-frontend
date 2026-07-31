import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Rocket, Zap } from 'lucide-react'
import { EASE } from '../../utils/motion'

// C14 — Mission completion moment. Full-screen takeover fired when a hunter ships a mission
// (first repo/live-demo link saved). Acknowledges the build: eyebrow → 🛰️ crest scales in →
// "MISSION ACCOMPLISHED" + title → XP line → the next suggested mission with a direct Start
// button. Muted orange (mission) palette, transform/opacity only, reduced-motion aware.
// Dismissible by tap-outside, Escape, or Continue.
const MISSION = '#FF7F2A'

export default function MissionCompleteCard({ title, rank, xpEarned, next, onStartNext, onClose }) {
  const reduce = useReducedMotion()
  const particles = reduce ? [] : Array.from({ length: 12 })
  const rings = reduce ? [] : [0, 1]

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div
      className="misscard-overlay"
      role="dialog" aria-modal="true" aria-label="Mission accomplished"
      onClick={onClose}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ '--miss-color': MISSION }}
    >
      {!reduce && (
        <motion.div
          className="misscard-bloom"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.35, 1.6] }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      )}

      {rings.length > 0 && (
        <div className="misscard-rings" aria-hidden="true">
          {rings.map((r) => (
            <motion.span
              key={r}
              className="misscard-ring"
              initial={{ opacity: 0.35, scale: 0.35 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 2.6, ease: 'easeOut', repeat: Infinity, delay: r * 1.3 }}
            />
          ))}
        </div>
      )}

      {particles.length > 0 && (
        <div className="misscard-particles" aria-hidden="true">
          {particles.map((_, i) => {
            const angle = (i / particles.length) * Math.PI * 2
            const dist = 100 + (i % 4) * 38
            return (
              <motion.span
                key={i}
                className="misscard-particle"
                initial={{ x: 0, y: 0, opacity: 0.85, scale: 1 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: (i % 5) * 0.04 }}
              />
            )
          })}
        </div>
      )}

      <div className="misscard-card" onClick={(e) => e.stopPropagation()}>
        <span className="misscard-card__sheen" aria-hidden="true" />
        <motion.div
          className="misscard-eyebrow"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.15 }}
        >
          MISSION ACCOMPLISHED
        </motion.div>

        <motion.div
          className="misscard-crest"
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : 0.2 }}
        >
          <span className="misscard-crest__ring" aria-hidden="true" />
          <span className="misscard-crest__glow" aria-hidden="true" />
          <span className="misscard-crest__icon">🛰️</span>
          {rank && <span className="misscard-crest__rank">{rank}</span>}
        </motion.div>

        <motion.div
          className="misscard-title"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: reduce ? 0 : 0.5 }}
        >
          {title || 'Mission complete'}
        </motion.div>

        {xpEarned > 0 && (
          <motion.div
            className="misscard-xp"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.6 }}
          >
            <Zap size={14} strokeWidth={2.5} /> +{xpEarned} XP earned
          </motion.div>
        )}

        {next && (
          <motion.button
            type="button"
            className="misscard-next"
            onClick={onStartNext}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.7 }}
          >
            <span className="misscard-next__label">NEXT MISSION{next.rank ? ` · ${next.rank}-RANK` : ''}</span>
            <span className="misscard-next__title">{next.title}</span>
            <span className="misscard-next__cta"><Rocket size={14} strokeWidth={2.4} /> Start</span>
          </motion.button>
        )}

        <motion.div
          className="misscard-actions"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.82 }}
        >
          <button type="button" className="misscard-btn misscard-btn--ghost" onClick={onClose}>
            Continue <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  )
}

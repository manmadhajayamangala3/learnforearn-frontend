import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { RANK_LADDER, RANK_COLORS_DARK, RANK_COLORS_LIGHT } from '../../constants/ranks'
import { useTheme } from '../../context/ThemeContext'
import { EASE } from '../../utils/motion'

// C1 — Rank-up cinematic. Full-screen takeover fired when a server XP response reports
// rankUp:true (or the Ascension Progress card completes). Layered sequence: dim overlay →
// radial bloom + slow expanding rings → crest scales in → old rank letter morphs to the new one
// with a flash → title / sub / unlock rise in staggered → Continue. Muted palette (soft glows,
// low-opacity particles), transform/opacity only, reduced-motion aware. Dismissible by
// tap-outside, Escape, or Continue; never blocks navigation (provider clears on route change).
const labelFor = (letter) => RANK_LADDER.find(r => r.letter === letter)?.label || `${letter}-RANK`

export default function RankUpCard({ rankBefore, rankAfter, titleUnlocked, onClose }) {
  const reduce = useReducedMotion()
  const { theme } = useTheme()
  const colors = theme === 'light' ? RANK_COLORS_LIGHT : RANK_COLORS_DARK
  const color = colors[rankAfter] || '#9B6ED4'
  const hasMorph = !!rankBefore && rankBefore !== rankAfter
  const [showNew, setShowNew] = useState(reduce || !hasMorph)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Brief pause so the OLD letter reads, then morph to the NEW one.
  useEffect(() => {
    if (showNew) return undefined
    const t = setTimeout(() => setShowNew(true), 620)
    return () => clearTimeout(t)
  }, [showNew])

  const displayLetter = showNew ? rankAfter : rankBefore

  // Muted, sparser burst than a neon confetti spray — soft embers drifting outward.
  const particles = reduce ? [] : Array.from({ length: 14 })
  const rings = reduce ? [] : [0, 1]
  // Text reveals start after the crest has settled (and, when morphing, after the letter flip).
  const textBase = reduce ? 0 : (hasMorph ? 0.95 : 0.55)

  return createPortal(
    <motion.div
      className="rankup-overlay"
      role="dialog" aria-modal="true" aria-label={`Rank up to ${labelFor(rankAfter)}`}
      onClick={onClose}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ '--rank-color': color }}
    >
      {!reduce && (
        <motion.div
          className="rankup-bloom"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.6, 1.35, 1.6] }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      )}

      {rings.length > 0 && (
        <div className="rankup-rings" aria-hidden="true">
          {rings.map((r) => (
            <motion.span
              key={r}
              className="rankup-ring"
              initial={{ opacity: 0.4, scale: 0.35 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 2.6, ease: 'easeOut', repeat: Infinity, delay: r * 1.3 }}
            />
          ))}
        </div>
      )}

      {particles.length > 0 && (
        <div className="rankup-particles" aria-hidden="true">
          {particles.map((_, i) => {
            const angle = (i / particles.length) * Math.PI * 2
            const dist = 110 + (i % 4) * 40
            return (
              <motion.span
                key={i}
                className="rankup-particle"
                initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: (i % 5) * 0.04 }}
              />
            )
          })}
        </div>
      )}

      <div className="rankup-card" onClick={(e) => e.stopPropagation()}>
        <span className="rankup-card__sheen" aria-hidden="true" />
        <motion.div
          className="rankup-eyebrow"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.15 }}
        >
          RANK UP
        </motion.div>

        <motion.div
          className="rankup-crest"
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : 0.2 }}
        >
          <span className="rankup-crest__ring" aria-hidden="true" />
          <span className="rankup-crest__glow" aria-hidden="true" />
          <AnimatePresence mode="wait">
            <motion.span
              key={displayLetter}
              className="rankup-crest__letter"
              initial={reduce ? false : { opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={reduce ? {} : { opacity: 0, scale: 1.5, filter: 'blur(3px)' }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {displayLetter}
            </motion.span>
          </AnimatePresence>
          {!reduce && hasMorph && (
            <motion.span
              className="rankup-crest__flash"
              aria-hidden="true"
              key={`flash-${showNew}`}
              initial={{ opacity: 0.7, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.7 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          )}
        </motion.div>

        <motion.div
          className="rankup-title"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: textBase }}
        >
          {labelFor(rankAfter)}
        </motion.div>
        {hasMorph && (
          <motion.div
            className="rankup-sub"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: textBase + 0.1 }}
          >
            Ascended from {labelFor(rankBefore)}
          </motion.div>
        )}
        {titleUnlocked && (
          <motion.div
            className="rankup-unlock"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: textBase + 0.2 }}
          >
            New title unlocked: <strong>{titleUnlocked}</strong>
          </motion.div>
        )}
        <motion.div
          className="rankup-actions"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: textBase + 0.32 }}
        >
          <button type="button" className="rankup-btn rankup-btn--primary" onClick={onClose}>
            Continue <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  )
}

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Award, Download } from 'lucide-react'
import { EASE } from '../../utils/motion'

// C15 — Certificate earn moment. Full-screen takeover fired when a trial pass mints a
// certificate (badge). Promotes the old inline banner into a framed certificate the hunter
// can screenshot: eyebrow → seal crest scales in → framed certificate with their name →
// actions (View certificate / Continue). Muted gold palette, transform/opacity only,
// reduced-motion aware. Dismissible by tap-outside, Escape, or Continue.
const GOLD = '#D9A84E'

export default function CertificateCard({ title, kind, icon, color, name, onView, onClose }) {
  const reduce = useReducedMotion()
  const accent = color || GOLD
  const particles = reduce ? [] : Array.from({ length: 12 })
  const rings = reduce ? [] : [0, 1]

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div
      className="certcard-overlay"
      role="dialog" aria-modal="true" aria-label="Certificate earned"
      onClick={onClose}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ '--cert-color': accent }}
    >
      {!reduce && (
        <motion.div
          className="certcard-bloom"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.35, 1.6] }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      )}

      {rings.length > 0 && (
        <div className="certcard-rings" aria-hidden="true">
          {rings.map((r) => (
            <motion.span
              key={r}
              className="certcard-ring"
              initial={{ opacity: 0.35, scale: 0.35 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 2.6, ease: 'easeOut', repeat: Infinity, delay: r * 1.3 }}
            />
          ))}
        </div>
      )}

      {particles.length > 0 && (
        <div className="certcard-particles" aria-hidden="true">
          {particles.map((_, i) => {
            const angle = (i / particles.length) * Math.PI * 2
            const dist = 100 + (i % 4) * 38
            return (
              <motion.span
                key={i}
                className="certcard-particle"
                initial={{ x: 0, y: 0, opacity: 0.85, scale: 1 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: (i % 5) * 0.04 }}
              />
            )
          })}
        </div>
      )}

      <div className="certcard-card" onClick={(e) => e.stopPropagation()}>
        <span className="certcard-card__sheen" aria-hidden="true" />
        <motion.div
          className="certcard-eyebrow"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.15 }}
        >
          <Award size={13} strokeWidth={2.5} /> CERTIFICATE EARNED
        </motion.div>

        <motion.div
          className="certcard-seal"
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : 0.2 }}
        >
          <span className="certcard-seal__ring" aria-hidden="true" />
          <span className="certcard-seal__glow" aria-hidden="true" />
          <span className="certcard-seal__icon">{icon || '📜'}</span>
        </motion.div>

        <motion.div
          className="certcard-frame"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.4 }}
        >
          <div className="certcard-frame__brand">ARISE · LearnForEarn</div>
          <div className="certcard-frame__cn">Certificate of Achievement</div>
          <div className="certcard-frame__rule" aria-hidden="true" />
          <div className="certcard-frame__awarded">This certifies that</div>
          <div className="certcard-frame__name">{name || 'Hunter'}</div>
          <div className="certcard-frame__for">has mastered</div>
          <div className="certcard-frame__title">{title || 'a Skill Gate'}</div>
          {kind && <div className="certcard-frame__kind">{kind}</div>}
        </motion.div>

        <motion.div
          className="certcard-actions"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.6 }}
        >
          {onView && (
            <button type="button" className="certcard-btn certcard-btn--primary" onClick={onView}>
              <Download size={15} strokeWidth={2.4} /> View certificate
            </button>
          )}
          <button type="button" className="certcard-btn certcard-btn--ghost" onClick={onClose}>
            Continue <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  )
}

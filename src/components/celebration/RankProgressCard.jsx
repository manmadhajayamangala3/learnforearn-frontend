import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import CountUp from '../CountUp'
import { RANK_COLORS, RANK_LABELS } from '../../utils/rankReqs'
import { EASE } from '../../utils/motion'

// Ascension Progress — the "completed vs remaining" card shown after an XP earn. One animated
// bar per rank category (XP, badges, coding, mock, paths, missions, profile/resume) fills to the
// hunter's real standing. When every category is met it flips to an "all complete" state and
// AUTO-advances after 3s to the full rank-up cinematic (queued next by CelebrationContext) — no
// click needed. While still in progress it shows a Continue button instead. No share.
//
// Props:
//   rankAfter — target rank letter being worked toward (e.g. 'C')
//   rows      — [{ label, icon, suffix, bool, have, need, pct (0..1), met }]  (from buildTierRows)
//   allMet    — every row met (the ascension is unlocked)
//   cleared   — labels of the categor(y/ies) JUST crossed this moment (highlighted + eyebrow)
//   onClose   — advance the celebration queue (→ rank-up card when allMet)
// Animations: rows slide in staggered; bars fill (width — the one allowed animated dimension) with
// a soft sheen sweep; numbers count up. Reduced-motion jumps bars to final width, no stagger.
// Dismiss: tap-outside / Esc / Continue. Never blocks navigation (provider clears on route change).
export default function RankProgressCard({ rankAfter, rows = [], allMet = false, cleared = [], onClose }) {
  const reduce = useReducedMotion()
  const color = RANK_COLORS[rankAfter] || '#60A5FA'
  const label = RANK_LABELS[rankAfter] || `${rankAfter}-Rank`
  const doneCount = rows.filter(r => r.met).length
  const total = rows.length
  const clearedSet = new Set(cleared)
  const eyebrow = allMet ? 'ASCENSION UNLOCKED' : (cleared.length ? 'CATEGORY CLEARED' : 'ASCENSION PROGRESS')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // When every objective is met, ascend automatically after a beat — the learner shouldn't have
  // to click to receive a reward they've earned. Still dismissible early by tap/Escape.
  useEffect(() => {
    if (!allMet) return undefined
    const t = setTimeout(() => onClose?.(), 3000)
    return () => clearTimeout(t)
  }, [allMet, onClose])

  return createPortal(
    <motion.div
      className="rankprog-overlay"
      role="dialog" aria-modal="true" aria-label={`Progress toward ${label}`}
      onClick={onClose}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? {} : { opacity: 0 }}
      transition={{ duration: 0.24 }}
      style={{ '--rp-color': color }}
    >
      <motion.div
        className={`rankprog-card${allMet ? ' is-complete' : ''}`}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <span className="rankprog-card__sheen" aria-hidden="true" />

        <div className="rankprog-head">
          <span className="rankprog-eyebrow">{eyebrow}</span>
          <motion.div
            className="rankprog-crest"
            aria-hidden="true"
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.08 }}
          >
            <span className="rankprog-crest__ring" />
            <span className="rankprog-crest__letter">{rankAfter}</span>
          </motion.div>
          <div className="rankprog-title">Next: {label}</div>
          <div className="rankprog-sub">
            {allMet
              ? 'Every objective complete'
              : cleared.length
                ? <><strong>{cleared.length === 1 ? cleared[0] : `${cleared.length} categories`}</strong> cleared — {doneCount}/{total} done</>
                : <><strong>{doneCount}</strong> of <strong>{total}</strong> objectives complete</>}
          </div>
        </div>

        <div className="rankprog-rows">
          {rows.map((r, i) => {
            const pct = Math.round(r.pct * 100)
            const delay = reduce ? 0 : 0.22 + i * 0.07
            return (
              <motion.div
                key={r.label}
                className={`rankprog-row${r.met ? ' is-met' : ''}${clearedSet.has(r.label) ? ' is-cleared' : ''}`}
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay }}
              >
                <div className="rankprog-row__top">
                  <span className="rankprog-row__label">
                    <span className="rankprog-row__icon" aria-hidden="true">{r.icon}</span>
                    {r.label}
                  </span>
                  <span className="rankprog-row__count">
                    {r.bool
                      ? (r.met ? <><Check size={12} strokeWidth={3} /> Done</> : 'Not yet')
                      : (
                        <>
                          <CountUp value={r.have} format={(n) => n.toLocaleString('en-IN')} />{r.suffix}
                          <span className="rankprog-row__need"> / {r.need.toLocaleString('en-IN')}{r.suffix}</span>
                        </>
                      )}
                  </span>
                </div>
                <div className="rankprog-row__track">
                  <motion.div
                    className="rankprog-row__fill"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay }}
                  >
                    {!reduce && <span className="rankprog-row__shine" />}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {allMet ? (
          <div className="rankprog-ascending" aria-live="polite">
            <span className="rankprog-ascending__pulse" aria-hidden="true" />
            Ascending…
          </div>
        ) : (
          <button type="button" className="rankprog-btn" onClick={onClose}>Continue</button>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  )
}

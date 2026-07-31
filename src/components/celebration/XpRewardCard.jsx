import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import CountUp from '../CountUp'
import XpGainBar from '../XpGainBar'
import { EASE } from '../../utils/motion'
import { levelForXp, titleForLevel } from '../../utils/slLevel'

// Free Fire–style reward popup shown on ANY XP change, anywhere in the app. Built to feel
// like a post-match score summary: a leveling-avatar crest lands, the ±XP ticks up, the
// hunter's level "SCORE" bar fills (up) or drains (down) with the +earned tacked on, and an
// itemized breakdown (e.g. "Trial Cleared +50", "⭐ Daily Bonus +50") staggers in beneath it.
//
// Server-authoritative: everything animates toward the xpBefore → xpAfter the backend
// returned (A9). Dismissible by Continue, backdrop tap, or Escape — never blocks nav.
//
// Props:
//   xpEarned (+/−), xpBefore, xpAfter, levelUp, titleUnlocked
//   label       — eyebrow text (source, e.g. "TRIAL COMPLETE")
//   breakdown   — optional [{ label, amount, icon? }] itemized score lines (real values only)
//   onClose
export default function XpRewardCard({
  xpEarned = 0,
  xpBefore = 0,
  xpAfter = 0,
  levelUp = false,
  titleUnlocked = null,
  label = null,
  breakdown = null,
  onClose,
}) {
  const reduce = useReducedMotion()
  const gained = xpEarned >= 0
  const amount = Math.abs(Math.round(Number(xpEarned) || 0))
  const eyebrow = label || (gained ? 'XP EARNED' : 'XP UPDATED')

  // The leveling "avatar": the hunter-title tier reached at the post-earn XP. Its emoji +
  // color are our level identity (slLevel.js LEVEL_TITLES) — reused here as the crest.
  const avatar = useMemo(() => titleForLevel(levelForXp(Math.max(0, xpAfter))), [xpAfter])

  // Itemized score lines. Explicit breakdown wins; otherwise a single line from the source
  // (keeps totals honest — never invents XP).
  const lines = useMemo(() => {
    if (Array.isArray(breakdown) && breakdown.length) return breakdown
    const out = [{ label: gained ? 'XP Earned' : 'XP Removed', amount: xpEarned }]
    return out
  }, [breakdown, gained, xpEarned])

  // Hold the animated content until the card has landed, so it reads as "land → fill".
  const [ready, setReady] = useState(reduce)
  // The level-up flash appears a beat after the bar starts filling (increase only).
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (reduce) return undefined  // `ready` already initializes to true under reduced motion
    const t = setTimeout(() => setReady(true), 360)
    return () => clearTimeout(t)
  }, [reduce])

  useEffect(() => {
    if (!ready || !levelUp || !gained) return undefined
    const t = setTimeout(() => setFlash(true), reduce ? 0 : 820)
    return () => clearTimeout(t)
  }, [ready, levelUp, gained, reduce])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const barDelay = reduce ? 0 : 0.15
  const sparks = reduce || !gained ? [] : Array.from({ length: 12 })

  return (
    <AnimatePresence>
      <motion.div
        className="xp-reward-overlay"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="XP earned"
      >
        <motion.div
          className={`xp-reward-card${gained ? '' : ' xp-reward-card--down'}`}
          style={{ '--reward-accent': avatar.color }}
          initial={reduce ? false : { opacity: 0, scale: 0.86, y: 26 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.42, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Leveling-avatar crest */}
          <motion.div
            className="xp-reward-crest"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.1 }}
          >
            {sparks.length > 0 && (
              <span className="xp-reward-crest__sparks" aria-hidden="true">
                {sparks.map((_, i) => {
                  const angle = (i / sparks.length) * Math.PI * 2
                  const dist = 46 + (i % 3) * 12
                  return (
                    <motion.span
                      key={i}
                      className="xp-reward-crest__spark"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 + (i % 4) * 0.03 }}
                    />
                  )
                })}
              </span>
            )}
            <span className="xp-reward-crest__ring" aria-hidden="true" />
            <span className="xp-reward-crest__icon">{avatar.icon}</span>
          </motion.div>
          <div className="xp-reward-crest__name">LVL {levelForXp(Math.max(0, xpAfter))} · {avatar.title}</div>

          <div className="xp-reward-eyebrow">{eyebrow}</div>

          <div className="xp-reward-amount">
            <span className="xp-reward-amount__plus">{gained ? '+' : '−'}</span>
            <span className="xp-reward-amount__num">
              {ready ? <CountUp value={amount} duration={1050} format={(n) => n.toLocaleString()} /> : 0}
            </span>
            <span className="xp-reward-amount__unit">XP</span>
          </div>

          <AnimatePresence>
            {flash && (
              <motion.div
                className="xp-reward-levelup"
                initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                ⬆ LEVEL UP!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score bar with the +earned appended, filling / draining */}
          <div className="xp-reward-bar">
            {ready
              ? <XpGainBar xpBefore={xpBefore} xpAfter={xpAfter} earned={xpEarned} delay={barDelay} className="xp-reward-bar__inner" />
              : <div className="xp-reward-bar__placeholder" aria-hidden="true">
                  <div className="xp-gain-bar__track"><span className="xp-gain-bar__fill" style={{ width: 0 }} /></div>
                </div>}
          </div>

          {/* Itemized breakdown — staggers in like a match summary */}
          <div className="xp-reward-breakdown">
            {lines.map((ln, i) => {
              const up = Number(ln.amount) >= 0
              const amt = Math.abs(Math.round(Number(ln.amount) || 0))
              return (
                <motion.div
                  key={`${ln.label}-${i}`}
                  className="xp-reward-line"
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, ease: EASE, delay: reduce ? 0 : 0.45 + i * 0.12 }}
                >
                  <span className="xp-reward-line__label">
                    {ln.icon ? <span className="xp-reward-line__icon">{ln.icon}</span> : null}
                    {ln.label}
                  </span>
                  <span className={`xp-reward-line__amt${up ? '' : ' xp-reward-line__amt--down'}`}>
                    {up ? '+' : '−'}{amt.toLocaleString()}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {titleUnlocked ? (
            <div className="xp-reward-title">New title unlocked · <strong>{titleUnlocked}</strong></div>
          ) : null}

          <button type="button" className="xp-reward-btn" onClick={onClose}>
            CONTINUE
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

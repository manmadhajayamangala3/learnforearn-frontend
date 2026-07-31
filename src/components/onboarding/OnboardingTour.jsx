import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { EASE } from '../../utils/motion'

// C21 — first-run "System" tour. A dimming overlay that highlights one or more real on-screen
// elements at a time and narrates them (Solo-Leveling System voice). Fully driven by a `steps`
// array; the parent decides when to start, drives view changes via `onStep`, and persists the
// "seen" flag. Reduced-motion safe and mobile safe (a step whose targets are missing centers).
//
// Each step: { target?: sel, targets?: [sel, …], title, body, cta?, view?, interactive?, place? }
// `place` ('bottom'|'top'|'left'|'right') pins the card to a side of the primary target instead
// of the auto "largest-open-space" pick (e.g. nav-link steps read best directly below the link).
// `targets[0]` is the PRIMARY element — the card is placed beside it; the rest are also spotlit
// (e.g. a Gates step highlights both the gate card AND the "Dungeon Gate" nav link). Multiple
// holes are cut with an SVG mask (the box-shadow trick only manages one). The card auto-advances
// every AUTO_MS (hover pauses so the hunter can read) and is placed in the largest open space.
// `interactive: true` drops the click-catcher for that step so the spotlit element itself can be
// clicked (used for the final "click here to finish" step); such steps never auto-advance.

const PAD = 8
const GAP = 14
const CARD_W = 440
const AUTO_MS = 7000

function isVisible(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return false
  // NB: don't use offsetParent — it is always null for position:fixed elements (e.g. the
  // profile dropdown), which would wrongly filter them out. Check computed styles instead.
  const cs = getComputedStyle(el)
  return cs.display !== 'none' && cs.visibility !== 'hidden'
}
function selsForStep(step) {
  if (step?.targets?.length) return step.targets
  if (step?.target) return [step.target]
  return []
}

export default function OnboardingTour({ steps, onClose, onStep }) {
  const reduce = useReducedMotion()
  // On phones the card becomes a bottom sheet and Skip moves into the card (see placement +
  // render below): a fixed centre Skip button and an auto-placed card both collide with each
  // other and with tall, near-fullscreen targets (the drawer / profile sheet). Desktop keeps
  // the smart side-placement + the fixed Skip exactly as before.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const [idx, setIdx] = useState(0)
  const [rects, setRects] = useState([])              // all highlighted rects; [0] is primary
  const [card, setCard] = useState({ w: CARD_W, h: 190 })
  const [paused, setPaused] = useState(false)
  const cardRef = useRef(null)
  const resumeTimer = useRef(null)

  // Pause the countdown while the pointer is actively moving over the card (the hunter is
  // reading), then auto-resume ~1.3s after it goes still — or immediately when it leaves. This
  // keeps auto-advance reliable: a card appearing under a resting cursor still counts down, and
  // a stray movement can never freeze a step forever (the bug where the big centered Welcome
  // card stayed paused because the cursor rested on it and onMouseLeave never fired).
  const pauseThenResume = useCallback(() => {
    setPaused(true)
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setPaused(false), 1300)
  }, [])
  const resumeNow = useCallback(() => {
    clearTimeout(resumeTimer.current)
    setPaused(false)
  }, [])
  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  // Clamp so a steps-array change (e.g. profile steps appear after the user object loads)
  // can never leave idx pointing past the end and blank the tour.
  const safeIdx = Math.min(idx, steps.length - 1)
  const step = steps[safeIdx]
  const isFirst = safeIdx === 0
  const isLast = safeIdx === steps.length - 1

  const finish = useCallback((completed) => { onClose?.(completed) }, [onClose])
  // Reset the hover-pause on every navigation so each new step's countdown starts running.
  // This fixes the bug where clicking Next while the cursor was still over the card left
  // `paused` stuck true (the new card mounts under a stationary pointer, so onMouseEnter never
  // re-fires) and the next step's timer never began. Covers buttons, keyboard and auto-advance.
  const next = useCallback(() => { if (isLast) { finish(true) } else { setPaused(false); setIdx(i => i + 1) } }, [isLast, finish])
  const back = useCallback(() => { setPaused(false); setIdx(i => Math.max(0, i - 1)) }, [])

  // Let the parent react to each step (e.g. switch to the Gates/Paths view) before we measure.
  useEffect(() => { onStep?.(step, idx) }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Measure targets — repeatedly for ~3s so a view-switch/async render is caught — then stay in
  // sync on resize/scroll. Scroll the primary target into view first.
  useLayoutEffect(() => {
    const sels = selsForStep(steps[idx])
    const measure = () => {
      const rs = sels
        .map(sel => document.querySelector(sel))
        .filter(el => el && isVisible(el))
        .map(el => el.getBoundingClientRect())
      setRects(rs)
    }
    const primary = sels[0] ? document.querySelector(sels[0]) : null
    if (primary && isVisible(primary)) {
      try { primary.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }) } catch { primary.scrollIntoView() }
    }
    measure()
    const poll = setInterval(measure, 140)
    const stop = setTimeout(() => clearInterval(poll), 3000)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { clearInterval(poll); clearTimeout(stop); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [idx, steps, reduce])

  useLayoutEffect(() => {
    if (cardRef.current) setCard({ w: cardRef.current.offsetWidth || CARD_W, h: cardRef.current.offsetHeight || 190 })
  }, [idx, rects])

  // Auto-advance. The single source of truth is the visible top bar: it advances the moment the
  // bar empties (onAnimationEnd on .tour-card__timer-fill), so the countdown a hunter SEES and the
  // actual step change are the exact same clock — no lag after the bar finishes. Pause/resume is
  // handled natively by the bar's animationPlayState (it freezes and continues in place), which is
  // why we no longer run a separate JS setTimeout here (the old one reset to a full 5s on every
  // resume, so it lagged the bar after any hover/mouse-move). Reduced motion has no running bar, so
  // it still needs a plain fallback timer.
  useEffect(() => {
    if (!reduce) return undefined
    if (paused || step?.interactive || isLast) return undefined
    const t = setTimeout(next, AUTO_MS)
    return () => clearTimeout(t)
  }, [idx, paused, next, step?.interactive, isLast, reduce])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(false) }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, finish])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const cardW = Math.min(CARD_W, vw - 24)

  // Padded spotlight boxes for every visible target.
  const spots = rects.map(r => ({
    top: Math.max(0, r.top - PAD),
    left: Math.max(0, r.left - PAD),
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  }))
  const primary = spots[0] || null

  // Smart placement beside the PRIMARY highlight; centered when nothing is on screen.
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max))
  let cardStyle
  let centered = false
  if (isMobile && primary) {
    // Mobile: pin the card as a bottom sheet. Every mobile target (hamburger, drawer list,
    // profile sheet) is top-anchored, so the spotlight reads clearly ABOVE the sheet and the
    // card can never overlap it or a floating Skip. Uses left/right (not width) to span the
    // screen with a safe-area-aware bottom gap.
    cardStyle = { left: 12, right: 12, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }
  } else if (primary) {
    const spaceBottom = vh - (primary.top + primary.height)
    const spaceTop = primary.top
    const spaceRight = vw - (primary.left + primary.width)
    const spaceLeft = primary.left
    const needV = card.h + GAP + 12
    const needH = cardW + GAP + 12
    const cx = primary.left + primary.width / 2
    const cy = primary.top + primary.height / 2
    const options = [
      { side: 'bottom', ok: spaceBottom >= needV, space: spaceBottom },
      { side: 'top', ok: spaceTop >= needV, space: spaceTop },
      { side: 'right', ok: spaceRight >= needH, space: spaceRight },
      { side: 'left', ok: spaceLeft >= needH, space: spaceLeft },
    ].filter(o => o.ok).sort((a, b) => b.space - a.space)
    // A step may pin the card to a side (e.g. nav links always read best directly below).
    const side = step?.place || options[0]?.side
    if (side === 'bottom') cardStyle = { top: primary.top + primary.height + GAP, left: clamp(cx - cardW / 2, 12, vw - cardW - 12), width: cardW }
    else if (side === 'top') cardStyle = { top: clamp(primary.top - GAP - card.h, 12, vh - card.h - 12), left: clamp(cx - cardW / 2, 12, vw - cardW - 12), width: cardW }
    else if (side === 'right') cardStyle = { top: clamp(cy - card.h / 2, 12, vh - card.h - 12), left: primary.left + primary.width + GAP, width: cardW }
    else if (side === 'left') cardStyle = { top: clamp(cy - card.h / 2, 12, vh - card.h - 12), left: clamp(primary.left - GAP - cardW, 12, vw - cardW - 12), width: cardW }
    else centered = true
  } else {
    centered = true
  }
  // Centre with numeric top/left (not a CSS transform) so it doesn't fight framer-motion.
  if (centered) cardStyle = { top: Math.max(12, (vh - card.h) / 2), left: Math.max(12, (vw - cardW) / 2), width: cardW }

  const cardAnim = reduce
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, scale: 0.98 }, transition: { duration: 0.26, ease: EASE } }

  return createPortal(
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Getting-started tour">
      {/* Click-catcher: blocks the page so the hunter follows the tour. Dropped on an
          interactive step so the spotlit element beneath can actually be clicked. */}
      <div className="tour-catch" style={step?.interactive ? { pointerEvents: 'none' } : undefined} />

      {/* Desktop: a single fixed Skip control bottom-centre, clear of the card. On mobile the
          card is a bottom sheet down there, so Skip moves INTO the card footer instead. */}
      {!isMobile && (
        <button className="tour-skip-fixed" onClick={() => finish(false)}>Skip tour <X size={13} /></button>
      )}

      {/* Dimming layer: an SVG mask cuts a transparent hole for every highlighted element. */}
      {spots.length > 0 ? (
        <svg className="tour-mask" width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} aria-hidden="true">
          <defs>
            <mask id="tour-hole-mask">
              <rect x="0" y="0" width={vw} height={vh} fill="white" />
              {spots.map((s, i) => (
                <rect key={i} x={s.left} y={s.top} width={s.width} height={s.height} rx="12" fill="black" />
              ))}
            </mask>
          </defs>
          <rect x="0" y="0" width={vw} height={vh} fill="rgba(6,7,15,0.74)" mask="url(#tour-hole-mask)" />
          {spots.map((s, i) => (
            <rect key={`ring${i}`} x={s.left} y={s.top} width={s.width} height={s.height} rx="12" className="tour-hole-ring" />
          ))}
        </svg>
      ) : (
        <div className="tour-dim" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          ref={cardRef}
          className={`tour-card${centered ? ' tour-card--center' : ''}`}
          style={cardStyle}
          // Pause on real pointer MOVEMENT over the card, not on mouse-enter: a step's card
          // often mounts right under a resting cursor (the arena spotlights jump around the
          // screen), and onMouseEnter fires on mount-under-cursor — which would wrongly pause a
          // fresh step's timer. Movement (reading) pauses transiently; going still or leaving resumes.
          onMouseMove={pauseThenResume}
          onMouseLeave={resumeNow}
          {...cardAnim}
        >
          {!isLast && !step?.interactive && (
            <div className="tour-card__timer" aria-hidden="true">
              <div
                key={idx}
                className="tour-card__timer-fill"
                style={{ animationDuration: `${AUTO_MS}ms`, animationPlayState: paused || reduce ? 'paused' : 'running' }}
                // The bar IS the clock: advance the instant it empties. Reduced motion keeps the bar
                // frozen (no animationEnd), so its fallback JS timer above drives the advance instead.
                onAnimationEnd={() => { if (!reduce && !paused) next() }}
              />
            </div>
          )}

          <div className="tour-card__tag">[ SYSTEM ]</div>
          <div className="tour-card__title">{step.title}</div>
          <p className="tour-card__body">{step.body}</p>

          <div className="tour-card__foot">
            <div className="tour-card__dots" aria-hidden="true">
              {steps.map((_, i) => (
                <span key={i} className={`tour-dot${i === idx ? ' is-active' : ''}${i < idx ? ' is-done' : ''}`} />
              ))}
            </div>
            <div className="tour-card__btns">
              {isMobile && (
                <button className="tour-btn tour-card__skip-inline" onClick={() => finish(false)}>Skip</button>
              )}
              {!isFirst && (
                <button className="tour-btn" onClick={back}><ChevronLeft size={14} /> Back</button>
              )}
              <button className="tour-btn tour-btn--primary" onClick={next}>
                {isLast ? (step.cta || 'Done') : (<>Next <ChevronRight size={14} /></>)}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  )
}

import { useCallback, useRef, useState } from 'react'
import { reducedMotion } from '../utils/motion'
import useHaptic from './useHaptic'
import { useCelebrate } from '../context/CelebrationContext'

// Central hook that owns every XP visual reaction. Every place XP changes calls
// this. It never computes XP/level/rank itself — the server is authoritative;
// the frontend only animates toward the values the server returns (A9 shape).
//
// Responsibilities:
//   - spawnFloat(amount, position): floating +N / -N XP element at a screen point
//       increase -> green, floats up;  decrease -> amber, floats down (see xp-float CSS)
//   - processResult(resp, position): normalize an A9 XP response, fire the float +
//       haptic, and return a change summary so callers can sequence the level-up (C2)
//       then rank-up (C1) cinematics.
//   - cleanup(): clears pending float timers (call on unmount).
//
// Bar fill animation is handled by CSS `transition: width` on the fills themselves
// (see A6/A7) — a decrease eases the fill DOWN, an increase eases it UP; neither snaps.

const FLOAT_MS = 900
let _floatId = 0

export default function useXpAnimation() {
  const [floats, setFloats] = useState([])
  const timers = useRef(new Set())
  const haptic = useHaptic()
  const celebrate = useCelebrate()

  const removeFloat = useCallback((id) => {
    setFloats((list) => list.filter((f) => f.id !== id))
  }, [])

  const spawnFloat = useCallback((amount, position) => {
    const amt = Math.round(Number(amount) || 0)
    if (amt === 0) return
    const id = ++_floatId
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0
    const x = position?.x ?? vw / 2
    const y = position?.y ?? vh / 2
    setFloats((list) => [...list, { id, amount: amt, x, y, dir: amt > 0 ? 'up' : 'down' }])
    const ttl = (reducedMotion() ? 220 : FLOAT_MS) + 80
    const t = setTimeout(() => { removeFloat(id); timers.current.delete(t) }, ttl)
    timers.current.add(t)
  }, [removeFloat])

  const cleanup = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
  }, [])

  // processResult(resp, position, opts)
  //   opts.popup (default true) — show the full game-style XP reward popup. Pass false for
  //   passive/background earns (study pings) so they only float + fire level/rank moments.
  const processResult = useCallback((resp, position, opts = {}) => {
    if (!resp || typeof resp !== 'object') return null
    const earned = Math.round(Number(resp.xpEarned ?? 0))
    const summary = {
      xpEarned: earned,
      xpBefore: resp.xpBefore ?? null,
      xpAfter: resp.xpAfter ?? null,
      levelBefore: resp.levelBefore ?? null,
      levelAfter: resp.levelAfter ?? null,
      levelUp: !!resp.levelUp,
      rankBefore: resp.rankBefore ?? null,
      rankAfter: resp.rankAfter ?? null,
      rankUp: !!resp.rankUp,
      titleUnlocked: resp.titleUnlocked ?? null,
      dailyBonusEarned: !!resp.dailyBonusEarned,
      // Optional presentation extras for the reward popup: an eyebrow label naming the
      // source, and an itemized breakdown of the earn (real values only).
      sourceLabel: opts.label ?? resp.sourceLabel ?? null,
      breakdown: opts.breakdown ?? resp.breakdown ?? null,
    }
    const showPopup = opts.popup !== false && earned !== 0
    if (earned !== 0) {
      // When the popup shows it IS the feedback — skip the redundant floating number.
      if (!showPopup) spawnFloat(earned, position)
      haptic(summary.rankUp || summary.levelUp ? 'milestone' : (earned > 0 ? 'success' : 'tap'))
    }
    // Single entry point: the popup (up/down XP + inline level-up) then the rank-up card.
    celebrate(summary, { reward: showPopup })
    return summary
  }, [spawnFloat, haptic, celebrate])

  return { floats, spawnFloat, processResult, cleanup }
}

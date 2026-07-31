import { useCallback } from 'react'
import { reducedMotion } from '../utils/motion'

// Lightweight haptic feedback wrapper around navigator.vibrate.
// - Feature-detected (no-op where vibrate is unavailable, e.g. desktop/iOS Safari).
// - Never fires on non-touch devices.
// - Respects a global on/off preference (default on) and prefers-reduced-motion.
//
// Usage: const haptic = useHaptic(); haptic('tap')

const PREF_KEY = 'haptics_enabled'

const PATTERNS = {
  tap: 10,
  success: [15, 40, 15],
  milestone: [20, 60, 20, 60, 45],
}

function prefEnabled() {
  try {
    const v = localStorage.getItem(PREF_KEY)
    return v === null ? true : v === 'true'
  } catch {
    return true
  }
}

function isTouchDevice() {
  if (typeof navigator === 'undefined') return false
  const maxTouch = navigator.maxTouchPoints || 0
  return maxTouch > 0 || (typeof window !== 'undefined' && 'ontouchstart' in window)
}

export function setHapticsEnabled(on) {
  try { localStorage.setItem(PREF_KEY, on ? 'true' : 'false') } catch { /* ignore */ }
}

export function getHapticsEnabled() {
  return prefEnabled()
}

export default function useHaptic() {
  return useCallback((pattern = 'tap') => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    if (!isTouchDevice()) return
    if (reducedMotion()) return
    if (!prefEnabled()) return
    const p = Object.prototype.hasOwnProperty.call(PATTERNS, pattern) ? PATTERNS[pattern] : pattern
    try { navigator.vibrate(p) } catch { /* ignore */ }
  }, [])
}

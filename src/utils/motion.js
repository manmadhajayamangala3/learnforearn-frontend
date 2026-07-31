// Single source of truth for animation timing across the app.
//
// The easing curve below was previously redeclared as a local `const EASE`
// in ~28 files. Import it from here instead so there is exactly one definition.
// The value is intentionally identical to every prior local copy — this is a
// pure de-duplication with zero visual change.
export const EASE = [0.16, 1, 0.3, 1]

// Standard framer-motion durations (seconds). Use these instead of ad-hoc numbers
// so timing stays consistent across surfaces.
export const DURATION = { FAST: 0.2, BASE: 0.4, SLOW: 0.8 }

// Synchronous read of the OS "reduce motion" preference, for use in plain
// utilities/hooks that are NOT React components. Inside components prefer
// framer-motion's useReducedMotion() (matches PublicProfilePage.jsx:71).
export function reducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

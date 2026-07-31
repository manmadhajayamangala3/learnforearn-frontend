// ── XP → Level (escalating curve) — mirrors backend LevelUtil ──
//
// Level is driven purely by lifetime XP. The per-level XP cost starts at 100 and
// grows by 15 each level, so early levels come fast and later ones take longer:
//   L1→L2 = 100, L2→L3 = 115, L3→L4 = 130, … (+15 each step)
//
// Cumulative XP required to reach level L:
//   cumulative(L) = 100*(L-1) + 15*(L-1)*(L-2)/2

/** Total lifetime XP needed to have reached `level` (level 1 = 0 XP). */
export function cumulativeXpForLevel(level) {
  if (level <= 1) return 0
  const n = level - 1
  return 100 * n + (15 * n * (n - 1)) / 2
}

/** Highest level whose cumulative XP requirement is satisfied by `xp` (min 1). */
export function levelForXp(xp = 0) {
  if (xp <= 0) return 1
  let level = 1
  while (cumulativeXpForLevel(level + 1) <= xp) level++
  return level
}

/**
 * Progress within the current level as { level, into, span, pct } where
 * `into` is XP earned into the current level, `span` is XP the level spans,
 * and `pct` is 0–100 progress toward the next level.
 */
export function levelProgress(xp = 0) {
  const level = levelForXp(xp)
  const floor = cumulativeXpForLevel(level)
  const ceil = cumulativeXpForLevel(level + 1)
  const span = ceil - floor
  const into = xp - floor
  const pct = span > 0 ? Math.round((into / span) * 100) : 100
  return { level, into, span, pct }
}

// ── Hunter Titles — cosmetic milestone names unlocked purely by Hunter Level ──
// The title ladder and its icons now live in the central progression registry
// (constants/progression.js) alongside the rank titles, so custom logos can be
// swapped in one place. Re-exported here so existing imports keep working.
export { LEVEL_TITLES, titleForLevel } from '../constants/progression'

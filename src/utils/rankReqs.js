// Single source of truth for the multi-dimensional rank gates. These MUST mirror the backend
// RankEvaluationService.rankFor(...) EXACTLY — each atom is one condition with its threshold
// (`need`) and the key used to resolve the user's live count from the /progress/rank-progress
// payload. Shared by the Hunter Instructions checklist, the Ascension Progress card, and the
// dev demo so they can never drift.

export const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S']

export const RANK_COLORS = {
  E: '#888888', D: '#4ADE80', C: '#60A5FA', B: '#9B6ED4', A: '#F59E0B', S: '#EF4444',
}

export const RANK_LABELS = {
  E: 'E-Rank', D: 'D-Rank', C: 'C-Rank', B: 'B-Rank', A: 'A-Rank', S: 'S-Rank',
}

// Per-tier gate conditions. `icon` is purely cosmetic (Ascension card / drawer rows).
export const RANK_REQ_TIERS = [
  { letter: 'D', color: '#4ADE80', xp: '1,000', atoms: [
    { label: 'XP earned', icon: '⚡', key: 'xp', need: 1000 },
    { label: 'Subject badges', icon: '🎖️', key: 'subjects', need: 1 },
    { label: 'Coding problems', icon: '💻', key: 'code', need: 5 },
    { label: 'E-rank missions', icon: '🛰️', mkey: 'E', need: 5 },
    { label: 'D-rank missions', icon: '🛰️', mkey: 'D', need: 2 },
  ] },
  { letter: 'C', color: '#60A5FA', xp: '3,500', atoms: [
    { label: 'XP earned', icon: '⚡', key: 'xp', need: 3500 },
    { label: 'Subject badges', icon: '🎖️', key: 'subjects', need: 3 },
    { label: 'Coding problems', icon: '💻', key: 'code', need: 20 },
    { label: 'Aptitude mock best', icon: '🎯', key: 'mockBest', need: 35, suffix: '/50' },
    { label: 'Career paths started', icon: '🗺️', key: 'pathsStarted', need: 1 },
    { label: 'D-rank missions', icon: '🛰️', mkey: 'D', need: 5 },
    { label: 'C-rank missions', icon: '🛰️', mkey: 'C', need: 2 },
  ] },
  { letter: 'B', color: '#9B6ED4', xp: '8,000', atoms: [
    { label: 'XP earned', icon: '⚡', key: 'xp', need: 8000 },
    { label: 'Subject badges', icon: '🎖️', key: 'subjects', need: 6 },
    { label: 'Coding problems', icon: '💻', key: 'code', need: 50 },
    { label: 'Aptitude mock best', icon: '🎯', key: 'mockBest', need: 41, suffix: '/50' },
    { label: 'Paths at 70%+', icon: '🧭', key: 'roadmapsAt70', need: 1 },
    { label: 'Career paths started', icon: '🗺️', key: 'pathsStarted', need: 2 },
    { label: 'C-rank missions', icon: '🛰️', mkey: 'C', need: 5 },
    { label: 'B-rank missions', icon: '🛰️', mkey: 'B', need: 2 },
    { label: 'Profile + resume complete', icon: '📄', key: 'profileResume', bool: true },
  ] },
  { letter: 'A', color: '#F59E0B', xp: '16,000', atoms: [
    { label: 'XP earned', icon: '⚡', key: 'xp', need: 16000 },
    { label: 'Subject badges', icon: '🎖️', key: 'subjects', need: 10 },
    { label: 'Coding problems', icon: '💻', key: 'code', need: 100 },
    { label: 'Aptitude mock best', icon: '🎯', key: 'mockBest', need: 46, suffix: '/50' },
    { label: 'Full paths completed', icon: '🏁', key: 'fullPaths', need: 1 },
    { label: 'Paths at 50%+', icon: '🧭', key: 'roadmapsAt50', need: 2 },
    { label: 'B-rank missions', icon: '🛰️', mkey: 'B', need: 4 },
    { label: 'A-rank missions', icon: '🛰️', mkey: 'A', need: 2 },
    { label: 'Profile + resume complete', icon: '📄', key: 'profileResume', bool: true },
  ] },
  { letter: 'S', color: '#EF4444', xp: '30,000', atoms: [
    { label: 'XP earned', icon: '⚡', key: 'xp', need: 30000 },
    { label: 'Subject badges', icon: '🎖️', key: 'subjects', need: 15 },
    { label: 'Coding problems', icon: '💻', key: 'code', need: 180 },
    { label: 'Aptitude mock best', icon: '🎯', key: 'mockBest', need: 49, suffix: '/50' },
    { label: 'Full paths completed', icon: '🏁', key: 'fullPaths', need: 2 },
    { label: 'A-rank missions', icon: '🛰️', mkey: 'A', need: 3 },
    { label: 'S-rank missions', icon: '🛰️', mkey: 'S', need: 2 },
    { label: 'Profile + resume complete', icon: '📄', key: 'profileResume', bool: true },
  ] },
]

// Resolve the user's live count for one atom from the rank-progress payload.
// Returns null when there's no live data yet (guest / loading) so a row can render statically.
export function haveFor(rp, atom) {
  if (!rp) return null
  if (atom.bool) return rp.profileResume ? 1 : 0
  if (atom.mkey) return Number(rp.missions?.[atom.mkey] ?? 0)
  return Number(rp[atom.key] ?? 0)
}

/** Look up a tier definition by its rank letter (e.g. 'C'), or null if unknown. */
export function tierFor(letter) {
  return RANK_REQ_TIERS.find(t => t.letter === letter) || null
}

/**
 * All-complete rows for a tier — every objective met (have === need). Used for the rank-up
 * sequence: a server rankUp:true means every gate for that tier passed, so we can show the
 * Ascension Progress card fully green without fetching, on any page that awards XP.
 */
export function allCompleteRows(letter) {
  const tier = tierFor(letter)
  if (!tier) return []
  return tier.atoms.map(a => {
    const need = a.bool ? 1 : a.need
    return { label: a.label, icon: a.icon, suffix: a.suffix || '', bool: !!a.bool, have: need, need, pct: 1, met: true }
  })
}

/** The tier a hunter is working toward next (the one just above their current rank), or null at S. */
export function nextTierFor(rankLetter) {
  const idx = RANK_ORDER.indexOf(rankLetter || 'E')
  const nextLetter = RANK_ORDER[Math.min(RANK_ORDER.length - 1, idx + 1)]
  if (nextLetter === rankLetter) return null // already at S
  return RANK_REQ_TIERS.find(t => t.letter === nextLetter) || null
}

/**
 * Build the per-category rows for a tier against a live rank-progress payload.
 * Each row: { label, icon, have, need, pct (0..1), met, bool }. When `rp` is null every row
 * reports have:0 so bars render empty (used only as a safe fallback).
 */
export function buildTierRows(rp, tier) {
  if (!tier) return []
  return tier.atoms.map(a => {
    const need = a.bool ? 1 : a.need
    const have = Math.max(0, Number(haveFor(rp, a) ?? 0))
    const met = have >= need
    const pct = met ? 1 : Math.max(0, Math.min(1, have / need))
    return { label: a.label, icon: a.icon, suffix: a.suffix || '', bool: !!a.bool, have, need, pct, met }
  })
}

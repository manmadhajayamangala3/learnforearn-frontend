// ─────────────────────────────────────────────────────────────────────────────
// PROGRESSION ICON REGISTRY — single place to edit every Hunter title/rank icon.
//
// This is the ONE file to touch when you want to swap the placeholder emojis for
// custom images / logos. There are two separate ladders:
//
//   1. LEVEL_TITLES — cosmetic milestone names unlocked purely by Hunter LEVEL
//      (driven by lifetime XP). 9 rungs, Level 1 → 50.
//   2. RANK_TITLES  — the overall Hunter CLASS (E → S), gated on the backend by
//      category completion. 6 rungs, one per rank letter.
//
// ── How to replace an emoji with a custom logo ───────────────────────────────
// Each entry has both an `icon` (emoji placeholder, always safe) and an `image`
// slot (null for now). To use a custom logo, do ONE of:
//   • Drop the file in FrontEnd/public/progression/ and set an absolute path:
//       image: '/progression/monarch.png'
//   • Or import a bundled asset at the top of this file and reference it:
//       import monarch from '../assets/progression/monarch.png'
//       … image: monarch
// Then render with `progressionAsset(entry)` — it returns the image when set and
// falls back to the emoji until you add one. Nothing else in the app needs to
// change; every screen reads its title/icon from here.
//
// Colors mirror the E→S palette used across the arena so both ladders read as a
// rising line. Rank letters/labels/thresholds come from constants/ranks.js so
// there is never a second copy of the XP numbers to keep in sync.
// ─────────────────────────────────────────────────────────────────────────────

import { RANK_LADDER } from './ranks'

// ── 1. HUNTER LEVEL TITLES (unlocked by Hunter Level) ────────────────────────
// `level`  — the Hunter Level at which this title unlocks
// `title`  — display name
// `icon`   — emoji placeholder (replace by filling `image`)
// `image`  — custom logo path/import, or null to keep the emoji
// `color`  — accent color for the crest/badge
export const LEVEL_TITLES = [
  { level: 1,  title: 'Awakened',       icon: '🌑', image: null, color: '#64748B' },
  { level: 5,  title: 'Novice Hunter',  icon: '🗡️', image: null, color: '#4ADE80' },
  { level: 10, title: 'Skilled Hunter', icon: '⚔️', image: null, color: '#22D3EE' },
  { level: 15, title: 'Elite Hunter',   icon: '🛡️', image: null, color: '#60A5FA' },
  { level: 20, title: 'Veteran Hunter', icon: '🏹', image: null, color: '#818CF8' },
  { level: 25, title: 'Ace Hunter',     icon: '💠', image: null, color: '#9B6ED4' },
  { level: 30, title: 'Master Hunter',  icon: '👑', image: null, color: '#F59E0B' },
  { level: 40, title: 'Monarch',        icon: '🔥', image: null, color: '#FB7185' },
  { level: 50, title: 'Sovereign',      icon: '⭐', image: null, color: '#EF4444' },
]

/** Highest LEVEL title unlocked at `level` (never null — Level 1 = Awakened). */
export function titleForLevel(level = 1) {
  let current = LEVEL_TITLES[0]
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.level) current = entry
  }
  return current
}

// ── 2. HUNTER RANK TITLES (overall class, E → S) ─────────────────────────────
// Ranks previously had only a letter (E-RANK … S-RANK). Each now gets a distinct
// class `title` and its own `icon`/`image` — kept deliberately separate from the
// LEVEL titles above (weapon icons for levels, a rising "phase" set for ranks) so
// the two ladders never look like the same thing. Letter, label, XP threshold and
// base color are pulled from RANK_LADDER so the numbers stay in one place.
const RANK_META = {
  E: { title: 'Initiate',  icon: '🌑', image: null },
  D: { title: 'Striver',   icon: '🌘', image: null },
  C: { title: 'Ascendant', icon: '🌗', image: null },
  B: { title: 'Paragon',   icon: '🌖', image: null },
  A: { title: 'Vanguard',  icon: '🌕', image: null },
  S: { title: 'Radiant',   icon: '☀️', image: null },
}

// `letter` — rank letter (E … S)          `label` — 'E-RANK' … 'S-RANK'
// `minXp`  — lifetime XP where it starts   `color` — rank accent
// `title`/`icon`/`image` — from RANK_META above
export const RANK_TITLES = RANK_LADDER.map((r) => ({
  letter: r.letter,
  label: r.label,
  minXp: r.min,
  color: r.color,
  ...RANK_META[r.letter],
}))

/** Rank-title entry for a rank letter (defaults to E when unknown/missing). */
export function rankTitleFor(letter = 'E') {
  return RANK_TITLES.find((r) => r.letter === letter) || RANK_TITLES[0]
}

// Sub-tier pips within a rank (Free-Fire "Diamond I/II/III" style). These are NOT stored per
// entry — they're derived at render time from how many of a rank's gate objectives are met
// (see utils/rankReqs.js). This is just the max pip count per rank so the badge art knows how
// many stars to draw. Kept here so the design layer has one number to read.
export const RANK_SUBTIERS = 3

// ── 3. STREAK TIERS (consecutive active days) ────────────────────────────────
// Merges what today is split across StreakFlame.jsx (the 3/7/14/30 scale steps) and
// StreakMilestoneCard.jsx (the milestone copy). One ladder so the thresholds can never drift.
// Colors rise ember → crimson so a "mana flame" can change hue by tier instead of a single amber.
// `grantsShield` marks the tier that awards a Streak Shield (currently day 7).
export const STREAK_TIERS = [
  { days: 3,  name: 'Habit Forming',      sub: 'Three days in a row — the hardest part is behind you.', icon: '🔥', image: null, color: '#F59E0B', grantsShield: false },
  { days: 7,  name: 'One Week Strong',    sub: 'Seven days unbroken. You earned a Streak Shield.',      icon: '🔥', image: null, color: '#FB923C', grantsShield: true  },
  { days: 14, name: 'Two Weeks Unbroken', sub: 'Fourteen days of showing up. This is momentum.',        icon: '🔥', image: null, color: '#FB7185', grantsShield: false },
  { days: 30, name: 'A Full Month',       sub: 'Thirty days straight — elite consistency.',             icon: '🔥', image: null, color: '#EF4444', grantsShield: false },
]

/** Highest streak tier reached at `days` (null below the first milestone of 3). */
export function streakTierFor(days = 0) {
  let current = null
  for (const t of STREAK_TIERS) {
    if (days >= t.days) current = t
  }
  return current
}

// The Streak Shield item itself — a single collectible (stackable count lives on the user).
// Saves a streak when a day is missed. Own crest so it can become designed art later.
export const STREAK_SHIELD = { name: 'Streak Shield', desc: 'Saves your streak if you miss a day.', icon: '🛡️', image: null, color: '#22D3EE' }

// ── 4. ACHIEVEMENT BADGES (subject mastery / career milestones) ──────────────
// Mirrors utils/badgeMeta.js today (kept in sync manually for now; wire badgeMeta to read from
// here in a later pass). `label` is the shown badge name, `kind` the plain meaning.
export const ACHIEVEMENT_BADGES = {
  SUBJECT_MASTERED: { label: 'Gate Sovereign', kind: 'Subject Mastered', icon: '🎖️', image: null, color: '#F59E0B' },
  INTERVIEW_READY:  { label: 'Rising Hunter',  kind: 'Interview Ready',  icon: '🎯', image: null, color: '#60A5FA' },
  JOB_READY:        { label: 'Elite Hunter',   kind: 'Job Ready',        icon: '🏆', image: null, color: '#F59E0B' },
}
export const ACHIEVEMENT_FALLBACK = { label: 'Achievement', kind: 'Cleared', icon: '🏅', image: null, color: '#9B6ED4' }

/** Achievement-badge entry for a badge key (falls back to a generic achievement). */
export function achievementBadge(key) {
  return ACHIEVEMENT_BADGES[key] || ACHIEVEMENT_FALLBACK
}

// ── Shared helper ────────────────────────────────────────────────────────────
/**
 * The visual for any level/rank entry: the custom `image` once you set one,
 * otherwise the emoji `icon`. Use this everywhere so filling `image` above is the
 * only change needed to switch a placeholder to a real logo.
 */
export function progressionAsset(entry) {
  return entry?.image || entry?.icon || ''
}

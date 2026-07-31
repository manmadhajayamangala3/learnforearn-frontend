// ─────────────────────────────────────────────────────────────────────────────
// BADGE & TITLE SHOWCASE  —  /allbadges  (DEV-only, reference gallery)
//
// One page that renders EVERY icon / title / badge / tier used across the whole
// project, pulled live from its real source so it always reflects the code:
//   • Hunter Ranks (E→S)          → constants/progression.js  RANK_TITLES
//   • Hunter Level Titles (9)     → constants/progression.js  LEVEL_TITLES
//   • Streak Tiers + Shield       → constants/progression.js  STREAK_TIERS / STREAK_SHIELD
//   • Achievement Badges          → constants/progression.js  ACHIEVEMENT_BADGES
//   • Subject Hunter Titles       → utils/subjectBadgeTitle.js
//   • Rank objective icons        → utils/rankReqs.js
//
// This page changes NOTHING in the app — it only reads. To swap an emoji for a
// custom logo, edit the `image` slot in constants/progression.js; it shows here
// automatically (via progressionAsset). Route is DEV-only and hidden from nav.
// ─────────────────────────────────────────────────────────────────────────────
import {
  LEVEL_TITLES,
  RANK_TITLES,
  RANK_SUBTIERS,
  STREAK_TIERS,
  STREAK_SHIELD,
  ACHIEVEMENT_BADGES,
  ACHIEVEMENT_FALLBACK,
  progressionAsset,
} from '../constants/progression'
import subjectBadgeTitle from '../utils/subjectBadgeTitle'
import { RANK_REQ_TIERS } from '../utils/rankReqs'
import StreakFlame from '../components/StreakFlame'

// Representative subjects so the keyword-matched subject titles are all visible.
const SAMPLE_SUBJECTS = [
  'Python Fundamentals', 'React', 'Django REST Framework', 'Spring Boot', 'Node.js',
  'TypeScript', 'JavaScript', 'HTML', 'CSS', 'SQL & Databases', 'MongoDB',
  'Docker & Kubernetes', 'Git & GitHub', 'Machine Learning', 'Deep Learning', 'NLP',
  'Pandas & NumPy', 'PyTorch', 'Power BI', 'Excel', 'Statistics & Probability',
  'LangChain / RAG', 'OOP Concepts',
]

// Unique cosmetic objective icons used in the rank-up checklist (deduped by icon).
const OBJECTIVE_ICONS = (() => {
  const seen = new Map()
  for (const tier of RANK_REQ_TIERS) {
    for (const a of tier.atoms) {
      if (!seen.has(a.icon)) seen.set(a.icon, a.label)
    }
  }
  return [...seen.entries()].map(([icon, label]) => ({ icon, label }))
})()

// Render the custom image once an `image` is set, else the emoji placeholder.
function Glyph({ entry, size = 40 }) {
  const asset = progressionAsset(entry)
  const isImg = typeof asset === 'string' &&
    (asset.startsWith('/') || asset.startsWith('http') || /\.(png|jpe?g|svg|webp|gif)$/i.test(asset))
  if (isImg) {
    return <img src={asset} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{asset || '—'}</span>
}

function Section({ title, source, note, children }) {
  return (
    <div style={{ marginBottom: '2.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>{title}</h2>
        <code style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#B48AE8', background: 'rgba(155,110,212,0.1)', border: '1px solid rgba(155,110,212,0.25)', padding: '2px 8px', borderRadius: 4 }}>{source}</code>
      </div>
      {note && <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 1rem', maxWidth: 720, lineHeight: 1.5 }}>{note}</p>}
      {children}
    </div>
  )
}

const GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.9rem' }

function card(color) {
  return {
    background: '#0a0d18',
    border: `1px solid ${color}33`,
    borderRadius: 12,
    padding: '1.1rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: `0 4px 22px ${color}12`,
  }
}
const crest = (color) => ({
  width: 60, height: 60, borderRadius: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `${color}18`, border: `1px solid ${color}44`,
})
const swatch = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)',
})
const nameStyle = { fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }
const metaStyle = { fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }
const subStyle = { fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }
const chip = (color) => ({ fontSize: '0.55rem', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '2px 8px', letterSpacing: '0.06em', alignSelf: 'flex-start' })

export default function BadgeShowcasePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#06080f', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#B48AE8', letterSpacing: '0.12em' }}>ARISE</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>/ BADGE &amp; TITLE SHOWCASE</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>reference only · edit <code style={{ color: '#B48AE8' }}>constants/progression.js</code></span>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '2rem 2rem 5rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', maxWidth: 760, lineHeight: 1.6, marginTop: 0, marginBottom: '2.5rem' }}>
          Every title, rank, streak tier and badge in the whole project, in one place. Each has an emoji placeholder and an empty <code style={{ color: '#B48AE8' }}>image</code> slot in the registry — fill a slot with a custom logo path and it renders here (and everywhere) automatically. Nothing on this page affects the live app.
        </p>

        {/* 1 — RANKS */}
        <Section
          title="Hunter Ranks (E → S)"
          source="progression.js · RANK_TITLES"
          note={`Your overall class, gated by category completion on the backend. Each rank can show up to ${RANK_SUBTIERS} sub-tier pips (Diamond I/II/III style) as objectives are met.`}
        >
          <div style={GRID}>
            {RANK_TITLES.map((r) => (
              <div key={r.letter} style={card(r.color)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <div style={crest(r.color)}><Glyph entry={r} /></div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1.6rem', color: r.color }}>{r.letter}</div>
                </div>
                <div style={nameStyle}>{r.title}</div>
                <div style={metaStyle}>{r.label} · {r.minXp === 0 ? 'START' : `${r.minXp.toLocaleString('en-IN')}+ XP`}</div>
                <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: RANK_SUBTIERS }).map((_, i) => (
                    <span key={i} style={{ color: r.color, opacity: 0.4, fontSize: '0.7rem' }}>★</span>
                  ))}
                </div>
                <div style={swatch(r.color)}><span style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />{r.color}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 2 — LEVEL TITLES */}
        <Section
          title="Hunter Level Titles"
          source="progression.js · LEVEL_TITLES"
          note="Cosmetic milestone names unlocked purely by Hunter Level (driven by lifetime XP)."
        >
          <div style={GRID}>
            {LEVEL_TITLES.map((t) => (
              <div key={t.level} style={card(t.color)}>
                <div style={crest(t.color)}><Glyph entry={t} /></div>
                <div style={nameStyle}>{t.title}</div>
                <div style={metaStyle}>Level {t.level}+</div>
                <div style={swatch(t.color)}><span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />{t.color}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 3 — STREAK */}
        <Section
          title="Streak Tiers & Shield"
          source="progression.js · STREAK_TIERS / STREAK_SHIELD"
          note="Reached by consecutive active days. The flame steps up at each milestone; day 7 grants a Streak Shield that saves your streak if you miss a day."
        >
          {/* live flame demo */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: '#0a0d18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>LIVE FLAME</span>
            {[0, 3, 7, 14, 30].map((d) => (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <StreakFlame count={d} size={26} showCount={false} shields={d >= 7 ? 1 : 0} />
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>{d}d</span>
              </div>
            ))}
          </div>
          <div style={GRID}>
            {STREAK_TIERS.map((s) => (
              <div key={s.days} style={card(s.color)}>
                <div style={crest(s.color)}><Glyph entry={s} /></div>
                <div style={nameStyle}>{s.name}</div>
                <div style={metaStyle}>{s.days}-day streak</div>
                <div style={subStyle}>{s.sub}</div>
                {s.grantsShield && <span style={chip('#22D3EE')}>🛡️ Grants Shield</span>}
                <div style={swatch(s.color)}><span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />{s.color}</div>
              </div>
            ))}
            {/* Shield card */}
            <div style={card(STREAK_SHIELD.color)}>
              <div style={crest(STREAK_SHIELD.color)}><Glyph entry={STREAK_SHIELD} /></div>
              <div style={nameStyle}>{STREAK_SHIELD.name}</div>
              <div style={metaStyle}>Collectible item</div>
              <div style={subStyle}>{STREAK_SHIELD.desc}</div>
              <div style={swatch(STREAK_SHIELD.color)}><span style={{ width: 10, height: 10, borderRadius: 3, background: STREAK_SHIELD.color }} />{STREAK_SHIELD.color}</div>
            </div>
          </div>
        </Section>

        {/* 4 — ACHIEVEMENT BADGES */}
        <Section
          title="Achievement Badges"
          source="progression.js · ACHIEVEMENT_BADGES"
          note="Earned for subject mastery and career milestones. These back the certificates too."
        >
          <div style={GRID}>
            {[...Object.values(ACHIEVEMENT_BADGES), ACHIEVEMENT_FALLBACK].map((b) => (
              <div key={b.label} style={card(b.color)}>
                <div style={crest(b.color)}><Glyph entry={b} /></div>
                <div style={nameStyle}>{b.label}</div>
                <div style={metaStyle}>{b.kind}</div>
                <div style={swatch(b.color)}><span style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} />{b.color}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 5 — SUBJECT TITLES */}
        <Section
          title="Subject Hunter Titles"
          source="utils/subjectBadgeTitle.js"
          note="A creative hunter title generated for each mastered subject (keyword-matched). Text only today — no icon. Samples shown:"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SAMPLE_SUBJECTS.map((name) => (
              <div key={name} style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.55rem 0.85rem' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#B48AE8' }}>{subjectBadgeTitle(name)}</div>
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)' }}>{name}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 6 — OBJECTIVE ICONS */}
        <Section
          title="Rank Objective Icons"
          source="utils/rankReqs.js"
          note="Cosmetic icons used in the rank-up checklist / Ascension Progress card for each requirement type."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {OBJECTIVE_ICONS.map((o) => (
              <div key={o.icon} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0a0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.5rem 0.85rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{o.icon}</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{o.label}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

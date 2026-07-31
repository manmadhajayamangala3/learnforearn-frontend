// Fixed, pointer-events-none overlay that renders the floating +N / -N XP
// elements produced by useXpAnimation. The motion itself is driven by the
// `xpGain` / `xpDrop` keyframes in global.css (see A5). Purely decorative, so
// it is aria-hidden.
export default function XpFloatLayer({ floats }) {
  if (!floats || floats.length === 0) return null
  return (
    <div className="xp-float-layer" aria-hidden="true">
      {floats.map((f) => (
        <span
          key={f.id}
          className={`xp-float xp-float--${f.dir}`}
          style={{ left: `${f.x}px`, top: `${f.y}px` }}
        >
          {f.amount > 0 ? `+${f.amount}` : `\u2212${Math.abs(f.amount)}`} XP
        </span>
      ))}
    </div>
  )
}

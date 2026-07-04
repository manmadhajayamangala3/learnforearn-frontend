/**
 * Simple static not-found state — used inside panels or full pages
 * when a resource ID in the URL does not exist.
 */
export default function InlineNotFound({
  icon = '🔍',
  message = 'Not found',
  backLabel = 'Go back',
  onBack,
  accent = 'var(--accent-primary, #9B6ED4)',
  panel = false,
}) {
  return (
    <div
      className={`inline-not-found${panel ? ' inline-not-found--panel' : ''}`}
      style={{ '--nf-accent': accent }}
    >
      <div className="inline-not-found__icon" aria-hidden="true">{icon}</div>
      <p className="inline-not-found__message">{message}</p>
      {onBack && (
        <button type="button" onClick={onBack} className="inline-not-found__btn">
          {backLabel}
        </button>
      )}
    </div>
  )
}

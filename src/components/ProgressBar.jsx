import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

export default function ProgressBar({ value = 0, size = 'default', color, animateOnMount = true }) {
  const reduce = useReducedMotion()
  const target = Math.min(100, Math.max(0, value))
  // Start at 0 on first mount so the CSS `width` transition plays as an entrance.
  // Under reduced motion (or when disabled) render the final width immediately.
  const [pct, setPct] = useState(animateOnMount && !reduce ? 0 : target)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      if (animateOnMount && !reduce) {
        const raf = requestAnimationFrame(() => setPct(target))
        return () => cancelAnimationFrame(raf)
      }
    }
    setPct(target)
    return undefined
  }, [target, animateOnMount, reduce])

  const cls = size === 'sm' ? 'progress-bar progress-bar-sm'
            : size === 'lg' ? 'progress-bar progress-bar-lg'
            : 'progress-bar'

  return (
    <div className={cls}>
      <div
        className={`progress-fill${color ? ' progress-fill--custom' : ''}`}
        style={{
          '--progress-pct': `${pct}%`,
          ...(color ? { '--progress-color': color } : {}),
        }}
      />
    </div>
  )
}

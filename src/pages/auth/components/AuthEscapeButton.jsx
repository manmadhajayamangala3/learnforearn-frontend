import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const FLEE_RADIUS = 110
const MAX_OFFSET = 72

export default function AuthEscapeButton({
  ready,
  loading,
  children,
  className = 'auth-btn-primary',
  type = 'submit',
  onClick,
  hint = 'Fill in the fields first…',
}) {
  const wrapRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tease, setTease] = useState(false)

  useEffect(() => {
    if (ready) {
      offsetRef.current = { x: 0, y: 0 }
      setOffset({ x: 0, y: 0 })
    }
  }, [ready])

  const dodge = useCallback((clientX, clientY) => {
    if (ready || loading) return
    const wrap = wrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const prev = offsetRef.current
    const cx = rect.left + rect.width / 2 + prev.x
    const cy = rect.top + rect.height / 2 + prev.y
    const dx = clientX - cx
    const dy = clientY - cy
    const dist = Math.hypot(dx, dy)

    if (dist < FLEE_RADIUS && dist > 0) {
      const push = (FLEE_RADIUS - dist) * 0.55
      const nx = -dx / dist
      const ny = -dy / dist
      const next = {
        x: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, prev.x + nx * push)),
        y: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, prev.y + ny * push)),
      }
      offsetRef.current = next
      setOffset(next)
      setTease(true)
    }
  }, [ready, loading])

  useEffect(() => {
    if (ready || loading) return
    const onMove = e => dodge(e.clientX, e.clientY)
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [ready, loading, dodge])

  const handleClick = e => {
    if (!ready || loading) {
      e.preventDefault()
      setTease(true)
      const jitter = {
        x: offsetRef.current.x + (Math.random() - 0.5) * 40,
        y: offsetRef.current.y + (Math.random() - 0.5) * 40,
      }
      offsetRef.current = jitter
      setOffset(jitter)
      return
    }
    onClick?.(e)
  }

  return (
    <div ref={wrapRef} className="auth-escape-wrap">
      {!ready && !loading && (
        <motion.span
          className="auth-escape-hint"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: tease ? 1 : 0.65, y: 0 }}
        >
          {hint}
        </motion.span>
      )}
      <motion.button
        type={type}
        className={`${className}${!ready ? ' auth-btn-primary--flee' : ''}${ready ? ' auth-btn-primary--ready' : ''}`}
        disabled={loading}
        onClick={handleClick}
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        whileHover={ready && !loading ? { scale: 1.02 } : undefined}
        whileTap={ready && !loading ? { scale: 0.98 } : undefined}
        aria-disabled={!ready || loading}
      >
        {loading && <span className="loading-spinner" style={{ width: 18, height: 18 }} />}
        {children}
      </motion.button>
    </div>
  )
}

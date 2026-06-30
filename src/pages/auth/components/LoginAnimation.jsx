import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { useAuthForm } from '../context/AuthFormContext'

function Eye({ side, pupilX, pupilY, covered }) {
  return (
    <div className={`login-eye login-eye--${side}`}>
      <motion.div
        className="login-eye-white"
        animate={{ scaleY: covered ? 0.08 : 1 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          className="login-pupil"
          animate={{ x: covered ? 0 : pupilX, y: covered ? 0 : pupilY }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        />
      </motion.div>
    </div>
  )
}

export default function LoginAnimation() {
  const sceneRef = useRef(null)
  const { focusedField, passwordVisible, formReady, formProgress } = useAuthForm()
  const [pupil, setPupil] = useState({ x: 0, y: 0 })

  const coverEyes = focusedField === 'password' && !passwordVisible
  const peeking = focusedField === 'password' && passwordVisible
  const happy = formReady

  useEffect(() => {
    const onMove = e => {
      const el = sceneRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width * 0.5
      const cy = rect.top + rect.height * 0.38
      const dx = (e.clientX - cx) / (rect.width * 0.5)
      const dy = (e.clientY - cy) / (rect.height * 0.5)
      setPupil({
        x: Math.max(-7, Math.min(7, dx * 9)),
        y: Math.max(-5, Math.min(5, dy * 7)),
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const bounce = useSpring(formReady ? 1 : 0, { stiffness: 180, damping: 14 })
  const bodyY = useTransform(bounce, [0, 1], [0, -8])

  return (
    <div className="auth-scene auth-scene--login" ref={sceneRef} aria-hidden="true">
      <div className="login-aurora login-aurora--a" />
      <div className="login-aurora login-aurora--b" />

      {[...Array(8)].map((_, i) => (
        <motion.span
          key={i}
          className="login-spark"
          style={{ left: `${12 + i * 11}%`, top: `${18 + (i % 3) * 22}%` }}
          animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -12, 0], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <motion.div
        className="login-creature-wrap"
        style={{ y: bodyY }}
        animate={{
          rotate: happy ? [0, -2, 2, 0] : peeking ? [0, 1, -1, 0] : 0,
        }}
        transition={{ duration: happy ? 0.6 : 2.5, repeat: happy ? Infinity : Infinity, ease: 'easeInOut' }}
      >
        {/* Hands */}
        <motion.div
          className="login-hand login-hand--left"
          animate={{
            y: coverEyes ? -52 : happy ? -6 : 0,
            x: coverEyes ? 18 : 0,
            rotate: coverEyes ? -8 : happy ? -12 : 0,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        />
        <motion.div
          className="login-hand login-hand--right"
          animate={{
            y: coverEyes ? -52 : happy ? -6 : 0,
            x: coverEyes ? -18 : 0,
            rotate: coverEyes ? 8 : happy ? 12 : 0,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        />

        <div className="login-body">
          <motion.div
            className="login-blush login-blush--left"
            animate={{ opacity: focusedField === 'email' || happy ? 0.75 : 0 }}
          />
          <motion.div
            className="login-blush login-blush--right"
            animate={{ opacity: focusedField === 'email' || happy ? 0.75 : 0 }}
          />

          <div className="login-face">
            <Eye side="left" pupilX={pupil.x} pupilY={pupil.y} covered={coverEyes} />
            <Eye side="right" pupilX={pupil.x} pupilY={pupil.y} covered={coverEyes} />
          </div>

          <motion.div
            className="login-mouth"
            animate={{
              height: happy ? 14 : peeking ? 8 : coverEyes ? 4 : 10,
              borderRadius: happy ? '0 0 20px 20px' : '0 0 16px 16px',
              width: happy ? 28 : 22,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </div>

        <motion.div
          className="login-shadow"
          animate={{ scaleX: happy ? 0.92 : 1, opacity: happy ? 0.55 : 0.35 }}
        />
      </motion.div>

      <motion.div
        className="login-progress-ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 120 120" className="login-progress-svg">
          <circle cx="60" cy="60" r="52" className="login-progress-track" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            className="login-progress-fill"
            strokeDasharray={`${2 * Math.PI * 52}`}
            animate={{ strokeDashoffset: `${2 * Math.PI * 52 * (1 - formProgress)}` }}
            transition={{ duration: 0.35 }}
          />
        </svg>
      </motion.div>
    </div>
  )
}

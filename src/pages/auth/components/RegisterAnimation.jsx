import { motion } from 'framer-motion'
import { useAuthForm } from '../context/AuthFormContext'

const ORBS = [
  { id: 0, angle: 0, color: '#9B6ED4', size: 42 },
  { id: 1, angle: 60, color: '#60A5FA', size: 36 },
  { id: 2, angle: 120, color: '#4ADE80', size: 38 },
  { id: 3, angle: 180, color: '#F59E0B', size: 34 },
  { id: 4, angle: 240, color: '#F472B6', size: 40 },
  { id: 5, angle: 300, color: '#22D3EE', size: 32 },
]

export default function RegisterAnimation() {
  const { formProgress, formReady, focusedField } = useAuthForm()
  const activeOrbs = Math.round(formProgress * ORBS.length)

  return (
    <div className="auth-scene auth-scene--register" aria-hidden="true">
      <div className="reg-nebula reg-nebula--1" />
      <div className="reg-nebula reg-nebula--2" />
      <div className="reg-grid" />

      <motion.div
        className="reg-core"
        animate={{
          scale: formReady ? [1, 1.08, 1] : 1,
          boxShadow: formReady
            ? '0 0 60px rgba(155,110,212,0.55), 0 0 120px rgba(96,165,250,0.25)'
            : '0 0 40px rgba(155,110,212,0.25)',
        }}
        transition={{ duration: formReady ? 1.8 : 0.4, repeat: formReady ? Infinity : 0 }}
      >
        <motion.div
          className="reg-core-inner"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="reg-core-pulse"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </motion.div>

      {ORBS.map((orb, i) => {
        const lit = i < activeOrbs
        const rad = (orb.angle * Math.PI) / 180
        const radius = 118 + (i % 2) * 12
        const x = Math.cos(rad) * radius
        const y = Math.sin(rad) * radius

        return (
          <motion.div
            key={orb.id}
            className={`reg-orb${lit ? ' reg-orb--lit' : ''}`}
            style={{
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle at 30% 30%, ${orb.color}, ${orb.color}88)`,
              boxShadow: lit ? `0 0 24px ${orb.color}88` : 'none',
            }}
            animate={{
              x,
              y,
              scale: lit ? [1, 1.12, 1] : 0.75,
              opacity: lit ? 1 : 0.35,
            }}
            transition={{
              x: { type: 'spring', stiffness: 80, damping: 16 },
              y: { type: 'spring', stiffness: 80, damping: 16 },
              scale: { duration: 2, repeat: lit ? Infinity : 0, delay: i * 0.15 },
            }}
          />
        )
      })}

      {/* Connecting threads */}
      <svg className="reg-threads" viewBox="-160 -160 320 320">
        {ORBS.slice(0, activeOrbs).map((orb, i, arr) => {
          if (i === 0) return null
          const prev = arr[i - 1]
          const r1 = (prev.angle * Math.PI) / 180
          const r2 = (orb.angle * Math.PI) / 180
          const rad1 = 118 + ((i - 1) % 2) * 12
          const rad2 = 118 + (i % 2) * 12
          return (
            <motion.line
              key={`line-${i}`}
              x1={Math.cos(r1) * rad1}
              y1={Math.sin(r1) * rad1}
              x2={Math.cos(r2) * rad2}
              y2={Math.sin(r2) * rad2}
              className="reg-thread"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            />
          )
        })}
        {activeOrbs > 0 && (
          <motion.line
            x1={0}
            y1={0}
            x2={Math.cos((ORBS[activeOrbs - 1].angle * Math.PI) / 180) * (118 + ((activeOrbs - 1) % 2) * 12)}
            y2={Math.sin((ORBS[activeOrbs - 1].angle * Math.PI) / 180) * (118 + ((activeOrbs - 1) % 2) * 12)}
            className="reg-thread reg-thread--core"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
      </svg>

      {/* Floating shards */}
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`shard-${i}`}
          className="reg-shard"
          style={{
            left: `${8 + (i * 7.5) % 84}%`,
            top: `${10 + (i * 13) % 80}%`,
          }}
          animate={{
            y: [0, -18 - (i % 3) * 6, 0],
            rotate: [0, 180, 360],
            opacity: [0.15, 0.55, 0.15],
          }}
          transition={{ duration: 4 + i * 0.4, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}

      <motion.div
        className="reg-field-glow"
        animate={{
          opacity: focusedField ? 0.9 : 0.45,
          scale: focusedField ? 1.05 : 1,
        }}
      />
    </div>
  )
}

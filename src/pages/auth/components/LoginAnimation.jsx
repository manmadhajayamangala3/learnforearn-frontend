import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import { useAuthForm } from '../context/AuthFormContext'
import useCompanionMurmur from '../hooks/useCompanionMurmur'
import { getSpeechForBot } from '../hooks/companionMurmurs'
import { MangaSpeechBubble } from './MangaSpeechBubble'

function BotEye({ size = 'md', pupilX, pupilY, covered, wink, sleepy, led }) {
  const scale = size === 'sm' ? 0.72 : size === 'lg' ? 1.15 : 1
  const shut = covered || wink

  return (
    <div className="login-bot-eye" style={{ transform: `scale(${scale})` }}>
      <motion.div
        className="login-bot-eye-lens"
        animate={{ scaleY: shut ? 0.1 : sleepy ? 0.4 : 1 }}
        transition={{ duration: 0.22 }}
      >
        {!shut && (
          <motion.div
            className={`login-bot-pupil login-bot-pupil--${led}`}
            animate={{ x: pupilX, y: sleepy ? 1 : pupilY }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          />
        )}
      </motion.div>
    </div>
  )
}

function SideBot({
  variant,
  active,
  mood,
  pupilX,
  pupilY,
  sleepy,
  coverEyes,
  speech,
  bubbleKey,
  bubbleDelay,
}) {
  const isLeft = variant === 'byte'
  const happy = mood === 'happy' || mood === 'celebrate'
  const concerned = mood === 'concerned'
  const tail = isLeft ? 'left' : 'right'

  return (
    <motion.div
      className={`login-bot login-bot--${variant}${active ? ' login-bot--speaking' : ''}`}
      animate={{
        y: active ? [0, -5, 0] : happy ? [0, -4, 0] : sleepy ? [0, 2, 0] : [0, -2, 0],
        rotate: concerned ? [0, -2, 2, 0] : 0,
      }}
      transition={{ duration: active ? 0.45 : happy ? 0.55 : sleepy ? 4 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <AnimatePresence mode="wait">
        {speech && (
          <MangaSpeechBubble key={bubbleKey} text={speech} delay={bubbleDelay} tail={tail} />
        )}
      </AnimatePresence>

      {variant === 'glitch' && (
        <motion.div
          className="login-bot-antenna"
          animate={{ rotate: active ? [0, 4, -4, 0] : 0 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="login-bot-antenna-tip" />
        </motion.div>
      )}

      <motion.div
        className="login-bot-hand login-bot-hand--cover-left"
        animate={{
          y: coverEyes ? -38 : 20,
          x: coverEyes ? 10 : 0,
          opacity: coverEyes ? 1 : 0,
          rotate: coverEyes ? -12 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      />
      <motion.div
        className="login-bot-hand login-bot-hand--cover-right"
        animate={{
          y: coverEyes ? -38 : 20,
          x: coverEyes ? -10 : 0,
          opacity: coverEyes ? 1 : 0,
          rotate: coverEyes ? 12 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      />

      <div className={`login-bot-shell login-bot-shell--${variant}`}>
        <div className="login-bot-panel" />
        <div className="login-bot-face-row">
          {variant === 'byte' ? (
            <BotEye size="sm" pupilX={pupilX * 0.7} pupilY={pupilY * 0.7} covered={coverEyes} sleepy={sleepy} led="cyan" />
          ) : (
            <>
              <BotEye size="sm" pupilX={pupilX * 0.6} pupilY={pupilY * 0.6} covered={coverEyes} sleepy={sleepy} led="amber" />
              <BotEye size="sm" pupilX={pupilX * 0.6} pupilY={pupilY * 0.6} covered={coverEyes} sleepy={sleepy} led="amber" />
            </>
          )}
        </div>
        <motion.div
          className={`login-bot-mouth login-bot-mouth--${variant}`}
          animate={{
            width: active || happy ? (isLeft ? 16 : 14) : concerned ? 10 : 12,
            height: active || happy ? 4 : concerned ? 2 : 3,
          }}
        />
        <div className="login-bot-feet">
          <span /><span />
        </div>
      </div>
      <div className="login-bot-shadow login-bot-shadow--side" />
    </motion.div>
  )
}

function PrimeBot({ active, mood, pupilX, pupilY, winkPeek, sleepy, speech, bubbleKey, bubbleDelay }) {
  const happy = mood === 'happy' || mood === 'celebrate'
  const concerned = mood === 'concerned'

  const bounce = useSpring(active || happy ? 1 : 0, { stiffness: 180, damping: 14 })
  const bodyY = useTransform(bounce, [0, 1], [0, -6])

  return (
    <motion.div
      className={`login-bot login-bot--prime${active ? ' login-bot--speaking' : ''}`}
      style={{ y: bodyY }}
      animate={{
        rotate: active || happy ? [0, -1.5, 1.5, 0] : concerned ? [0, -1, 1, 0] : 0,
      }}
      transition={{ duration: active || happy ? 0.5 : 0.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <AnimatePresence mode="wait">
        {speech && (
          <MangaSpeechBubble key={bubbleKey} text={speech} delay={bubbleDelay} tail="center" />
        )}
      </AnimatePresence>

      <div className="login-bot-shell login-bot-shell--prime">
        <div className="login-bot-visor-rim" />
        <div className="login-bot-visor">
          <BotEye size="lg" pupilX={pupilX} pupilY={pupilY} sleepy={sleepy} led="violet" />
          <BotEye size="lg" pupilX={pupilX * 0.4} pupilY={pupilY} wink={winkPeek} sleepy={sleepy} led="violet" />
        </div>
        <div className="login-bot-chest">
          <motion.span
            className="login-bot-core-led"
            animate={{ opacity: active || happy ? [0.5, 1, 0.5] : [0.25, 0.55, 0.25] }}
            transition={{ duration: active || happy ? 0.8 : 2.2, repeat: Infinity }}
          />
        </div>
        <motion.div
          className="login-bot-mouth login-bot-mouth--prime"
          animate={{
            width: winkPeek ? 14 : active || happy ? 24 : concerned ? 14 : 18,
            height: winkPeek ? 3 : active || happy ? 5 : concerned ? 2 : 4,
          }}
        />
      </div>
      <div className="login-bot-shadow login-bot-shadow--prime" />
    </motion.div>
  )
}

export default function LoginAnimation() {
  const sceneRef = useRef(null)
  const { focusedField, passwordVisible, formProgress } = useAuthForm()
  const [pupil, setPupil] = useState({ x: 0, y: 0 })

  const murmur = useCompanionMurmur()
  const activeSpeakers = murmur?.speakers ?? []

  const passwordMode = focusedField === 'password' && !passwordVisible

  const sleepy = murmur?.mood === 'sleepy'
  const mood = murmur?.mood ?? 'calm'

  const byteSpeech = getSpeechForBot(murmur, 'byte')
  const primeSpeech = getSpeechForBot(murmur, 'prime')
  const glitchSpeech = getSpeechForBot(murmur, 'glitch')

  const lineIndex = speaker => murmur?.lines?.findIndex(l => l.speaker === speaker) ?? 0

  useEffect(() => {
    const onMove = e => {
      const el = sceneRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width * 0.5
      const cy = rect.top + rect.height * 0.5
      const dx = (e.clientX - cx) / (rect.width * 0.5)
      const dy = (e.clientY - cy) / (rect.height * 0.5)
      setPupil({
        x: Math.max(-6, Math.min(6, dx * 8)),
        y: Math.max(-4, Math.min(4, dy * 6)),
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="auth-scene auth-scene--login" ref={sceneRef}>
      <div className="login-scene-glow" />
      <div className="login-scene-grid" />

      <div className="login-scene-center">
        <div className="login-squad">
          <SideBot
            variant="byte"
            active={activeSpeakers.includes('byte')}
            mood={mood}
            pupilX={pupil.x}
            pupilY={pupil.y}
            sleepy={sleepy}
            coverEyes={passwordMode}
            speech={byteSpeech}
            bubbleKey={murmur ? `${murmur.key}-byte` : 'byte'}
            bubbleDelay={lineIndex('byte') * 0.35}
          />
          <PrimeBot
            active={activeSpeakers.includes('prime')}
            mood={mood}
            pupilX={pupil.x}
            pupilY={pupil.y}
            winkPeek={passwordMode}
            sleepy={sleepy}
            speech={primeSpeech}
            bubbleKey={murmur ? `${murmur.key}-prime` : 'prime'}
            bubbleDelay={lineIndex('prime') * 0.35}
          />
          <SideBot
            variant="glitch"
            active={activeSpeakers.includes('glitch')}
            mood={mood}
            pupilX={pupil.x}
            pupilY={pupil.y}
            sleepy={sleepy}
            coverEyes={passwordMode}
            speech={glitchSpeech}
            bubbleKey={murmur ? `${murmur.key}-glitch` : 'glitch'}
            bubbleDelay={lineIndex('glitch') * 0.35}
          />
        </div>

        <div className="login-squad-desk" />

        <svg className="login-progress-arc" viewBox="0 0 200 40" aria-hidden="true">
          <path d="M 10 30 Q 100 4 190 30" className="login-progress-arc-track" fill="none" />
          <motion.path
            d="M 10 30 Q 100 4 190 30"
            className="login-progress-arc-fill"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            animate={{ strokeDashoffset: 1 - formProgress }}
            transition={{ duration: 0.35 }}
          />
        </svg>
      </div>
    </div>
  )
}

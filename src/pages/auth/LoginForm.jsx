import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { loginUser, guestLogin } from '../../api/api'
import toast from 'react-hot-toast'
import LoadingOverlay from '../../components/LoadingOverlay'
import useCyclingText from './hooks/useCyclingText'
import AuthEscapeButton from './components/AuthEscapeButton'
import { useAuthForm } from './context/AuthFormContext'
import { COMPANION_EVENTS } from './hooks/companionMurmurs'
import useLoginCompanionEvents from './hooks/useLoginCompanionEvents'

const BTN_MESSAGES = {
  login: ['Verifying credentials...', 'Loading profile...', 'Syncing records...', 'Almost there...'],
  guest: ['Issuing guest license...', 'Generating Hunter ID...', 'Preparing access...', 'Almost there...'],
}

export default function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [overlayType, setOverlayType] = useState(null)
  const [overlayDone, setOverlayDone] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const registerQs = redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''

  const prevFieldRef = useRef(null)
  const emailFocusedOnceRef = useRef(false)

  const {
    focusedField,
    setFocusedField,
    setPasswordVisible,
    setFormReady,
    setFormProgress,
    emitCompanionEvent,
    dismissCompanion,
    touchActivity,
    resetCompanion,
    lastActivity,
  } = useAuthForm()

  const loginBtnText = useCyclingText(BTN_MESSAGES.login, loading)
  const guestBtnText = useCyclingText(BTN_MESSAGES.guest, guestLoading)

  const emailOk = form.email.trim().length > 0 && form.email.includes('@')
  const passOk = form.password.length > 0
  const ready = emailOk && passOk

  useLoginCompanionEvents(form, focusedField, emitCompanionEvent, lastActivity, emailFocusedOnceRef)

  useEffect(() => {
    resetCompanion()
    setFormReady(false)
    setFormProgress(0)
    setFocusedField(null)
    prevFieldRef.current = null
    emailFocusedOnceRef.current = false
    return () => {
      resetCompanion()
      setFormReady(false)
      setFormProgress(0)
      setFocusedField(null)
    }
  }, [resetCompanion, setFormReady, setFormProgress, setFocusedField])

  useEffect(() => {
    setFormReady(ready)
    setFormProgress((Number(emailOk) + Number(passOk)) / 2)
  }, [ready, emailOk, passOk, setFormReady, setFormProgress])

  useEffect(() => {
    setPasswordVisible(showPass)
  }, [showPass, setPasswordVisible])

  const handleEmailFocus = () => {
    dismissCompanion()
    setFocusedField('email')
    touchActivity()

    if (prevFieldRef.current === 'password') {
      emitCompanionEvent(COMPANION_EVENTS.FOCUS_EMAIL_RETURN)
    } else if (!emailFocusedOnceRef.current) {
      emailFocusedOnceRef.current = true
      emitCompanionEvent(COMPANION_EVENTS.FOCUS_EMAIL)
    }

    prevFieldRef.current = 'email'
  }

  const handlePasswordFocus = () => {
    dismissCompanion()
    setFocusedField('password')
    touchActivity()
    emitCompanionEvent(COMPANION_EVENTS.FOCUS_PASSWORD)
    prevFieldRef.current = 'password'
  }

  const handleGuest = async () => {
    dismissCompanion()
    emitCompanionEvent(COMPANION_EVENTS.GUEST_CLICK)
    setGuestLoading(true)
    setOverlayType('guest')
    setOverlayDone(false)
    try {
      const storedGuestId = localStorage.getItem('guest_device_id')
      const { data } = await guestLogin(storedGuestId)
      localStorage.setItem('guest_device_id', data.user.id)
      setOverlayDone(true)
      await new Promise(r => setTimeout(r, 600))
      login(data.token, data.user)
      navigate(redirectTo)
    } catch {
      setOverlayType(null)
      toast.error('Could not start guest session. Try again.')
    } finally {
      setGuestLoading(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    touchActivity()
    if (!ready) {
      dismissCompanion()
      emitCompanionEvent(COMPANION_EVENTS.SUBMIT_EMPTY)
      return
    }
    setLoading(true)
    setOverlayType('login')
    setOverlayDone(false)
    try {
      const { data } = await loginUser(form)
      dismissCompanion()
      emitCompanionEvent(COMPANION_EVENTS.LOGIN_SUCCESS)
      setOverlayDone(true)
      await new Promise(r => setTimeout(r, 900))
      login(data.token, data.user)
      if (data.user.role === 'ADMIN') navigate('/admin-skill-arena')
      else navigate(redirectTo)
    } catch {
      setOverlayType(null)
      dismissCompanion()
      emitCompanionEvent(COMPANION_EVENTS.LOGIN_FAILURE)
    } finally {
      setLoading(false)
    }
  }

  const togglePassword = () => {
    setShowPass(prev => {
      const next = !prev
      dismissCompanion()
      emitCompanionEvent(next ? COMPANION_EVENTS.PASSWORD_VISIBLE : COMPANION_EVENTS.PASSWORD_HIDDEN)
      return next
    })
    touchActivity()
  }

  return (
    <>
      {overlayType && <LoadingOverlay type={overlayType} completing={overlayDone} />}

      <div className="login-form-hero">
        <motion.div
          className="login-form-hero-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Sparkles size={14} />
          <span>Secure sign in</span>
        </motion.div>
        <motion.h1 className="auth-form-title login-form-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          Welcome back
        </motion.h1>
        <motion.p className="auth-form-sub login-form-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          Pick up where you left off — your progress is waiting.
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form login-form">
        <div className={`auth-field login-field${focusedField === 'email' ? ' login-field--active' : ''}`}>
          <label className="auth-label login-label" htmlFor="login-email">
            <Mail size={14} /> Email
          </label>
          <input
            id="login-email"
            type="email"
            className="auth-input login-input"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={e => {
              setForm({ ...form, email: e.target.value })
              touchActivity()
            }}
            onFocus={handleEmailFocus}
            onBlur={() => setFocusedField(f => (f === 'email' ? null : f))}
          />
        </div>

        <div className={`auth-field login-field${focusedField === 'password' ? ' login-field--active' : ''}`}>
          <label className="auth-label login-label" htmlFor="login-password">
            <Lock size={14} /> Password
          </label>
          <div className="auth-pass-wrap">
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              className="auth-input login-input"
              placeholder="Your password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => {
                setForm({ ...form, password: e.target.value })
                touchActivity()
              }}
              onFocus={handlePasswordFocus}
              onBlur={() => setFocusedField(f => (f === 'password' ? null : f))}
            />
            <button
              type="button"
              className="auth-pass-toggle"
              aria-label={showPass ? 'Hide password' : 'Show password'}
              onClick={togglePassword}
            >
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <AuthEscapeButton ready={ready} loading={loading} staticDisabled>
          {loading ? loginBtnText : 'Sign in'}
        </AuthEscapeButton>
      </form>

      <p className="auth-form-footer">
        New here?{' '}
        <Link to={`/register${registerQs}`} className="auth-link" replace>Create account</Link>
      </p>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or</span>
        <div className="auth-divider-line" />
      </div>

      <button type="button" className="auth-btn-ghost login-btn-guest" onClick={handleGuest} disabled={guestLoading}>
        {guestLoading && <span className="loading-spinner" style={{ width: 16, height: 16 }} />}
        {guestLoading ? guestBtnText : 'Continue as Guest'}
      </button>
    </>
  )
}

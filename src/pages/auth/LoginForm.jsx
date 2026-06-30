import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { loginUser, guestLogin } from '../../api/api'
import toast from 'react-hot-toast'
import LoadingOverlay from '../../components/LoadingOverlay'
import useCyclingText from './hooks/useCyclingText'
import AuthEscapeButton from './components/AuthEscapeButton'
import { useAuthForm } from './context/AuthFormContext'
import useLoginBotStory from './hooks/useLoginBotStory'

const BTN_MESSAGES = {
  login: ['Verifying credentials...', 'Loading profile...', 'Syncing records...', 'Almost there...'],
  guest: ['Issuing guest license...', 'Generating Hunter ID...', 'Preparing access...', 'Almost there...'],
}

export default function LoginForm() {
  const [form, setForm]           = useState({ email: '', password: '' })
  const [loading, setLoading]     = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [overlayType, setOverlayType]   = useState(null)
  const [overlayDone, setOverlayDone]   = useState(false)
  const [showPass, setShowPass]   = useState(false)

  const { login }          = useAuth()
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const redirectTo         = searchParams.get('redirect') || '/'
  const registerQs         = redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''

  const prevFieldRef        = useRef(null)
  const emailFocusedOnceRef = useRef(false)

  const {
    focusedField, setFocusedField,
    setPasswordVisible,
    setFormReady, setFormProgress,
    emitCompanionEvent, dismissCompanion,
    touchActivity, resetCompanion,
    lastActivity,
  } = useAuthForm()

  const emitBeat = emitCompanionEvent

  const { cancelRankTimer } = useLoginBotStory(
    form,
    emitBeat,
    lastActivity,
    emailFocusedOnceRef,
  )

  const loginBtnText = useCyclingText(BTN_MESSAGES.login, loading)
  const guestBtnText = useCyclingText(BTN_MESSAGES.guest, guestLoading)

  const emailOk = form.email.trim().length > 0 && form.email.includes('@')
  const passOk  = form.password.length > 0
  const ready   = emailOk && passOk

  /* reset form state on mount only; cleanup on unmount */
  useEffect(() => {
    setFormReady(false)
    setFormProgress(0)
    setFocusedField(null)
    prevFieldRef.current        = null
    emailFocusedOnceRef.current = false
    return () => {
      resetCompanion()
      setFormReady(false)
      setFormProgress(0)
      setFocusedField(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setFormReady(ready)
    setFormProgress((Number(emailOk) + Number(passOk)) / 2)
  }, [ready, emailOk, passOk, setFormReady, setFormProgress])

  useEffect(() => { setPasswordVisible(showPass) }, [showPass, setPasswordVisible])

  /* ── focus handlers ───────────────────────────────────────────── */
  const handleEmailFocus = () => {
    dismissCompanion()
    cancelRankTimer()
    setFocusedField('email')
    touchActivity()

    if (prevFieldRef.current === 'password') {
      emitBeat('EMAIL_RETURN')
    } else if (!emailFocusedOnceRef.current) {
      emailFocusedOnceRef.current = true
      emitBeat('FOUND_EMAIL')
    }
    prevFieldRef.current = 'email'
  }

  const handlePasswordFocus = () => {
    dismissCompanion()
    setFocusedField('password')
    touchActivity()
    emitBeat('FOCUS_PASSWORD')
    prevFieldRef.current = 'password'
  }

  /* ── guest ────────────────────────────────────────────────────── */
  const handleGuest = async () => {
    dismissCompanion()
    emitBeat('GUEST_CLICK')
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

  /* ── submit ───────────────────────────────────────────────────── */
  const handleSubmit = async e => {
    e.preventDefault()
    touchActivity()

    if (!ready) {
      dismissCompanion()
      emitBeat('SUBMIT_EMPTY')
      return
    }

    setLoading(true)
    setOverlayType('login')
    setOverlayDone(false)
    dismissCompanion()
    emitBeat('LOGIN_PROCESSING')

    try {
      const { data } = await loginUser(form)
      dismissCompanion()
      emitBeat('LOGIN_SUCCESS')
      setOverlayDone(true)
      await new Promise(r => setTimeout(r, 900))
      login(data.token, data.user)
      if (data.user.role === 'ADMIN') navigate('/admin-skill-arena')
      else navigate(redirectTo)
    } catch {
      setOverlayType(null)
      dismissCompanion()
      emitBeat('LOGIN_FAILED')
    } finally {
      setLoading(false)
    }
  }

  /* ── password visibility toggle ───────────────────────────────── */
  const togglePassword = () => {
    setShowPass(prev => {
      const next = !prev
      dismissCompanion()
      emitBeat(next ? 'PASSWORD_VISIBLE' : 'PASSWORD_HIDDEN')
      return next
    })
    touchActivity()
  }

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <>
      {overlayType && <LoadingOverlay type={overlayType} completing={overlayDone} />}

      <motion.h1
        className="auth-form-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Welcome back
      </motion.h1>
      <motion.p
        className="auth-form-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        Sign in to continue your journey
      </motion.p>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email */}
        <div className={`auth-field${focusedField === 'email' ? ' auth-field--focus' : ''}`}>
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={e => { setForm({ ...form, email: e.target.value }); touchActivity() }}
            onFocus={handleEmailFocus}
            onBlur={() => setFocusedField(f => (f === 'email' ? null : f))}
          />
        </div>

        {/* Password */}
        <div className={`auth-field${focusedField === 'password' ? ' auth-field--focus' : ''}`}>
          <label className="auth-label" htmlFor="login-password">Password</label>
          <div className="auth-pass-wrap">
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              className="auth-input"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); touchActivity() }}
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

        <AuthEscapeButton ready={ready} loading={loading} staticDisabled compact>
          {loading ? loginBtnText : 'Sign in'}
        </AuthEscapeButton>
      </form>

      <div className="auth-login-bottom">
        <span className="auth-login-bottom-label">New here?</span>
        <div className="auth-login-bottom-actions">
          <Link
            to={`/register${registerQs}`}
            className="auth-link-btn"
            replace
          >
            Sign up
          </Link>
          <span className="auth-login-bottom-sep">|</span>
          <button
            type="button"
            className="auth-ghost-inline"
            onClick={handleGuest}
            disabled={guestLoading}
          >
            {guestLoading && <span className="loading-spinner" style={{ width: 14, height: 14 }} />}
            {guestLoading ? guestBtnText : 'Guest login'}
          </button>
        </div>
      </div>
    </>
  )
}

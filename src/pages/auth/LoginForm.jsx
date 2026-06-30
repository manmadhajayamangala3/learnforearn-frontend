import { useEffect, useState } from 'react'
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
  const { setFocusedField, setPasswordVisible, setFormReady, setFormProgress } = useAuthForm()

  const loginBtnText = useCyclingText(BTN_MESSAGES.login, loading)
  const guestBtnText = useCyclingText(BTN_MESSAGES.guest, guestLoading)

  const emailOk = form.email.trim().length > 0 && form.email.includes('@')
  const passOk = form.password.length > 0
  const ready = emailOk && passOk

  useEffect(() => {
    setFormReady(false)
    setFormProgress(0)
    setFocusedField(null)
    return () => {
      setFormReady(false)
      setFormProgress(0)
      setFocusedField(null)
    }
  }, [setFormReady, setFormProgress, setFocusedField])

  useEffect(() => {
    setFormReady(ready)
    setFormProgress((Number(emailOk) + Number(passOk)) / 2)
  }, [ready, emailOk, passOk, setFormReady, setFormProgress])

  useEffect(() => {
    setPasswordVisible(showPass)
  }, [showPass, setPasswordVisible])

  const handleGuest = async () => {
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
    if (!ready) return
    setLoading(true)
    setOverlayType('login')
    setOverlayDone(false)
    try {
      const { data } = await loginUser(form)
      setOverlayDone(true)
      await new Promise(r => setTimeout(r, 600))
      login(data.token, data.user)
      if (data.user.role === 'ADMIN') navigate('/admin-skill-arena')
      else navigate(redirectTo)
    } catch (err) {
      setOverlayType(null)
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {overlayType && <LoadingOverlay type={overlayType} completing={overlayDone} />}

      <motion.h1 className="auth-form-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        Welcome back
      </motion.h1>
      <motion.p className="auth-form-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        Sign in to continue
      </motion.p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">Password</label>
          <div className="auth-pass-wrap">
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              className="auth-input"
              placeholder="Your password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <button
              type="button"
              className="auth-pass-toggle"
              aria-label={showPass ? 'Hide password' : 'Show password'}
              onClick={() => setShowPass(p => !p)}
            >
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <AuthEscapeButton
          ready={ready}
          loading={loading}
          hint="Enter email & password first"
        >
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

      <button type="button" className="auth-btn-ghost" onClick={handleGuest} disabled={guestLoading}>
        {guestLoading && <span className="loading-spinner" style={{ width: 16, height: 16 }} />}
        {guestLoading ? guestBtnText : 'Continue as Guest'}
      </button>
    </>
  )
}

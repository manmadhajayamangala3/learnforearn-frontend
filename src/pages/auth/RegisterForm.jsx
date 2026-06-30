import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { registerUser, sendOtp, verifyOtp } from '../../api/api'
import toast from 'react-hot-toast'
import LoadingOverlay from '../../components/LoadingOverlay'
import useCyclingText from './hooks/useCyclingText'
import AuthEscapeButton from './components/AuthEscapeButton'
import { useAuthForm } from './context/AuthFormContext'

const REG_MESSAGES = ['Registering...', 'Creating Hunter License...', 'Generating your ID...', 'Setting up arena...']

function getStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors = ['', 'weak', 'medium', 'medium', 'strong']

export default function RegisterForm() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', collegeName: '' })
  const [loading, setLoading] = useState(false)
  const [overlayDone, setOverlayDone] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/skill-arena/dashboard'
  const loginQs = searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''
  const strength = getStrength(form.password)
  const btnText = useCyclingText(REG_MESSAGES, loading)
  const { setFocusedField, setPasswordVisible, setFormReady, setFormProgress } = useAuthForm()

  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const cooldownRef = useRef(null)

  const getInitialCooldown = () => {
    const sent = parseInt(sessionStorage.getItem('otp_sent_at') || '0', 10)
    if (!sent) return 0
    const remaining = Math.ceil((sent + 60000 - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  }
  const [resendCooldown, setResendCooldown] = useState(getInitialCooldown)

  const nameOk = form.fullName.trim().length >= 2
  const emailOk = emailVerified
  const passOk = getStrength(form.password) >= 4
  const confirmOk = form.password === form.confirmPassword && form.confirmPassword.length > 0
  const ready = nameOk && emailOk && passOk && confirmOk

  useEffect(() => {
    const steps = [nameOk, emailOk, passOk, confirmOk]
    setFormProgress(steps.filter(Boolean).length / steps.length)
    setFormReady(ready)
  }, [ready, nameOk, emailOk, passOk, confirmOk, setFormReady, setFormProgress])

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
    setPasswordVisible(showPass)
  }, [showPass, setPasswordVisible])

  const startCooldown = (secs = 60) => {
    sessionStorage.setItem('otp_sent_at', String(Date.now()))
    setResendCooldown(secs)
    clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(s => {
        if (s <= 1) { clearInterval(cooldownRef.current); sessionStorage.removeItem('otp_sent_at'); return 0 }
        return s - 1
      })
    }, 1000)
  }

  useEffect(() => {
    const initial = getInitialCooldown()
    if (initial > 0) {
      setResendCooldown(initial)
      cooldownRef.current = setInterval(() => {
        setResendCooldown(s => {
          if (s <= 1) { clearInterval(cooldownRef.current); sessionStorage.removeItem('otp_sent_at'); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(cooldownRef.current)
  }, [])

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('otp_email')
    if (savedEmail && getInitialCooldown() > 0) {
      setOtpSent(true)
      setForm(f => ({ ...f, email: savedEmail }))
    }
  }, [])

  const handleSendOtp = async () => {
    if (!form.email) { toast.error('Enter your email first'); return }
    setEmailError('')
    setSendingOtp(true)
    try {
      await sendOtp(form.email)
      setOtpSent(true)
      setOtp('')
      startCooldown(60)
      sessionStorage.setItem('otp_email', form.email)
      toast.success('OTP sent! Check your inbox.')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error || 'Failed to send OTP'
      const retryAfter = err.response?.data?.retryAfter
      if (status === 409) setEmailError(msg)
      else if (retryAfter) { startCooldown(retryAfter); toast.error(`Wait ${retryAfter}s before resending.`) }
      else toast.error(msg)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return }
    setVerifyingOtp(true)
    try {
      await verifyOtp(form.email, otp)
      setEmailVerified(true)
      setOtpSent(false)
      sessionStorage.removeItem('otp_email')
      sessionStorage.removeItem('otp_sent_at')
      toast.success('Email verified successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!ready) return
    setLoading(true)
    setOverlayDone(false)
    try {
      const { fullName, email, password, collegeName } = form
      const { data } = await registerUser({ fullName, email, password, collegeName })
      setOverlayDone(true)
      await new Promise(r => setTimeout(r, 700))
      login(data.token, data.user)
      navigate(redirectTo)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const resetEmailState = () => {
    setEmailVerified(false)
    setOtpSent(false)
    setEmailError('')
    sessionStorage.removeItem('otp_email')
    sessionStorage.removeItem('otp_sent_at')
  }

  return (
    <>
      {loading && <LoadingOverlay type="register" completing={overlayDone} />}

      <motion.h1 className="auth-form-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        Create account
      </motion.h1>
      <motion.p className="auth-form-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        Join in under a minute
      </motion.p>

      <form onSubmit={handleSubmit} className="auth-form auth-form--register">
        <div className="auth-field auth-field--compact">
          <label className="auth-label" htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            type="text"
            className="auth-input auth-input--compact"
            placeholder="Your full name"
            autoComplete="name"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            onFocus={() => setFocusedField('fullName')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <div className="auth-field auth-field--compact">
          <label className="auth-label" htmlFor="reg-email">Email</label>
          <div className="auth-inline-row">
            <input
              id="reg-email"
              type="email"
              className={`auth-input auth-input--compact${emailVerified ? ' auth-input--success' : emailError ? ' auth-input--error' : ''}`}
              placeholder="you@college.edu"
              autoComplete="email"
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); resetEmailState() }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              disabled={emailVerified}
            />
            {!emailVerified && (
              <button
                type="button"
                className="auth-btn-otp auth-btn-otp--compact"
                onClick={handleSendOtp}
                disabled={sendingOtp || resendCooldown > 0}
              >
                {sendingOtp ? '…' : otpSent && resendCooldown > 0 ? `${resendCooldown}s` : otpSent ? 'Resend' : 'Verify'}
              </button>
            )}
            {emailVerified && (
              <span className="auth-verified-badge"><ShieldCheck size={15} /> OK</span>
            )}
          </div>
          {emailError && (
            <div className="auth-error-text">
              {emailError}{' '}
              <Link to={`/login${loginQs}`} className="auth-link" replace>Sign in?</Link>
            </div>
          )}
          {otpSent && !emailVerified && (
            <div className="auth-otp-row">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="auth-input auth-input--compact auth-input--otp"
                placeholder="000000"
                aria-label="Email verification OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onFocus={() => setFocusedField('otp')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otp.length !== 6}
                className="auth-btn-otp auth-btn-otp--compact auth-btn-otp--confirm"
              >
                {verifyingOtp ? '…' : 'OK'}
              </button>
            </div>
          )}
        </div>

        <div className="auth-field-row">
          <div className="auth-field auth-field--compact">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <div className="auth-pass-wrap">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="auth-input auth-input--compact"
                placeholder="8+ chars"
                autoComplete="new-password"
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
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="auth-strength-mini">
                <div className="password-strength">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`strength-bar ${i <= strength ? strengthColors[strength] : ''}`} />
                  ))}
                </div>
                <span>{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          <div className="auth-field auth-field--compact">
            <label className="auth-label" htmlFor="reg-confirm">Confirm</label>
            <input
              id="reg-confirm"
              type="password"
              className={`auth-input auth-input--compact${form.confirmPassword && form.password !== form.confirmPassword ? ' auth-input--error' : ''}`}
              placeholder="Repeat"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="auth-field auth-field--compact">
          <label className="auth-label" htmlFor="reg-college">
            College <span className="auth-label-opt">(optional)</span>
          </label>
          <input
            id="reg-college"
            type="text"
            className="auth-input auth-input--compact"
            placeholder="Your college"
            autoComplete="organization"
            value={form.collegeName}
            onChange={e => setForm({ ...form, collegeName: e.target.value })}
            onFocus={() => setFocusedField('college')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <AuthEscapeButton
          ready={ready}
          loading={loading}
          hint="Complete all required fields"
        >
          {loading ? btnText : 'Create account'}
        </AuthEscapeButton>
      </form>

      <p className="auth-form-footer">
        Already have an account?{' '}
        <Link to={`/login${loginQs}`} className="auth-link" replace>Sign in</Link>
      </p>
    </>
  )
}

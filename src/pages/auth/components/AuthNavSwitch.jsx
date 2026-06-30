import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthNavSwitch() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isLogin = pathname === '/login'
  const redirect = searchParams.get('redirect')
  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''

  return (
    <nav className="auth-nav-switch" aria-label="Sign in or sign up">
      <motion.div
        className="auth-nav-pill"
        layoutId="auth-tab-pill"
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        style={{ left: isLogin ? 4 : 'calc(50% - 4px)' }}
      />
      <Link to={`/login${qs}`} className={`auth-nav-tab${isLogin ? ' auth-nav-tab--active' : ''}`} replace>
        <LogIn size={14} /> Sign In
      </Link>
      <Link to={`/register${qs}`} className={`auth-nav-tab${!isLogin ? ' auth-nav-tab--active' : ''}`} replace>
        <UserPlus size={14} /> Sign Up
      </Link>
    </nav>
  )
}

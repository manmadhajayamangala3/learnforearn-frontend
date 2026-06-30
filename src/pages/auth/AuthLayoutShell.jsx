import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Moon, Sun, Swords } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import AuthNavSwitch from './components/AuthNavSwitch'
import LoginAnimation from './components/LoginAnimation'
import RegisterAnimation from './components/RegisterAnimation'
import { AuthFormProvider } from './context/AuthFormContext'
import '../../styles/auth-animations.css'

const panelVariants = {
  initial: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28, filter: 'blur(4px)' }),
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -20 : 20, filter: 'blur(4px)', transition: { duration: 0.22 } }),
}

const sceneVariants = {
  initial: (dir) => ({ opacity: 0, scale: 0.94, x: dir > 0 ? -40 : 40 }),
  animate: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ opacity: 0, scale: 0.96, x: dir > 0 ? 30 : -30, transition: { duration: 0.28 } }),
}

export default function AuthLayoutShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const isRegister = pathname === '/register'
  const direction = isRegister ? 1 : -1

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  return (
    <AuthFormProvider>
      <div className={`auth-page${isRegister ? ' auth-page--register' : ' auth-page--login'}`}>
        <div className="auth-bg-gradient" aria-hidden="true" />
        <div className="auth-bg-noise" aria-hidden="true" />

        <div className="auth-top-actions">
          <button type="button" className="auth-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={15} /> Home
          </button>
          <button
            type="button"
            className="auth-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="auth-stage">
          {/* Login: animation left · Register: form left */}
          <div className="auth-stage-col auth-stage-col--leading">
            <AnimatePresence mode="wait" custom={direction}>
              {isRegister ? (
                <motion.div
                  key="form-leading"
                  className="auth-form-col"
                  custom={direction}
                  variants={panelVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <AuthFormCard navigate={navigate} />
                </motion.div>
              ) : (
                <motion.div
                  key="scene-login"
                  className="auth-scene-col"
                  custom={direction}
                  variants={sceneVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <LoginAnimation />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Login: form right · Register: animation right */}
          <div className="auth-stage-col auth-stage-col--trailing">
            <AnimatePresence mode="wait" custom={direction}>
              {isRegister ? (
                <motion.div
                  key="scene-register"
                  className="auth-scene-col"
                  custom={direction}
                  variants={sceneVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <RegisterAnimation />
                </motion.div>
              ) : (
                <motion.div
                  key="form-trailing"
                  className="auth-form-col"
                  custom={direction}
                  variants={panelVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <AuthFormCard navigate={navigate} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AuthFormProvider>
  )
}

function AuthFormCard({ navigate }) {
  const { pathname } = useLocation()
  const direction = pathname === '/register' ? 1 : -1
  const isLogin = pathname === '/login'

  return (
    <div className={`auth-card-wrap${isLogin ? ' auth-card-wrap--login' : ''}`}>
      <motion.div
        className={`auth-card${isLogin ? ' auth-card--login' : ''}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.08 }}
      >
        <div className="auth-card-glow" aria-hidden="true" />
        <div className="auth-card-inner">
          <motion.button
            type="button"
            className="auth-brand-block"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="auth-brand-icon">
              <Swords size={22} color="#fff" />
            </div>
            <div className="auth-brand-title">LearnToEarn</div>
          </motion.button>

          <AuthNavSwitch />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={pathname}
              custom={direction}
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="auth-form-panel"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

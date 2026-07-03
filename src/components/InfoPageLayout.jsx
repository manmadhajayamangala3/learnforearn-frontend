import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import '../styles/pages/shared/info-pages.css'

// Shared shell for About / Terms / Privacy — sticky top bar + centered reading column
export default function InfoPageLayout({ label, title, updated, children }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="info-page">
      <nav className="info-page__nav">
        <button type="button" className="info-page__back" onClick={() => navigate('/')} aria-label="Back to home">
          <ArrowLeft size={14} /> Home
        </button>
        <span className="info-page__label">{label}</span>
        <button
          type="button"
          className="theme-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>

      <main className="info-page__body">
        <h1 className="info-page__title">{title}</h1>
        {updated && <div className="info-page__updated">LAST UPDATED · {updated}</div>}
        {children}
      </main>
    </div>
  )
}

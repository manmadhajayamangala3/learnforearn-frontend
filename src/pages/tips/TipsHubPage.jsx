import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { TIPS } from './tipsContent'
import '../../styles/pages/tips.css'

export default function TipsHubPage() {
  return (
    <main className="tips-hub">
      <header className="tips-hub__head">
        <span className="tips-hub__eyebrow"><BookOpen size={14} /> Placement Guides</span>
        <h1 className="tips-hub__title">Placement Preparation Guides for Freshers</h1>
        <p className="tips-hub__sub">
          Honest, practical guides to help Indian freshers crack placements in 2026 — aptitude,
          coding interviews, projects, and company-specific preparation.
        </p>
      </header>

      <ul className="tips-hub__grid">
        {TIPS.map((t) => (
          <li key={t.slug}>
            <Link to={`/tips/${t.slug}`} className="tips-card">
              <h2 className="tips-card__title">{t.h1}</h2>
              <p className="tips-card__desc">{t.description}</p>
              <span className="tips-card__more">Read guide <ArrowRight size={14} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

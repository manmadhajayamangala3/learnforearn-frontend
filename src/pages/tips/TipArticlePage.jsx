import { useParams, Link } from 'react-router-dom'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { TIPS_BY_SLUG } from './tipsContent'
import '../../styles/pages/tips.css'

// Renders one body entry: a paragraph string, an unordered { list }, or an
// ordered { steps }.
function BodyBlock({ block }) {
  if (typeof block === 'string') return <p className="tip-p">{block}</p>
  if (block.list) return <ul className="tip-ul">{block.list.map((li, i) => <li key={i}>{li}</li>)}</ul>
  if (block.steps) return <ol className="tip-ol">{block.steps.map((li, i) => <li key={i}>{li}</li>)}</ol>
  return null
}

export default function TipArticlePage() {
  const { slug } = useParams()
  const article = TIPS_BY_SLUG[slug]

  if (!article) {
    return (
      <main className="tips-article">
        <p className="tip-p">That guide could not be found.</p>
        <Link to="/tips" className="tip-cta">All guides <ArrowRight size={15} /></Link>
      </main>
    )
  }

  return (
    <main className="tips-article">
      <nav aria-label="breadcrumb" className="tip-crumbs">
        <Link to="/">Home</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link to="/tips">Tips</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page">{article.h1}</span>
      </nav>

      <article className="tip-article">
        <header className="tip-header">
          <h1 className="tip-h1">{article.h1}</h1>
          <p className="tip-lede">{article.intro}</p>
        </header>

        {article.sections.map((sec, i) => (
          <section key={i} className="tip-section">
            <h2 className="tip-h2">{sec.h2}</h2>
            {sec.body?.map((b, j) => <BodyBlock key={j} block={b} />)}
            {sec.links?.length > 0 && (
              <ul className="tip-links">
                {sec.links.map((l, k) => (
                  <li key={k}><Link to={l.to} className="tip-link">{l.text} <ArrowRight size={14} /></Link></li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {article.faqs?.length > 0 && (
          <section className="tip-section" aria-labelledby="tip-faq-heading">
            <h2 className="tip-h2" id="tip-faq-heading">Frequently asked questions</h2>
            {article.faqs.map((f, i) => (
              <div key={i} className="tip-faq">
                <h3 className="tip-h3">{f.q}</h3>
                <p className="tip-p">{f.a}</p>
              </div>
            ))}
          </section>
        )}

        <footer className="tip-footer">
          <Link to="/tips" className="tip-cta">Explore all placement guides <ArrowRight size={15} /></Link>
        </footer>
      </article>
    </main>
  )
}

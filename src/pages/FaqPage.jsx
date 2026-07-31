import { Link } from 'react-router-dom'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { FAQS } from './faqContent'
import '../styles/pages/tips.css'

// Public, crawlable FAQ. Reuses the /tips article layout (tips.css) so it matches
// the design system exactly. FAQPage + HowTo JSON-LD is injected per-route by
// resolveSeo (documentTitle.js) — this component only renders the visible copy.
export default function FaqPage() {
  return (
    <main className="tips-article">
      <nav aria-label="breadcrumb" className="tip-crumbs">
        <Link to="/">Home</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page">FAQ</span>
      </nav>

      <article className="tip-article">
        <header className="tip-header">
          <h1 className="tip-h1">Frequently Asked Questions</h1>
          <p className="tip-lede">
            Everything students ask about LearnForEarn — what it covers, who it is for,
            how to use it, and how it helps every type of student grow in tech.
          </p>
        </header>

        <section className="tip-section" aria-labelledby="faq-heading">
          <h2 className="tip-h2" id="faq-heading">Questions &amp; answers</h2>
          {FAQS.map((f, i) => (
            <div key={i} className="tip-faq">
              <h3 className="tip-h3">{f.q}</h3>
              <p className="tip-p">{f.a}</p>
            </div>
          ))}
        </section>

        <footer className="tip-footer">
          <Link to="/tips" className="tip-cta">Explore all learning guides <ArrowRight size={15} /></Link>
        </footer>
      </article>
    </main>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Bookmark, ArrowRight } from 'lucide-react'
import { getBookmarks } from '../../api/api'
import { EASE } from '../../utils/motion'

// C18 — Bookmarks as a study queue. Turns the passive "saved" list into a one-tap next action:
// shows how many items are saved and opens the most recent one directly. Renders nothing when
// there is nothing saved, so it never adds empty clutter to the dashboard.
const LINK = {
  SUBJECT: (id) => `/skill-arena/dashboard?view=gates&subject=${id}`,
  ROADMAP: (id) => `/skill-arena/roadmaps/${id}`,
  MISSION: (id) => `/missions/${id}`,
  PROBLEM: (id) => `/code-gym/${id}`,
  AITOOL: (id) => `/ai-lab/${id}`,
  GUIDE: (id) => id,
  APTITUDE: (id) => id,
}
const FALLBACK_ICON = { SUBJECT: '📚', ROADMAP: '🗺️', MISSION: '🎯', PROBLEM: '💻', AITOOL: '🤖', GUIDE: '🚀', APTITUDE: '🧠' }
const TYPE_LABEL = { SUBJECT: 'Dungeon Gate', ROADMAP: 'Hunter Path', MISSION: 'Mission', PROBLEM: 'Code Gym', AITOOL: 'AI Tool', GUIDE: 'Deploy Guide', APTITUDE: 'Aptitude' }

export default function BookmarkQueueCard() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [items, setItems] = useState(null)

  useEffect(() => {
    let alive = true
    getBookmarks()
      .then((r) => { if (alive) setItems(Array.isArray(r.data) ? r.data : []) })
      .catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [])

  if (!items || items.length === 0) return null

  const sorted = [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  const first = sorted[0]
  const linkFor = (bm) => (LINK[bm.type] || ((id) => id))(bm.refId)
  const openFirst = () => navigate(linkFor(first))

  return (
    <motion.div
      className="dash-bm-queue"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="dash-bm-queue__head">
        <span className="dash-bm-queue__title">
          <Bookmark size={14} strokeWidth={2.5} /> SAVED FOR LATER
        </span>
        <span className="dash-bm-queue__count">{items.length} item{items.length === 1 ? '' : 's'}</span>
      </div>

      <button type="button" className="dash-bm-queue__item" onClick={openFirst}>
        <span className="dash-bm-queue__item-icon" aria-hidden="true">{first.icon || FALLBACK_ICON[first.type] || '🔖'}</span>
        <span className="dash-bm-queue__item-body">
          <span className="dash-bm-queue__item-title">{first.title || 'Untitled'}</span>
          <span className="dash-bm-queue__item-type">{TYPE_LABEL[first.type] || 'Saved'} · pick up where you left off</span>
        </span>
      </button>

      <div className="dash-bm-queue__actions">
        <button type="button" className="dash-bm-queue__continue" onClick={openFirst}>
          Continue <ArrowRight size={13} strokeWidth={2.5} />
        </button>
        {items.length > 1 && (
          <button type="button" className="dash-bm-queue__all" onClick={() => navigate('/bookmarks')}>
            View all {items.length}
          </button>
        )}
      </div>
    </motion.div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMissions, getMissionSubmissions } from '../../api/api'
import { useAuth } from '../../context/AuthContext'

// Dashboard arena overview of the hunter's missions: how many accomplished, and the nearest
// mission still in progress with a one-tap Continue. Self-contained (fetches its own data,
// short-cached) so it adds a single lightweight card to the arena without threading state
// through DashboardPage. Reuses the existing .dash-active-path / .dash-no-path styling so it
// matches the surrounding cards exactly — no new visual language, no new CSS.
//
// Completion stays link-based (repo/deploy); "in progress" = accepted but not yet accomplished.
// Renders nothing until loaded (no loader flash) and never for a hunter with no missions data.
const MISSION_COLOR = '#FF7F2A'

export default function MissionOverviewCard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGuest = !user || user.role === 'GUEST'
  const [state, setState] = useState(null) // { accomplished, nearest, startedCount }

  useEffect(() => {
    let active = true
    Promise.all([
      getMissions().then(r => r.data).catch(() => []),
      isGuest ? Promise.resolve([]) : getMissionSubmissions().then(r => r.data).catch(() => []),
    ]).then(([missions, subs]) => {
      if (!active) return
      const list = Array.isArray(missions) ? missions : []
      const byId = new Map(list.map(m => [m.id, m]))
      const subList = Array.isArray(subs) ? subs : []

      let accomplished = 0
      const inProgress = []
      for (const s of subList) {
        const done = !!(s.repoUrl || s.deployUrl)
        const accepted = done || s.accepted || (s.completedObjectives > 0)
        if (done) { accomplished++; continue }
        if (accepted && byId.has(s.missionId)) inProgress.push(s)
      }
      // Nearest = the accepted-but-unfinished mission that appears earliest on the board.
      const order = new Map(list.map((m, i) => [m.id, i]))
      inProgress.sort((a, b) => (order.get(a.missionId) ?? 1e9) - (order.get(b.missionId) ?? 1e9))
      const nearestSub = inProgress[0] || null
      const nearest = nearestSub ? (() => {
        const m = byId.get(nearestSub.missionId)
        const total = m?.objectives?.length || 0
        const doneN = Math.min(total, nearestSub.completedObjectives || 0)
        return { id: m.id, title: m.title, done: doneN, total, pct: total > 0 ? Math.round((doneN / total) * 100) : 0 }
      })() : null

      setState({ accomplished, nearest, startedCount: accomplished + inProgress.length })
    })
    return () => { active = false }
  }, [isGuest])

  if (!state) return null

  const { accomplished, nearest } = state

  // Nothing started yet → an invitation to begin (matches the arena's no-path invite).
  if (!nearest && accomplished === 0) {
    return (
      <div className="dash-no-path" onClick={() => navigate('/missions')}>
        <div className="dash-no-path__label">Build something real</div>
        <div className="dash-no-path__cta">→ Take on a mission and ship a project</div>
      </div>
    )
  }

  // A mission is mid-build → surface it with a one-tap Continue.
  if (nearest) {
    return (
      <div
        className="dash-active-path"
        style={{ '--path-color': MISSION_COLOR, '--progress-pct': `${nearest.pct}%` }}
        onClick={() => navigate(`/missions/${nearest.id}`)}
      >
        <div className="dash-active-path__row">
          <span className="dash-active-path__icon">🛰️</span>
          <div className="dash-flex-1">
            <div className="dash-active-path__title">{nearest.title}</div>
            <div className="dash-active-path__label">
              MISSION IN PROGRESS{accomplished > 0 ? ` · ${accomplished} ACCOMPLISHED` : ''}
            </div>
          </div>
          <span className="dash-active-path__pct">
            {nearest.total > 0 ? `${nearest.done}/${nearest.total}` : 'CONTINUE'}
          </span>
        </div>
        {nearest.total > 0 && (
          <div className="dash-active-path__track"><div className="dash-active-path__fill" /></div>
        )}
      </div>
    )
  }

  // All started missions are accomplished → nudge toward the next one.
  return (
    <div
      className="dash-active-path"
      style={{ '--path-color': MISSION_COLOR, '--progress-pct': '100%' }}
      onClick={() => navigate('/missions')}
    >
      <div className="dash-active-path__row">
        <span className="dash-active-path__icon">🛰️</span>
        <div className="dash-flex-1">
          <div className="dash-active-path__title">Missions</div>
          <div className="dash-active-path__label">{accomplished} ACCOMPLISHED · PICK YOUR NEXT</div>
        </div>
        <span className="dash-active-path__pct">→</span>
      </div>
    </div>
  )
}

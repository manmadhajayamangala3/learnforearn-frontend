import { motion } from 'framer-motion'
import { BookOpen, Code2, Trophy, Briefcase, Terminal } from 'lucide-react'

const QUEST_STEPS = [
  { icon: BookOpen, label: 'Learn', sub: 'Concept-by-concept roadmaps', color: '#60A5FA' },
  { icon: Code2, label: 'Build', sub: 'Real syntax, examples & code', color: '#9B6ED4' },
  { icon: Trophy, label: 'Prove', sub: 'Quizzes, XP & rank badges', color: '#F59E0B' },
  { icon: Briefcase, label: 'Launch', sub: 'Portfolio, missions & jobs', color: '#4ADE80' },
]

const RANKS = [
  { r: 'S', color: '#EF4444', xp: '10k+' },
  { r: 'A', color: '#F59E0B', xp: '6k' },
  { r: 'B', color: '#9B6ED4', xp: '3k' },
  { r: 'C', color: '#60A5FA', xp: '1.5k' },
  { r: 'D', color: '#4ADE80', xp: '500' },
  { r: 'E', color: '#888888', xp: '0' },
]

const STATS = [
  { val: '3', label: 'Career paths', accent: '#9B6ED4' },
  { val: '30+', label: 'Subjects', accent: '#60A5FA' },
  { val: '100+', label: 'Concepts', accent: '#4ADE80' },
]

const stepVariants = {
  hidden: { opacity: 0, x: -24 },
  show: i => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const rankVariants = {
  hidden: { opacity: 0, x: 24 },
  show: i => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.2 + i * 0.07, duration: 0.4 },
  }),
}

export function AuthFlankLeft({ mode, parallaxX = 0, parallaxY = 0 }) {
  const isLogin = mode === 'login'

  return (
    <motion.aside
      className="auth-flank auth-flank--left"
      style={{ x: parallaxX * -14, y: parallaxY * -10 }}
      aria-hidden="true"
    >
      <div className="auth-flank-watermark">
        <span>ZERO</span>
        <span className="auth-flank-watermark-arrow">↓</span>
        <span>HIRED</span>
      </div>

      <div className="auth-flank-headline">
        <span className="auth-flank-eyebrow">
          {isLogin ? '◆ QUEST RESUME' : '◆ NEW QUEST'}
        </span>
        <h2 className="auth-flank-title">
          {isLogin ? (
            <>Pick up where<br /><span className="auth-flank-accent">you left off</span></>
          ) : (
            <>Start your path to<br /><span className="auth-flank-accent">first job offer</span></>
          )}
        </h2>
        <p className="auth-flank-desc">
          Real IT skills for Indian grads — Java, React, Python, DevOps & more.
          Not tutorials. A structured arena.
        </p>
      </div>

      <div className="auth-quest-track">
        <div className="auth-quest-line" aria-hidden="true">
          <motion.div
            className="auth-quest-line-fill"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {QUEST_STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.label}
              className="auth-quest-step"
              custom={i}
              variants={stepVariants}
              initial="hidden"
              animate="show"
            >
              <div className="auth-quest-node" style={{ borderColor: step.color, boxShadow: `0 0 16px ${step.color}33` }}>
                <Icon size={16} color={step.color} />
              </div>
              <div>
                <div className="auth-quest-label">{step.label}</div>
                <div className="auth-quest-sub">{step.sub}</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.aside>
  )
}

export function AuthFlankRight({ mode, parallaxX = 0, parallaxY = 0 }) {
  const isLogin = mode === 'login'

  return (
    <motion.aside
      className="auth-flank auth-flank--right"
      style={{ x: parallaxX * 14, y: parallaxY * -10 }}
      aria-hidden="true"
    >
      <div className="auth-flank-panel auth-flank-panel--stats">
        <div className="auth-flank-panel-label">PLATFORM</div>
        <div className="auth-stat-grid">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="auth-stat-chip"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
            >
              <div className="auth-stat-chip-val" style={{ color: s.accent }}>{s.val}</div>
              <div className="auth-stat-chip-lbl">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="auth-rank-tower">
        <div className="auth-flank-panel-label">RANK LADDER</div>
        <p className="auth-rank-tower-hint">Earn XP · Rise E → S</p>
        <div className="auth-rank-tower-track">
          <div className="auth-rank-tower-beam" aria-hidden="true" />
          {RANKS.map((rank, i) => (
            <motion.div
              key={rank.r}
              className={`auth-rank-rung${rank.r === 'E' ? ' auth-rank-rung--start' : ''}${rank.r === 'S' ? ' auth-rank-rung--peak' : ''}`}
              custom={i}
              variants={rankVariants}
              initial="hidden"
              animate="show"
            >
              <div
                className="auth-rank-badge"
                style={{ borderColor: rank.color, color: rank.color, background: `${rank.color}14` }}
              >
                {rank.r}
              </div>
              <div className="auth-rank-meta">
                <span className="auth-rank-xp">{rank.xp} XP</span>
                {rank.r === 'E' && isLogin && (
                  <span className="auth-rank-you">you</span>
                )}
                {rank.r === 'E' && !isLogin && (
                  <span className="auth-rank-you auth-rank-you--new">start</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="auth-terminal">
        <div className="auth-terminal-bar">
          <Terminal size={12} />
          <span>system.log</span>
        </div>
        <div className="auth-terminal-body">
          <div><span className="auth-t-dim">$</span> arise.init()</div>
          <div><span className="auth-t-dim">$</span> arena.status <span className="auth-t-ok">READY</span></div>
          <div><span className="auth-t-dim">$</span> hunter.mode <span className="auth-t-val">{isLogin ? 'RETURN' : 'AWAKEN'}</span></div>
          <div className="auth-terminal-cursor" aria-hidden="true" />
        </div>
      </div>
    </motion.aside>
  )
}

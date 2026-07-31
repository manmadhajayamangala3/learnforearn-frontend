import { useState, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'

// Single source of number animation across the app. Extracted verbatim from the
// inline implementation that lived at PublicProfilePage.jsx:49-67 — same
// requestAnimationFrame loop, same cubic ease-out, same 1050ms default, same
// reduced-motion behavior (jump straight to the final value).
//
// Props:
//   value     — target number to count to
//   duration  — ms for the count animation (default 1050)
//   format    — (n:number) => ReactNode; default toLocaleString('en-IN')
//   className  — optional; when set the output is wrapped in a <span>, otherwise a fragment

const DEFAULT_FORMAT = (n) => n.toLocaleString('en-IN')

export default function CountUp({ value, duration = 1050, format = DEFAULT_FORMAT, className }) {
  const reduce = useReducedMotion()
  const to = Number(value) || 0
  const [n, setN] = useState(reduce ? to : 0)

  useEffect(() => {
    if (reduce) { setN(to); return undefined }
    let raf, start
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, reduce, duration])

  const out = format(n)
  return className ? <span className={className}>{out}</span> : <>{out}</>
}

import { useState, useEffect } from 'react'

export default function useCyclingText(messages, active) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (!active) { setIdx(0); return }
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 1500)
    return () => clearInterval(t)
  }, [active, messages])
  return messages[idx]
}

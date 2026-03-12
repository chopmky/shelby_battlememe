'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  endTime: string // ISO timestamp
}

function formatTime(seconds: number) {
  if (seconds <= 0) return 'ENDED'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000))
    setRemaining(calc())
    const interval = setInterval(() => setRemaining(calc()), 1000)
    return () => clearInterval(interval)
  }, [endTime])

  const ended = remaining <= 0

  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium"
      style={{
        fontFamily: 'var(--font-mono)',
        background: ended ? 'rgba(255,45,120,0.1)' : 'rgba(255,107,45,0.1)',
        color: ended ? 'var(--accent-pink)' : 'var(--accent-orange)',
        border: `1px solid ${ended ? 'rgba(255,45,120,0.3)' : 'rgba(255,107,45,0.3)'}`,
      }}
    >
      {/* Clock icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {formatTime(remaining)}
    </span>
  )
}

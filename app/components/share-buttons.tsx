'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  battleId: number
  title?: string
}

const btnStyle = {
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-default)',
  fontFamily: 'var(--font-body)',
}

export default function ShareButtons({ battleId, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/battle/${battleId}` : ''
  const text = title || `Check out BattleMEME #${battleId}!`

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={copyLink}
        className="rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
        style={btnStyle}
      >
        {copied ? '✓ Copied!' : 'Copy Link'}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
        style={btnStyle}
      >
        Twitter / X
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
        style={btnStyle}
      >
        Telegram
      </a>
    </div>
  )
}

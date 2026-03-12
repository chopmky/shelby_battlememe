'use client'

import { useEffect, useState, useCallback } from 'react'

interface VoteLogEntry {
  voter_wallet: string
  voted_at: string
}

interface VoteLogRealtimeProps {
  battleId: number
  onNewVote?: () => void
}

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

// Generate a random hex wallet address
function randomWallet(): string {
  const hex = '0123456789abcdef'
  let addr = '0x'
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)]
  return addr
}

function ZapIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
      style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default function VoteLogRealtime({ battleId, onNewVote }: VoteLogRealtimeProps) {
  const [votes, setVotes] = useState<VoteLogEntry[]>([])

  // Fetch initial vote log from API
  useEffect(() => {
    fetch(`/api/battles/${battleId}/votes`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setVotes(data) })
  }, [battleId])

  // Simulate live votes every 3-6 seconds
  const addFakeVote = useCallback(() => {
    const entry: VoteLogEntry = {
      voter_wallet: randomWallet(),
      voted_at: new Date().toISOString(),
    }
    setVotes((prev) => [entry, ...prev].slice(0, 50))
    onNewVote?.()
  }, [onNewVote])

  useEffect(() => {
    const tick = () => {
      addFakeVote()
      const delay = 3000 + Math.random() * 3000
      timer = setTimeout(tick, delay)
    }
    let timer = setTimeout(tick, 4000)
    return () => clearTimeout(timer)
  }, [addFakeVote])

  if (votes.length === 0) {
    return (
      <p className="py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No votes yet — be the first!
      </p>
    )
  }

  return (
    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
      {votes.map((v, i) => (
        <div
          key={`${v.voter_wallet}-${i}`}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${i === 0 ? 'animate-fade-in' : ''}`}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <ZapIcon />
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {truncateAddr(v.voter_wallet)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>voted</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {timeAgo(v.voted_at)}
          </span>
        </div>
      ))}
    </div>
  )
}

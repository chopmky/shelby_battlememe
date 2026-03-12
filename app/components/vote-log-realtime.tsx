'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser-client'

interface VoteLogEntry {
  voter_wallet: string
  voted_at: string
}

interface VoteLogRealtimeProps {
  battleId: number
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

// Zap icon for live activity
function ZapIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default function VoteLogRealtime({ battleId }: VoteLogRealtimeProps) {
  const [votes, setVotes] = useState<VoteLogEntry[]>([])

  useEffect(() => {
    fetch(`/api/battles/${battleId}/votes`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setVotes(data) })

    const channel = supabase
      .channel(`votes-${battleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `battle_id=eq.${battleId}` },
        (payload) => {
          const { voter_wallet, voted_at } = payload.new as VoteLogEntry
          setVotes((prev) => [{ voter_wallet, voted_at }, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [battleId])

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
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
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

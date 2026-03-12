'use client'

import { getBlobUrl } from '@/lib/shelby-client'
import VoteButton from '@/app/components/vote-button'

interface MemePanelProps {
  side: 'meme_a' | 'meme_b'
  creator: string
  blobName: string
  isResolved: boolean
  isWinner: boolean
  votes?: number
  totalVoters: number
  canVote: boolean
  hasVoted: boolean
  votedSide: string | null
  battleId: number
  platformWallet: string
}

// Progress bar for resolved battles
function VoteBar({ pct, isWinner }: { pct: number; isWinner: boolean }) {
  return (
    <div>
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: isWinner ? 'var(--status-win)' : 'var(--status-lose)',
          }}
        />
      </div>
      <p
        className="mt-1 text-xs text-center font-semibold"
        style={{
          fontFamily: 'var(--font-mono)',
          color: isWinner ? 'var(--status-win)' : 'var(--status-lose)',
        }}
      >
        {pct.toFixed(0)}%
      </p>
    </div>
  )
}

export default function BattleMemePanel({
  side, creator, blobName, isResolved, isWinner, votes, totalVoters,
  canVote, hasVoted, votedSide, battleId, platformWallet,
}: MemePanelProps) {
  const isMemeA = side === 'meme_a'
  const label = isMemeA ? 'Meme A' : 'Meme B'
  const pct = totalVoters > 0 && votes !== undefined ? (votes / totalVoters) * 100 : 50

  const borderColor = isResolved
    ? isWinner ? 'var(--status-win)' : 'var(--status-lose)'
    : 'var(--border-default)'
  const glowStyle = isResolved
    ? isWinner
      ? { boxShadow: '0 0 24px rgba(57,255,20,0.25)' }
      : { boxShadow: '0 0 24px rgba(255,45,120,0.15)' }
    : {}

  return (
    <div className="space-y-3">
      {/* Image */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ border: `2px solid ${borderColor}`, ...glowStyle }}
      >
        <img
          src={getBlobUrl(creator, blobName)}
          alt={label}
          className="aspect-square w-full object-cover"
        />
        {isResolved && isWinner && (
          <div
            className="absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-bold"
            style={{ background: 'var(--status-win)', color: '#0B0E17', fontFamily: 'var(--font-display)' }}
          >
            WINNER
          </div>
        )}
      </div>

      {/* Name + creator */}
      <div>
        <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {creator.slice(0, 8)}...{creator.slice(-4)}
        </p>
      </div>

      {/* Vote bar (resolved) */}
      {isResolved && votes !== undefined && <VoteBar pct={pct} isWinner={isWinner} />}

      {/* Vote button */}
      {canVote && (
        <div>
          <VoteButton battleId={battleId} side={side} disabled={false} platformWallet={platformWallet} />
          <p className="mt-1 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Cost: 0.1 ShelbyUSD
          </p>
        </div>
      )}

      {/* Already voted */}
      {hasVoted && votedSide === side && (
        <p className="text-center text-xs font-medium" style={{ color: 'var(--status-win)' }}>
          You voted for {label} ✓
        </p>
      )}
    </div>
  )
}

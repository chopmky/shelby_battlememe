'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import WalletConnectButton from '@/app/components/wallet-connect-button'
import CountdownTimer from '@/app/components/countdown-timer'
import VoteLogRealtime from '@/app/components/vote-log-realtime'
import ClaimRewardButton from '@/app/components/claim-reward-button'
import ShareButtons from '@/app/components/share-buttons'
import BattleMemePanel from './battle-meme-panel'
import Link from 'next/link'

interface Battle {
  id: number
  meme_a_blob_id: string
  meme_a_blob_name: string
  meme_a_creator: string
  meme_b_blob_id: string
  meme_b_blob_name: string
  meme_b_creator: string
  matched_at: string
  duration: number
  pool: number
  total_voters: number
  status: string
  winner?: string
  votes_a?: number
  votes_b?: number
}

const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || ''

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-3 flex-1 min-w-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{label}</p>
      <p className="font-bold text-sm" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>{value}</p>
    </div>
  )
}

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent-cyan)' }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default function BattleDetailPage() {
  const params = useParams()
  const battleId = Number(params.id)
  const { account, connected } = useWallet()
  const [battle, setBattle] = useState<Battle | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedSide, setVotedSide] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [livePool, setLivePool] = useState(0)
  const [liveVoters, setLiveVoters] = useState(0)

  useEffect(() => {
    fetch(`/api/battles/${battleId}`)
      .then((r) => r.json())
      .then((data) => {
        setBattle(data)
        setLivePool(data.pool || 0)
        setLiveVoters(data.total_voters || 0)
      })
      .finally(() => setLoading(false))
  }, [battleId])

  useEffect(() => {
    if (!connected || !account || !battleId) return
    fetch(`/api/battles/${battleId}/votes?wallet=${account.address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.voted) { setHasVoted(true); setVotedSide(data.vote?.side) }
      })
  }, [connected, account, battleId])

  const loadingStyle = { background: 'var(--bg-primary)', color: 'var(--text-primary)' }

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={loadingStyle}>Loading...</div>
  if (!battle) return <div className="flex min-h-screen items-center justify-center" style={loadingStyle}>Battle not found</div>

  const endTime = new Date(new Date(battle.matched_at).getTime() + battle.duration * 1000).toISOString()
  const isResolved = battle.status === 'resolved'
  const isExpired = Date.now() > new Date(endTime).getTime()
  const canVote = connected && !hasVoted && !isResolved && !isExpired
  const statusLabel = isResolved ? 'ENDED' : 'ACTIVE'
  const statusColor = isResolved ? 'var(--accent-pink)' : 'var(--accent-cyan)'
  const statusBg = isResolved ? 'rgba(255,45,120,0.12)' : 'rgba(0,229,255,0.12)'
  const statusBorder = isResolved ? 'rgba(255,45,120,0.35)' : 'rgba(0,229,255,0.35)'
  const winnerPrizePct = battle.pool * 0.8

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <ZapIcon />
          <Link href="/" className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            MemeBattle
          </Link>
        </div>
        <WalletConnectButton />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Back + Clone row */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-1 text-sm transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}>
            ← Back to Battles
          </Link>
          <Link href="/submit" className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
            Clone Battle
          </Link>
        </div>

        {/* Title + badge */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            BattleMEME #{battle.id}
          </h1>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
            style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, fontFamily: 'var(--font-display)' }}>
            {statusLabel}
          </span>
        </div>

        {isResolved && (
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            This battle has ended. {battle.winner === 'meme_a' ? 'Meme A' : 'Meme B'} wins the pool!
          </p>
        )}

        {/* Meme panels + VS */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start mb-6">
          <BattleMemePanel
            side="meme_a" creator={battle.meme_a_creator} blobName={battle.meme_a_blob_name}
            isResolved={isResolved} isWinner={battle.winner === 'meme_a'}
            votes={battle.votes_a} totalVoters={battle.total_voters}
            canVote={canVote} hasVoted={hasVoted} votedSide={votedSide}
            battleId={battle.id} platformWallet={PLATFORM_WALLET}
          />
          <div className="vs-circle h-12 w-12 mt-16 text-sm font-bold flex-shrink-0"
            style={{ color: '#0B0E17', fontFamily: 'var(--font-display)' }}>
            VS
          </div>
          <BattleMemePanel
            side="meme_b" creator={battle.meme_b_creator} blobName={battle.meme_b_blob_name}
            isResolved={isResolved} isWinner={battle.winner === 'meme_b'}
            votes={battle.votes_b} totalVoters={battle.total_voters}
            canVote={canVote} hasVoted={hasVoted} votedSide={votedSide}
            battleId={battle.id} platformWallet={PLATFORM_WALLET}
          />
        </div>

        {/* Dark pool notice (active only) */}
        {!isResolved && (
          <div className="mb-6 rounded-xl p-3 flex items-center gap-2 text-xs"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <span>🔒</span>
            <span>Dark Pool — Vote ratio hidden until battle ends</span>
          </div>
        )}

        {/* Stats cards */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
          <StatCard label="Total Pool" value={`${livePool.toFixed(1)} ShelbyUSD`} />
          <StatCard label="Total Voters" value={liveVoters} />
          <StatCard label="Vote Cost" value="0.1 ShelbyUSD" />
          <StatCard label="Winner Prize" value={isResolved ? `${winnerPrizePct.toFixed(2)}` : '???'} />
        </div>

        {/* Countdown (active) */}
        {!isResolved && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Time remaining:</span>
            <CountdownTimer endTime={endTime} />
          </div>
        )}

        {/* Your result + claim (resolved) */}
        {isResolved && connected && (
          <div className="mb-6 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <h3 className="font-semibold mb-3 text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Your Result
            </h3>
            {hasVoted && (
              <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Chose {votedSide === 'meme_a' ? 'Meme A' : 'Meme B'}
              </p>
            )}
            <ClaimRewardButton battleId={battle.id} />
          </div>
        )}

        {/* Share */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
            Share Battle
          </h3>
          <ShareButtons battleId={battle.id} />
        </div>

        {/* Live vote log */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Live Vote Activity
          </h3>
          <VoteLogRealtime battleId={battle.id} onNewVote={() => {
            setLivePool((p) => +(p + 0.1).toFixed(1))
            setLiveVoters((v) => v + 1)
          }} />
        </div>
      </main>
    </div>
  )
}

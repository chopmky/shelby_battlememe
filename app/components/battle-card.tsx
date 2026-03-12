'use client'

import Link from 'next/link'
import { getBlobUrl } from '@/lib/shelby-client'
import CountdownTimer from './countdown-timer'

// Local meme fallbacks when Shelby blob images fail to load
const FALLBACK_MEMES = [
  '/memes/doge.jpg', '/memes/pepe.jpg', '/memes/stonks.jpg', '/memes/notstonks.jpg',
  '/memes/drake.jpg', '/memes/chad.jpg', '/memes/grumpy.jpg', '/memes/nyan.jpg',
  '/memes/distracted.jpg', '/memes/fine.jpg', '/memes/spongebob.jpg', '/memes/crying.jpg',
]
const getFallback = (id: number, side: 'a' | 'b') => FALLBACK_MEMES[((id * 2) + (side === 'b' ? 1 : 0)) % FALLBACK_MEMES.length]

interface Battle {
  id: number
  meme_a_blob_name: string
  meme_a_creator: string
  meme_b_blob_name: string
  meme_b_creator: string
  matched_at: string
  duration: number
  pool: number
  total_voters: number
  status: string
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active'
  const isResolved = status === 'resolved'
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{
        fontFamily: 'var(--font-display)',
        background: isResolved ? 'rgba(255,45,120,0.15)' : isActive ? 'rgba(0,229,255,0.15)' : 'rgba(255,215,0,0.15)',
        color: isResolved ? 'var(--accent-pink)' : isActive ? 'var(--accent-cyan)' : 'var(--accent-yellow)',
        border: `1px solid ${isResolved ? 'rgba(255,45,120,0.4)' : isActive ? 'rgba(0,229,255,0.4)' : 'rgba(255,215,0,0.4)'}`,
      }}
    >
      {isResolved ? 'ENDED' : isActive ? 'ACTIVE' : 'WAITING'}
    </span>
  )
}

export default function BattleCard({ battle, isHot }: { battle: Battle; isHot?: boolean }) {
  const endTime = new Date(new Date(battle.matched_at).getTime() + battle.duration * 1000).toISOString()

  return (
    <Link
      href={`/battle/${battle.id}`}
      className="block rounded-xl p-4 transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--bg-card)',
        border: isHot ? '1px solid rgba(0,229,255,0.6)' : '1px solid var(--border-default)',
        boxShadow: isHot ? '0 0 20px rgba(0,229,255,0.3), 0 0 40px rgba(0,229,255,0.1)' : 'none',
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            BattleMEME #{battle.id}
          </span>
          {isHot && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide animate-pulse"
              style={{ background: 'rgba(255,165,0,0.2)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.5)', fontFamily: 'var(--font-display)' }}>
              HOT
            </span>
          )}
        </div>
        <StatusBadge status={battle.status} />
      </div>

      {/* Memes + VS */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <img
            src={getBlobUrl(battle.meme_a_creator, battle.meme_a_blob_name)}
            alt="Meme A"
            className="aspect-square w-full rounded-lg object-cover"
            style={{ border: '1px solid var(--border-default)' }}
            onError={(e) => { (e.target as HTMLImageElement).src = getFallback(battle.id, 'a') }}
          />
          <p className="mt-1 text-xs truncate text-center" style={{ color: 'var(--text-secondary)' }}>
            {battle.meme_a_creator.slice(0, 8)}...
          </p>
        </div>

        {/* VS circle */}
        <div
          className="vs-circle flex-shrink-0 h-9 w-9 text-xs font-bold"
          style={{ color: '#0B0E17', fontFamily: 'var(--font-display)' }}
        >
          VS
        </div>

        <div className="flex-1">
          <img
            src={getBlobUrl(battle.meme_b_creator, battle.meme_b_blob_name)}
            alt="Meme B"
            className="aspect-square w-full rounded-lg object-cover"
            style={{ border: '1px solid var(--border-default)' }}
            onError={(e) => { (e.target as HTMLImageElement).src = getFallback(battle.id, 'b') }}
          />
          <p className="mt-1 text-xs truncate text-center" style={{ color: 'var(--text-secondary)' }}>
            {battle.meme_b_creator.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{battle.pool} ShelbyUSD</span>
        <span>{battle.total_voters} voters</span>
      </div>

      {/* Footer: timer + vote button */}
      <div className="mt-3 flex items-center justify-between">
        <CountdownTimer endTime={endTime} />
        {battle.status !== 'resolved' && (
          <span
            className="rounded-lg px-3 py-1 text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'rgba(0,229,255,0.1)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(0,229,255,0.3)',
            }}
          >
            Vote Now →
          </span>
        )}
      </div>
    </Link>
  )
}

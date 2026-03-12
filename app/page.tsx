'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import WalletConnectButton from '@/app/components/wallet-connect-button'
import BattleCard from '@/app/components/battle-card'
import BattleTabs from '@/app/components/battle-tabs'
import Link from 'next/link'

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

interface Stats {
  totalPool: number
  activeBattles: number
  totalVotes: number
  battlingMemes: number
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl p-4 flex-1 min-w-0"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      <p className="text-xs mb-1 truncate" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        {label}
      </p>
      <p className="text-lg font-bold truncate" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
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

export default function HomePage() {
  const { account, connected } = useWallet()
  const [battles, setBattles] = useState<Battle[]>([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalPool: 0, activeBattles: 0, totalVotes: 0, battlingMemes: 0 })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tab === 'my' && account) {
      params.set('status', 'all')
      params.set('wallet', account.address.toString())
    } else if (tab === 'resolved') {
      params.set('status', 'resolved')
    } else {
      params.set('status', 'active')
    }

    fetch(`/api/battles?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list: Battle[] = Array.isArray(data) ? data : []
        setBattles(list)
        // Derive stats from battle list
        const active = list.filter((b) => b.status === 'active')
        setStats({
          totalPool: list.reduce((s, b) => s + (b.pool || 0), 0),
          activeBattles: active.length,
          totalVotes: list.reduce((s, b) => s + (b.total_voters || 0), 0),
          battlingMemes: active.length * 2,
        })
      })
      .finally(() => setLoading(false))
  }, [tab, account])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <ZapIcon />
          <span
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            MemeBattle
          </span>
        </div>
        <WalletConnectButton />
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Stats row */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-1">
          <StatCard label="Total Pool" value={`${stats.totalPool.toFixed(2)} ShelbyUSD`} />
          <StatCard label="Active Battles" value={stats.activeBattles} />
          <StatCard label="Total Votes" value={stats.totalVotes} />
          <StatCard label="Battling Memes" value={stats.battlingMemes} />
        </div>

        {/* Tabs + section label */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <BattleTabs activeTab={tab} onTabChange={setTab} walletConnected={connected} />
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            {tab === 'resolved' ? 'ENDED BATTLES' : tab === 'my' ? 'MY BATTLES' : 'ACTIVE BATTLES'}
          </p>
        </div>

        {/* Battle list */}
        {loading ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading battles...
          </p>
        ) : battles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>No battles found</p>
            <Link
              href="/submit"
              className="text-sm hover:underline"
              style={{ color: 'var(--accent-cyan)' }}
            >
              Submit a meme to start a battle →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {battles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        )}

        {/* CTA banner */}
        <div
          className="mt-12 rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid var(--border-glow)',
          }}
        >
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Got a winning meme?
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Submit your best meme and battle head-to-head for the pool prize.
          </p>
          <Link
            href="/submit"
            className="btn-gradient inline-block rounded-xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Submit Your Meme
          </Link>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { fetchWalletBlobs, getBlobUrl } from '@/lib/shelby-client'
import WalletConnectButton from '@/app/components/wallet-connect-button'
import MemeGrid from '@/app/components/meme-grid'
import Link from 'next/link'

type SubmitState = 'idle' | 'submitting' | 'waiting' | 'matched'

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent-cyan)' }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default function SubmitPage() {
  const { account, connected } = useWallet()
  const [blobs, setBlobs] = useState<{ object_address: string; owner_address: string; blob_name?: string }[]>([])
  const [selectedBlobId, setSelectedBlobId] = useState<string | null>(null)
  const [selectedBlobName, setSelectedBlobName] = useState<string>('')
  const [state, setState] = useState<SubmitState>('idle')
  const [queueId, setQueueId] = useState<number | null>(null)
  const [battleId, setBattleId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!connected || !account) return
    setLoading(true)
    fetchWalletBlobs(account.address.toString())
      .then(setBlobs)
      .catch(() => setBlobs([]))
      .finally(() => setLoading(false))
  }, [connected, account])

  useEffect(() => {
    if (state !== 'waiting' || !account) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/queue?wallet=${account.address}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length === 0) setState('matched')
    }, 5000)
    return () => clearInterval(interval)
  }, [state, account])

  const handleSubmit = async () => {
    if (!account || !selectedBlobId) return
    setState('submitting')
    setError('')
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blob_id: selectedBlobId, blob_name: selectedBlobName, creator_wallet: account.address.toString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.status === 'matched') { setBattleId(data.battle_id); setState('matched') }
      else { setQueueId(data.queue_id); setState('waiting') }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
      setState('idle')
    }
  }

  const handleCancel = async () => {
    if (!queueId) return
    await fetch(`/api/queue?id=${queueId}`, { method: 'DELETE' })
    setState('idle')
    setQueueId(null)
  }

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-2 mb-2">
          <ZapIcon />
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Submit Your Meme
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to browse your Shelby memes</p>
        <WalletConnectButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
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

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Submit Your Meme
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pick a meme from your wallet to enter the battle arena.
        </p>

        {/* Waiting state */}
        {state === 'waiting' && (
          <div className="rounded-2xl p-8 text-center mb-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-center gap-6 mb-6">
              <img src={getBlobUrl(account!.address.toString(), selectedBlobName)} alt="Your meme"
                className="h-32 w-32 rounded-xl object-cover" style={{ border: '2px solid var(--border-strong)' }} />
              <div className="vs-circle h-12 w-12 text-sm font-bold" style={{ color: '#0B0E17', fontFamily: 'var(--font-display)' }}>
                VS
              </div>
              <div className="flex h-32 w-32 items-center justify-center rounded-xl"
                style={{ border: '2px dashed var(--border-strong)', background: 'var(--bg-elevated)' }}>
                <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>???</span>
              </div>
            </div>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Waiting for an opponent...</p>
            <button onClick={handleCancel}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'var(--accent-pink)', border: '1px solid rgba(255,45,120,0.4)', background: 'rgba(255,45,120,0.08)' }}>
              Cancel
            </button>
          </div>
        )}

        {/* Matched state */}
        {state === 'matched' && battleId && (
          <div className="rounded-2xl p-8 text-center mb-6"
            style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.3)' }}>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--status-win)' }}>
              Matched!
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              BattleMEME #{battleId} — 24h battle starts now!
            </p>
            <Link href={`/battle/${battleId}`}
              className="btn-gradient inline-block rounded-xl px-6 py-3 text-sm font-semibold"
              style={{ fontFamily: 'var(--font-display)' }}>
              View Battle →
            </Link>
          </div>
        )}

        {/* Meme selection */}
        {(state === 'idle' || state === 'submitting') && (
          <>
            {loading ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your memes...</p>
            ) : (
              <MemeGrid
                blobs={blobs}
                ownerAddress={account!.address.toString()}
                selectedBlobId={selectedBlobId}
                onSelect={(id, name) => { setSelectedBlobId(id); setSelectedBlobName(name) }}
              />
            )}
            {error && <p className="mt-4 text-sm" style={{ color: 'var(--accent-pink)' }}>{error}</p>}
            <button onClick={handleSubmit} disabled={!selectedBlobId || state === 'submitting'}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed btn-gradient"
              style={{ fontFamily: 'var(--font-display)' }}>
              {state === 'submitting' ? 'Submitting...' : 'Submit to Battle'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}

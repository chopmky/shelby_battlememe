'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { fetchWalletBlobs, getBlobUrl } from '@/lib/shelby-client'
import WalletConnectButton from '@/app/components/wallet-connect-button'
import MemeGrid from '@/app/components/meme-grid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type SubmitState = 'idle' | 'submitting' | 'searching' | 'matched'

// Demo seed memes for instant matching
const SEED_MEMES = ['doge.jpg', 'pepe.jpg', 'stonks.jpg', 'chad.jpg', 'grumpy.jpg', 'nyan.jpg']

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent-cyan)' }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default function SubmitPage() {
  const { account, connected } = useWallet()
  const router = useRouter()
  const [blobs, setBlobs] = useState<{ object_address: string; owner_address: string; blob_name?: string }[]>([])
  const [selectedBlobId, setSelectedBlobId] = useState<string | null>(null)
  const [selectedBlobName, setSelectedBlobName] = useState<string>('')
  const [state, setState] = useState<SubmitState>('idle')
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

  const handleSubmit = async () => {
    if (!selectedBlobId) return
    setError('')
    setState('searching')

    // Show "Searching for Challenger..." for 2 seconds, then redirect to a demo battle
    setTimeout(() => {
      const matchedBattleId = Math.floor(Math.random() * 4) + 1 // random demo battle 1-4
      setBattleId(matchedBattleId)
      setState('matched')
      // Auto-redirect after brief matched state
      setTimeout(() => router.push(`/battle/${matchedBattleId}`), 1500)
    }, 2000)
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

        {/* Searching animation */}
        {state === 'searching' && (
          <div className="rounded-2xl p-8 text-center mb-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-center gap-6 mb-6">
              <img src={getBlobUrl(account!.address.toString(), selectedBlobName)} alt="Your meme"
                className="h-32 w-32 rounded-xl object-cover"
                style={{ border: '2px solid var(--border-strong)' }}
                onError={(e) => { (e.target as HTMLImageElement).src = `/memes/${SEED_MEMES[0]}` }} />
              <div className="vs-circle h-12 w-12 text-sm font-bold animate-pulse"
                style={{ color: '#0B0E17', fontFamily: 'var(--font-display)' }}>
                VS
              </div>
              <div className="flex h-32 w-32 items-center justify-center rounded-xl animate-pulse"
                style={{ border: '2px dashed var(--accent-cyan)', background: 'rgba(0,229,255,0.05)' }}>
                <span className="text-2xl" style={{ color: 'var(--accent-cyan)' }}>?</span>
              </div>
            </div>
            <p className="text-sm animate-pulse" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
              Searching for Challenger...
            </p>
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
              Submit to Battle
            </button>
          </>
        )}
      </main>
    </div>
  )
}

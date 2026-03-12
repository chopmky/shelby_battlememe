'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'

interface ClaimRewardButtonProps {
  battleId: number
}

type ClaimState = 'checking' | 'claimable' | 'claiming' | 'claimed' | 'none'

export default function ClaimRewardButton({ battleId }: ClaimRewardButtonProps) {
  const { account } = useWallet()
  const [state, setState] = useState<ClaimState>('checking')
  const [amount, setAmount] = useState(0)
  const [txHash, setTxHash] = useState('')

  useEffect(() => {
    if (!account) { setState('none'); return }

    fetch(`/api/claim?battle_id=${battleId}&wallet=${account.address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.amount) {
          setAmount(data.amount)
          setState(data.status === 'completed' ? 'claimed' : 'claimable')
          if (data.tx_hash) setTxHash(data.tx_hash)
        } else {
          setState('none')
        }
      })
      .catch(() => setState('none'))
  }, [account, battleId])

  const handleClaim = async () => {
    if (!account) return
    setState('claiming')
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battle_id: battleId, wallet: account.address.toString() }),
      })
      const data = await res.json()
      if (res.ok) {
        setTxHash(data.tx_hash)
        setState('claimed')
      } else {
        setState('claimable')
      }
    } catch {
      setState('claimable')
    }
  }

  if (state === 'none' || state === 'checking') return null

  if (state === 'claimed') {
    return (
      <div
        className="rounded-xl p-4 text-center"
        style={{
          background: 'rgba(57,255,20,0.08)',
          border: '1px solid rgba(57,255,20,0.3)',
        }}
      >
        <p className="font-semibold" style={{ color: 'var(--status-win)', fontFamily: 'var(--font-display)' }}>
          Claimed {amount} ShelbyUSD ✓
        </p>
        {txHash && (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TX: {txHash.slice(0, 16)}...
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleClaim}
      disabled={state === 'claiming'}
      className="w-full rounded-xl px-4 py-3 font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{
        fontFamily: 'var(--font-display)',
        background: 'rgba(57,255,20,0.12)',
        color: 'var(--status-win)',
        border: '1px solid rgba(57,255,20,0.4)',
      }}
    >
      {state === 'claiming' ? 'Claiming...' : `Claim ${amount.toFixed(4)} ShelbyUSD`}
    </button>
  )
}

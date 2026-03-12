'use client'

import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'

interface VoteButtonProps {
  battleId: number
  side: 'meme_a' | 'meme_b'
  disabled: boolean
  platformWallet: string
}

type VoteState = 'idle' | 'confirming' | 'signing' | 'verifying' | 'success' | 'error'

export default function VoteButton({ battleId, side, disabled, platformWallet }: VoteButtonProps) {
  const { signAndSubmitTransaction, account } = useWallet()
  const [state, setState] = useState<VoteState>('idle')
  const [error, setError] = useState('')

  const isMemeA = side === 'meme_a'
  const accentColor = isMemeA ? 'var(--accent-cyan)' : 'var(--accent-pink)'
  const accentBg = isMemeA ? 'rgba(0,229,255,0.1)' : 'rgba(255,45,120,0.1)'
  const accentBorder = isMemeA ? 'rgba(0,229,255,0.4)' : 'rgba(255,45,120,0.4)'

  const handleVote = async () => {
    if (!account) return
    setState('confirming')

    if (!confirm('Vote costs 0.1 ShelbyUSD. Proceed?')) {
      setState('idle')
      return
    }

    try {
      setState('signing')
      const response = await signAndSubmitTransaction({
        data: {
          function: '0x1::coin::transfer',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [platformWallet, 10000000],
        },
      })

      setState('verifying')
      const txHash = response.hash

      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battle_id: battleId,
          side,
          voter_wallet: account.address.toString(),
          tx_hash: txHash,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Vote failed')
      }

      setState('success')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Vote failed')
    }
  }

  if (state === 'success') {
    return (
      <button
        disabled
        className="w-full rounded-xl px-4 py-3 font-semibold text-sm"
        style={{
          background: 'rgba(57,255,20,0.1)',
          color: 'var(--status-win)',
          border: '1px solid rgba(57,255,20,0.4)',
          fontFamily: 'var(--font-display)',
        }}
      >
        Voted {isMemeA ? 'Meme A' : 'Meme B'} ✓
      </button>
    )
  }

  const label = isMemeA ? 'Vote Meme A' : 'Vote Meme B'
  const stateLabels: Record<VoteState, string> = {
    idle: label,
    confirming: 'Confirm...',
    signing: 'Sign in wallet...',
    verifying: 'Verifying...',
    success: 'Voted ✓',
    error: 'Retry',
  }

  const isLoading = ['confirming', 'signing', 'verifying'].includes(state)

  return (
    <div>
      <button
        onClick={handleVote}
        disabled={disabled || isLoading}
        className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          fontFamily: 'var(--font-display)',
          background: disabled ? 'var(--bg-elevated)' : accentBg,
          color: disabled ? 'var(--text-muted)' : accentColor,
          border: `1px solid ${disabled ? 'var(--border-default)' : accentBorder}`,
        }}
      >
        {stateLabels[state]}
      </button>
      {state === 'error' && (
        <p className="mt-1 text-xs" style={{ color: 'var(--accent-pink)' }}>{error}</p>
      )}
    </div>
  )
}

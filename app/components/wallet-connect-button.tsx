'use client'

import { useWallet } from '@aptos-labs/wallet-adapter-react'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function WalletConnectButton() {
  const { connect, disconnect, account, connected, wallets } = useWallet()

  if (connected && account) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
        style={{
          borderColor: 'var(--border-strong)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 6px var(--accent-cyan)' }}
        />
        {truncateAddress(account.address.toString())}
      </button>
    )
  }

  const hasPetra = wallets?.length > 0

  return (
    <button
      onClick={() => {
        if (hasPetra) {
          connect('Petra')
        } else {
          window.open('https://petra.app/', '_blank')
        }
      }}
      className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {hasPetra ? 'Connect Wallet' : 'Install Petra'}
    </button>
  )
}

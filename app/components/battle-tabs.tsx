'use client'

interface BattleTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  walletConnected: boolean
}

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'resolved', label: 'Ended' },
  { id: 'my', label: 'My Battles' },
]

export default function BattleTabs({ activeTab, onTabChange, walletConnected }: BattleTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-xl p-1"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
    >
      {TABS.map((tab) => {
        if (tab.id === 'my' && !walletConnected) return null
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// Mock battle data for demo mode (when Supabase is not configured)
// Votes grow over time using deterministic math so it works on stateless Vercel

const HOUR = 3600 * 1000
const DEPLOY_TIME = new Date('2026-03-13T00:00:00Z').getTime()

// Generate a random-looking hex address from a seed
function fakeWallet(seed: number): string {
  const hex = '0123456789abcdef'
  let addr = '0x'
  for (let i = 0; i < 40; i++) addr += hex[(seed * (i + 7) * 31) % 16]
  return addr
}

// Time-based vote growth: battles accumulate votes as time passes
function growingVotes(base: number, battleId: number, elapsed: number): number {
  const growthRate = 0.003 + (battleId * 0.001) // votes per second, varies per battle
  return base + Math.floor(elapsed / 1000 * growthRate)
}

// Base battle definitions
const BASE_BATTLES = [
  { id: 1, a: 'doge.jpg', b: 'pepe.jpg', baseVoters: 42, basePool: 150, hoursAgo: 2, votesA: 24, votesB: 18 },
  { id: 2, a: 'stonks.jpg', b: 'notstonks.jpg', baseVoters: 89, basePool: 320.5, hoursAgo: 5, votesA: 51, votesB: 38 },
  { id: 3, a: 'drake.jpg', b: 'chad.jpg', baseVoters: 15, basePool: 75, hoursAgo: 1, votesA: 8, votesB: 7 },
  { id: 4, a: 'grumpy.jpg', b: 'nyan.jpg', baseVoters: 67, basePool: 210, hoursAgo: 10, votesA: 30, votesB: 37 },
  { id: 5, a: 'distracted.jpg', b: 'fine.jpg', baseVoters: 134, basePool: 500, hoursAgo: 30, votesA: 82, votesB: 52, resolved: true, winner: 'a' as const },
  { id: 6, a: 'spongebob.jpg', b: 'crying.jpg', baseVoters: 91, basePool: 280, hoursAgo: 48, votesA: 40, votesB: 51, resolved: true, winner: 'b' as const },
]

// Get battles with time-based vote growth
export function getDemoBattles() {
  const now = Date.now()
  const elapsed = Math.max(0, now - DEPLOY_TIME)

  return BASE_BATTLES.map((b) => {
    const extraVotes = b.resolved ? 0 : growingVotes(0, b.id, elapsed)
    const splitA = Math.floor(extraVotes * (0.4 + (b.id * 0.05)))
    const splitB = extraVotes - splitA
    const totalVoters = b.baseVoters + extraVotes
    const pool = +(b.basePool + extraVotes * 0.1).toFixed(1)

    return {
      id: b.id,
      meme_a_blob_id: `demo-${b.id}a`,
      meme_a_blob_name: b.a,
      meme_a_creator: 'demo',
      meme_b_blob_id: `demo-${b.id}b`,
      meme_b_blob_name: b.b,
      meme_b_creator: 'demo',
      matched_at: new Date(now - b.hoursAgo * HOUR).toISOString(),
      duration: 86400,
      pool,
      total_voters: totalVoters,
      status: b.resolved ? 'resolved' : 'active',
      votes_a: b.votesA + splitA,
      votes_b: b.votesB + splitB,
      winner: b.winner ?? null,
    }
  })
}

// Generate fake recent vote entries for activity feed
export function generateFakeVotes(battleId: number, count: number) {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    voter_wallet: fakeWallet(battleId * 1000 + now + i),
    voted_at: new Date(now - i * 15000 - Math.random() * 30000).toISOString(),
  }))
}

// Check if Supabase is configured
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY
}

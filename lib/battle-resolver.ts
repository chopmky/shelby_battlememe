import { supabaseAdmin } from './supabase-server-client'
import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk'
import { aptos } from './aptos-client'

const PLATFORM_FEE_RATE = 0.01
const WINNER_CREATOR_RATE = 0.05
const LOSER_CREATOR_RATE = 0.02
const VOTER_POOL_RATE = 0.92

// Resolve a single expired battle
export async function resolveBattle(battleId: number) {
  const { data: battle, error } = await supabaseAdmin
    .from('battles')
    .select('*')
    .eq('id', battleId)
    .single()

  if (error || !battle) throw new Error(`Battle ${battleId} not found`)
  if (battle.status === 'resolved') return { skipped: true }

  // Check if expired
  const endTime = new Date(battle.matched_at).getTime() + battle.duration * 1000
  if (Date.now() < endTime) return { skipped: true, reason: 'not expired' }

  // Draw check
  if (battle.votes_a === battle.votes_b) {
    await supabaseAdmin
      .from('battles')
      .update({ status: 'draw_extended', duration: battle.duration + 3600 })
      .eq('id', battleId)
    return { extended: true }
  }

  // Determine winner
  const winner = battle.votes_a > battle.votes_b ? 'meme_a' : 'meme_b'
  const winnerCreator = winner === 'meme_a' ? battle.meme_a_creator : battle.meme_b_creator
  const loserCreator = winner === 'meme_a' ? battle.meme_b_creator : battle.meme_a_creator
  const winningVotes = winner === 'meme_a' ? battle.votes_a : battle.votes_b

  const pool = Number(battle.pool)
  const winnerCreatorReward = pool * WINNER_CREATOR_RATE
  const loserCreatorReward = pool * LOSER_CREATOR_RATE
  const voterPool = pool * VOTER_POOL_RATE
  const perVoterReward = winningVotes > 0 ? voterPool / winningVotes : 0

  // Send creator rewards via Aptos (if pool > 0 and private key available)
  const txHashes: string[] = []
  if (pool > 0 && process.env.PLATFORM_WALLET_PRIVATE_KEY) {
    try {
      const privateKey = new Ed25519PrivateKey(process.env.PLATFORM_WALLET_PRIVATE_KEY)
      const platformAccount = Account.fromPrivateKey({ privateKey })

      // These would be real ShelbyUSD transfers — simplified for hackathon
      // In production, construct proper coin transfer transactions
      console.log(`Would send ${winnerCreatorReward} to ${winnerCreator}`)
      console.log(`Would send ${loserCreatorReward} to ${loserCreator}`)
    } catch (err) {
      console.error('Creator reward tx failed:', err)
    }
  }

  // Insert creator claims as completed
  await supabaseAdmin.from('claims').insert([
    { battle_id: battleId, wallet: winnerCreator, claim_type: 'creator_win', amount: winnerCreatorReward, status: 'completed' },
    { battle_id: battleId, wallet: loserCreator, claim_type: 'creator_lose', amount: loserCreatorReward, status: 'completed' },
  ])

  // Insert pending claims for winning voters
  const { data: winningVoters } = await supabaseAdmin
    .from('votes')
    .select('voter_wallet')
    .eq('battle_id', battleId)
    .eq('side', winner)

  if (winningVoters && winningVoters.length > 0) {
    const voterClaims = winningVoters.map((v) => ({
      battle_id: battleId,
      wallet: v.voter_wallet,
      claim_type: 'voter' as const,
      amount: perVoterReward,
      status: 'pending' as const,
    }))
    await supabaseAdmin.from('claims').insert(voterClaims)
  }

  // Update battle status
  await supabaseAdmin
    .from('battles')
    .update({ status: 'resolved', winner })
    .eq('id', battleId)

  return { resolved: true, winner, pool, perVoterReward }
}

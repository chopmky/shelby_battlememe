import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'
import { verifyVoteTransaction } from '@/lib/aptos-transaction-verifier'

const VOTE_AMOUNT = 0.1
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS!

export async function POST(req: NextRequest) {
  try {
    const { battle_id, side, voter_wallet, tx_hash } = await req.json()

    if (!battle_id || !side || !voter_wallet || !tx_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['meme_a', 'meme_b'].includes(side)) {
      return NextResponse.json({ error: 'Invalid side' }, { status: 400 })
    }

    // Check battle exists and is active
    const { data: battle } = await supabaseAdmin
      .from('battles')
      .select('*')
      .eq('id', battle_id)
      .single()

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
    }
    if (battle.status === 'resolved') {
      return NextResponse.json({ error: 'Battle already resolved' }, { status: 400 })
    }

    // Check not expired
    const endTime = new Date(battle.matched_at).getTime() + battle.duration * 1000
    if (Date.now() > endTime) {
      return NextResponse.json({ error: 'Battle expired' }, { status: 400 })
    }

    // Check wallet hasn't already voted
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('battle_id', battle_id)
      .eq('voter_wallet', voter_wallet)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 })
    }

    // Check tx_hash not reused
    const { data: existingTx } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('tx_hash', tx_hash)
      .single()

    if (existingTx) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 })
    }

    // Verify Aptos transaction
    const verification = await verifyVoteTransaction(tx_hash, voter_wallet, PLATFORM_WALLET, VOTE_AMOUNT)
    if (!verification.verified) {
      return NextResponse.json({ error: `Verification failed: ${verification.reason}` }, { status: 400 })
    }

    // Insert vote
    const { data: vote, error: voteErr } = await supabaseAdmin
      .from('votes')
      .insert({ battle_id, voter_wallet, side, amount: VOTE_AMOUNT, tx_hash })
      .select()
      .single()

    if (voteErr) {
      if (voteErr.code === '23505') {
        return NextResponse.json({ error: 'Already voted' }, { status: 409 })
      }
      throw voteErr
    }

    // Update battle counters atomically
    const voteColumn = side === 'meme_a' ? 'votes_a' : 'votes_b'
    await supabaseAdmin.rpc('increment_battle_counters', {
      p_battle_id: battle_id,
      p_vote_column: voteColumn,
      p_amount: VOTE_AMOUNT,
    }).then(async (res) => {
      // Fallback if RPC doesn't exist: direct update
      if (res.error) {
        const updates: Record<string, unknown> = {
          pool: battle.pool + VOTE_AMOUNT,
          total_voters: battle.total_voters + 1,
        }
        updates[voteColumn] = battle[voteColumn as keyof typeof battle] as number + 1
        await supabaseAdmin.from('battles').update(updates).eq('id', battle_id)
      }
    })

    return NextResponse.json({ success: true, vote_id: vote.id })
  } catch (err) {
    console.error('Vote POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

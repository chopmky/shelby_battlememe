import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'

// POST: Claim voter reward
export async function POST(req: NextRequest) {
  try {
    const { battle_id, wallet } = await req.json()
    if (!battle_id || !wallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find pending claim
    const { data: claim, error } = await supabaseAdmin
      .from('claims')
      .select('*')
      .eq('battle_id', battle_id)
      .eq('wallet', wallet)
      .eq('status', 'pending')
      .single()

    if (error || !claim) {
      return NextResponse.json({ error: 'No pending claim found' }, { status: 404 })
    }

    // Send ShelbyUSD from platform wallet to voter
    // In production: construct and submit Aptos coin transfer transaction
    const txHash = `claim_${battle_id}_${wallet}_${Date.now()}`
    console.log(`Would send ${claim.amount} ShelbyUSD to ${wallet}`)

    // Update claim status
    await supabaseAdmin
      .from('claims')
      .update({ status: 'completed', tx_hash: txHash })
      .eq('id', claim.id)

    return NextResponse.json({ tx_hash: txHash, amount: claim.amount })
  } catch (err) {
    console.error('Claim error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'

// POST: Submit meme to queue + attempt matchmaking
export async function POST(req: NextRequest) {
  try {
    const { blob_id, blob_name, creator_wallet } = await req.json()
    if (!blob_id || !blob_name || !creator_wallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check: meme not already in active battle or queue
    const { data: existing } = await supabaseAdmin
      .from('queue')
      .select('id')
      .eq('blob_id', blob_id)
      .eq('status', 'waiting')
      .limit(1)
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Meme already in queue' }, { status: 409 })
    }

    // Check: wallet not exceeding 3 queue entries
    const { count } = await supabaseAdmin
      .from('queue')
      .select('id', { count: 'exact', head: true })
      .eq('creator_wallet', creator_wallet)
      .eq('status', 'waiting')
    if (count && count >= 3) {
      return NextResponse.json({ error: 'Max 3 queue entries per wallet' }, { status: 429 })
    }

    // Insert into queue
    const { data: entry, error: insertErr } = await supabaseAdmin
      .from('queue')
      .insert({ blob_id, blob_name, creator_wallet })
      .select()
      .single()
    if (insertErr) throw insertErr

    // Attempt matchmaking: find oldest waiting entry from different wallet
    const { data: match } = await supabaseAdmin
      .from('queue')
      .select('*')
      .eq('status', 'waiting')
      .neq('creator_wallet', creator_wallet)
      .neq('id', entry.id)
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single()

    if (match) {
      // Create battle
      const { data: battle, error: battleErr } = await supabaseAdmin
        .from('battles')
        .insert({
          meme_a_blob_id: match.blob_id,
          meme_a_blob_name: match.blob_name,
          meme_a_creator: match.creator_wallet,
          meme_b_blob_id: entry.blob_id,
          meme_b_blob_name: entry.blob_name,
          meme_b_creator: entry.creator_wallet,
        })
        .select()
        .single()
      if (battleErr) throw battleErr

      // Update both queue entries to matched
      await supabaseAdmin
        .from('queue')
        .update({ status: 'matched' })
        .in('id', [match.id, entry.id])

      return NextResponse.json({ status: 'matched', battle_id: battle.id })
    }

    return NextResponse.json({ status: 'waiting', queue_id: entry.id })
  } catch (err) {
    console.error('Queue POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Queue status for wallet
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('queue')
    .select('*')
    .eq('creator_wallet', wallet)
    .eq('status', 'waiting')
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// DELETE: Cancel queue entry
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id param required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('queue')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'waiting')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'

// GET: List battles with optional filters
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || 'active'
  const wallet = req.nextUrl.searchParams.get('wallet')

  let query = supabaseAdmin
    .from('battles')
    .select('id, meme_a_blob_id, meme_a_blob_name, meme_a_creator, meme_b_blob_id, meme_b_blob_name, meme_b_creator, matched_at, duration, pool, total_voters, status, winner, votes_a, votes_b')
    .order('matched_at', { ascending: false })
    .limit(50)

  if (status !== 'all') {
    if (status === 'active') {
      query = query.in('status', ['active', 'draw_extended'])
    } else {
      query = query.eq('status', status)
    }
  }

  if (wallet) {
    query = query.or(`meme_a_creator.eq.${wallet},meme_b_creator.eq.${wallet}`)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Hide vote split for active battles
  const sanitized = data?.map((b) => {
    if (b.status !== 'resolved') {
      const { votes_a, votes_b, winner, ...rest } = b
      return rest
    }
    return b
  })

  return NextResponse.json(sanitized)
}

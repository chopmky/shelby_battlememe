import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'

// GET: Vote log for a battle (no side info for active battles)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const wallet = req.nextUrl.searchParams.get('wallet')

  // If wallet param, check if this wallet has voted
  if (wallet) {
    const { data } = await supabaseAdmin
      .from('votes')
      .select('id, side, voted_at')
      .eq('battle_id', id)
      .eq('voter_wallet', wallet)
      .single()
    return NextResponse.json({ voted: !!data, vote: data })
  }

  // Return vote log without side info
  const { data, error } = await supabaseAdmin
    .from('votes')
    .select('voter_wallet, voted_at')
    .eq('battle_id', id)
    .order('voted_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

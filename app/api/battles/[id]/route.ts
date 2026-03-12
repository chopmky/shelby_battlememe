import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'
import { getDemoBattles, isDemoMode } from '@/lib/mock-battles'

// GET: Single battle detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Demo mode: return mock battle by id
  if (isDemoMode()) {
    const battle = getDemoBattles().find((b) => b.id === Number(id))
    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
    }
    if (battle.status !== 'resolved') {
      const { votes_a, votes_b, winner, ...rest } = battle
      return NextResponse.json(rest)
    }
    return NextResponse.json(battle)
  }

  const { data, error } = await supabaseAdmin
    .from('battles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
  }

  // Hide vote split for active battles
  if (data.status !== 'resolved') {
    const { votes_a, votes_b, winner, ...rest } = data
    return NextResponse.json(rest)
  }

  return NextResponse.json(data)
}

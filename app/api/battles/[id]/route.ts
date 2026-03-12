import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'

// GET: Single battle detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

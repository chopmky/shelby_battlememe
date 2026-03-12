import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server-client'
import { resolveBattle } from '@/lib/battle-resolver'

// POST: Cron endpoint to resolve expired battles
export async function POST(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find expired battles
  const { data: battles, error } = await supabaseAdmin
    .from('battles')
    .select('id, matched_at, duration')
    .in('status', ['active', 'draw_extended'])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  const expired = battles?.filter((b) => {
    const endTime = new Date(b.matched_at).getTime() + b.duration * 1000
    return now >= endTime
  }) ?? []

  const resolved: number[] = []
  const errors: { id: number; error: string }[] = []

  for (const battle of expired) {
    try {
      const result = await resolveBattle(battle.id)
      if (result.resolved) resolved.push(battle.id)
    } catch (err) {
      errors.push({ id: battle.id, error: String(err) })
    }
  }

  return NextResponse.json({ resolved, errors, checked: battles?.length ?? 0 })
}

import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase-server-client'

export const runtime = 'edge'
export const alt = 'BattleMEME'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: battle } = await supabaseAdmin
    .from('battles')
    .select('id, pool, total_voters, meme_a_blob_name, meme_b_blob_name')
    .eq('id', id)
    .single()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', color: '#facc15', marginBottom: 20 }}>
          BattleMEME #{battle?.id ?? id}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', width: 200, height: 200, backgroundColor: '#27272a', borderRadius: 16, alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            Meme A
          </div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: '#facc15' }}>VS</div>
          <div style={{ display: 'flex', width: 200, height: 200, backgroundColor: '#27272a', borderRadius: 16, alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            Meme B
          </div>
        </div>
        <div style={{ display: 'flex', gap: 30, marginTop: 24, fontSize: 20, color: '#a1a1aa' }}>
          <span>Pool: {battle?.pool ?? 0} ShelbyUSD</span>
          <span>{battle?.total_voters ?? 0} voters</span>
        </div>
      </div>
    ),
    { ...size }
  )
}

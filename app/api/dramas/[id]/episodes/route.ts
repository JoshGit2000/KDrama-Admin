import { NextRequest, NextResponse } from 'next/server'
import { getEpisodesByDramaId, addEpisodeToDrama } from '@/lib/firebase/firestore/episodes'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cacheInvalidate, CACHE_KEY_DRAMAS } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const episodes = await getEpisodesByDramaId(params.id)
    return NextResponse.json(episodes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const episode = await addEpisodeToDrama(params.id, data)

    // ── Invalidate dramas cache (totalEpisodes changed) ──────────────────────
    cacheInvalidate(CACHE_KEY_DRAMAS)
    
    return NextResponse.json(episode, { status: 201 })
  } catch (error) {
    console.error('Error adding episode:', error)
    return NextResponse.json(
      { error: 'Failed to add episode' },
      { status: 500 }
    )
  }
}
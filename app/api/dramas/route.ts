import { NextRequest, NextResponse } from 'next/server'
import { getAllDramas, createDrama } from '@/lib/firebase/firestore/dramas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cacheGet, cacheSet, cacheInvalidate, CACHE_KEY_DRAMAS } from '@/lib/cache'
import { Drama } from '@/types'

export async function GET() {
  try {
    // ── Cache check ─────────────────────────────────────────────────────────
    const cached = cacheGet<Drama[]>(CACHE_KEY_DRAMAS)
    if (cached) {
      return NextResponse.json(cached)
    }

    // ── Cache miss → fetch from Firestore ───────────────────────────────────
    const dramas = await getAllDramas()

    if (!Array.isArray(dramas)) {
      console.error('getAllDramas did not return an array:', dramas)
      return NextResponse.json([], { status: 200 })
    }

    cacheSet(CACHE_KEY_DRAMAS, dramas)
    return NextResponse.json(dramas)
  } catch (error) {
    console.error('API Error fetching dramas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dramas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.title || !data.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const drama = await createDrama(data)

    // ── Invalidate list cache so next GET fetches fresh ─────────────────────
    cacheInvalidate(CACHE_KEY_DRAMAS)

    return NextResponse.json(drama, { status: 201 })
  } catch (error) {
    console.error('API Error creating drama:', error)
    return NextResponse.json(
      { error: 'Failed to create drama' },
      { status: 500 }
    )
  }
}
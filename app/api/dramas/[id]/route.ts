import { NextRequest, NextResponse } from 'next/server'
import { getDramaById, updateDrama, deleteDrama } from '@/lib/firebase/firestore/dramas'
import { isMobileOrSessionAuthed } from '@/lib/mobile-auth'
import { cacheInvalidate, CACHE_KEY_DRAMAS } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drama = await getDramaById(params.id)
    
    if (!drama) {
      return NextResponse.json({ error: 'Drama not found' }, { status: 404 })
    }

    return NextResponse.json(drama)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch drama' },
      { status: 500 }
    )
  }
}

async function handleUpdate(request: NextRequest, id: string) {
  try {
    const authed = await isMobileOrSessionAuthed(request)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const drama = await updateDrama(id, data)

    // ── Invalidate list cache ────────────────────────────────────────────────
    cacheInvalidate(CACHE_KEY_DRAMAS)
    
    return NextResponse.json(drama)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update drama' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(request, params.id)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(request, params.id)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authed = await isMobileOrSessionAuthed(request)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteDrama(params.id)

    // ── Invalidate list cache ────────────────────────────────────────────────
    cacheInvalidate(CACHE_KEY_DRAMAS)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete drama' },
      { status: 500 }
    )
  }
}
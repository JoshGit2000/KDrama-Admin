import { NextRequest, NextResponse } from 'next/server'
import { getMovieById, updateMovie, deleteMovie } from '@/lib/firebase/firestore/movies'
import { isMobileOrSessionAuthed } from '@/lib/mobile-auth'
import { cacheInvalidate, CACHE_KEY_MOVIES } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movie = await getMovieById(params.id)
    
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    return NextResponse.json(movie)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch movie' },
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
    const movie = await updateMovie(id, data)

    // ── Invalidate list cache ────────────────────────────────────────────────
    cacheInvalidate(CACHE_KEY_MOVIES)
    
    return NextResponse.json(movie)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update movie' },
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

    await deleteMovie(params.id)

    // ── Invalidate list cache ────────────────────────────────────────────────
    cacheInvalidate(CACHE_KEY_MOVIES)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete movie' },
      { status: 500 }
    )
  }
}
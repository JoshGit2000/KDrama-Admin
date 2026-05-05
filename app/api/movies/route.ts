import { NextRequest, NextResponse } from 'next/server'
import { getAllMovies, createMovie } from '@/lib/firebase/firestore/movies'
import { isMobileOrSessionAuthed } from '@/lib/mobile-auth'
import { cacheGet, cacheSet, cacheInvalidate, CACHE_KEY_MOVIES } from '@/lib/cache'
import { Movie } from '@/types'

export async function GET() {
  try {
    // ── Cache check ─────────────────────────────────────────────────────────
    const cached = cacheGet<Movie[]>(CACHE_KEY_MOVIES)
    if (cached) {
      return NextResponse.json(cached)
    }

    // ── Cache miss → fetch from Firestore ───────────────────────────────────
    const movies = await getAllMovies()
    cacheSet(CACHE_KEY_MOVIES, movies)
    return NextResponse.json(movies)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await isMobileOrSessionAuthed(request)

    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const movie = await createMovie(data)

    // ── Invalidate list cache so next GET fetches fresh ─────────────────────
    cacheInvalidate(CACHE_KEY_MOVIES)

    return NextResponse.json(movie, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create movie' },
      { status: 500 }
    )
  }
}
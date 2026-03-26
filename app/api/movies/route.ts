import { NextRequest, NextResponse } from 'next/server'
import { getAllMovies, createMovie } from '@/lib/firebase/firestore/movies'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const movies = await getAllMovies()
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
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const movie = await createMovie(data)
    
    return NextResponse.json(movie, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create movie' },
      { status: 500 }
    )
  }
}
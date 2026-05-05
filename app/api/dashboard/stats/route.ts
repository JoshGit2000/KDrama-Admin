import { NextRequest, NextResponse } from 'next/server'
import { isMobileOrSessionAuthed } from '@/lib/mobile-auth'
import { getAllMovies } from '@/lib/firebase/firestore/movies'
import { getAllDramas } from '@/lib/firebase/firestore/dramas'
import { getAppUserCount } from '@/lib/firebase/firestore/users'
import { getAllNotifications } from '@/lib/firebase/firestore/notifications'

export async function GET(request: NextRequest) {
  const authed = await isMobileOrSessionAuthed(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [movies, dramas, totalUsers, notifications] = await Promise.all([
      getAllMovies(),
      getAllDramas(),
      getAppUserCount(),
      getAllNotifications(),
    ])

    const recentMovies = movies.slice(0, 5).map((m) => ({
      id: m.id,
      title: m.title,
      createdAt: m.createdAt,
    }))

    const recentDramas = dramas.slice(0, 5).map((d) => ({
      id: d.id,
      title: d.title,
      createdAt: d.createdAt,
    }))

    return NextResponse.json({
      totalMovies: movies.length,
      totalDramas: dramas.length,
      totalUsers,
      totalNotifications: notifications.length,
      recentMovies,
      recentDramas,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

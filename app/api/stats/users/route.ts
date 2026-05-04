import { NextResponse } from 'next/server'
import { getAppUserCount } from '@/lib/firebase/firestore/users'
import { cacheGet, cacheSet } from '@/lib/cache'

const CACHE_KEY = 'user-count'

export async function GET() {
  try {
    // Serve from cache — refreshed every 5 minutes
    const cached = cacheGet<number>(CACHE_KEY)
    if (cached !== null) {
      return NextResponse.json({ count: cached })
    }

    const count = await getAppUserCount()
    cacheSet(CACHE_KEY, count)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching user count:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}

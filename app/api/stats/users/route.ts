import { NextResponse } from 'next/server'
import { getAppUserCount } from '@/lib/firebase/firestore/users'

// Force Next.js to NEVER cache this route handler.
// Without this, App Router caches the result server-side regardless of
// Cache-Control headers — causing the stale count to persist between deploys.
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const count = await getAppUserCount()

    return NextResponse.json(
      { count },
      // Prevent Vercel's edge cache and the browser from holding a stale count
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('[Users] Error fetching count:', error)
    return NextResponse.json(
      { count: 0 },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}

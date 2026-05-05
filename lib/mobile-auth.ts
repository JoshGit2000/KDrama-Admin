import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MOBILE_SECRET = process.env.MOBILE_API_SECRET ?? 'kdrama-mobile-secret-2025'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())

/**
 * Returns true if the request is authenticated — either via:
 *  1. A valid NextAuth session (web dashboard)
 *  2. A valid mobile secret header + admin email header (mobile app)
 */
export async function isMobileOrSessionAuthed(request: NextRequest): Promise<boolean> {
  // ── Mobile app auth ───────────────────────────────────────────────────────
  const mobileSecret = request.headers.get('x-mobile-secret')
  const adminEmail = request.headers.get('x-admin-email')

  if (mobileSecret && mobileSecret === MOBILE_SECRET) {
    if (adminEmail && ADMIN_EMAILS.includes(adminEmail)) {
      return true
    }
  }

  // ── Web session auth ──────────────────────────────────────────────────────
  const session = await getServerSession(authOptions)
  return !!session
}

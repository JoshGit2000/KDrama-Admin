import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Allow access to admin routes only for authenticated users
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/movies/:path*',
    '/admin/dramas/:path*',
    '/admin/categories/:path*',
    '/admin/uploads/:path*',
  ],
}
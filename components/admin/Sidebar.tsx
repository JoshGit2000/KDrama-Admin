'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Film,
  Tv,
  Upload,
  LayoutDashboard,
  LogOut,
  Bell,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard',     href: '/admin/dashboard',     icon: LayoutDashboard },
  { name: 'Movies',        href: '/admin/movies',         icon: Film },
  { name: 'Dramas',        href: '/admin/dramas',         icon: Tv },
  { name: 'Notifications', href: '/admin/notifications',  icon: Bell },
  { name: 'Uploads',       href: '/admin/uploads',        icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
            <Tv className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-[15px] font-bold tracking-tight">K-Drama Admin</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/70 hover:text-white'
              )}
            >
              <Icon className={cn('mr-3 h-4 w-4 flex-shrink-0 transition-colors', isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300')} />
              {item.name}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile + sign out */}
      <div className="border-t border-gray-800 p-3 space-y-2">
        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-800/50">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'User'}
                width={34}
                height={34}
                className="rounded-full ring-2 ring-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="h-[34px] w-[34px] rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                {session.user.name?.charAt(0) ?? session.user.email?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">
                {session.user.name ?? 'Admin'}
              </p>
              <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white px-3 h-9"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
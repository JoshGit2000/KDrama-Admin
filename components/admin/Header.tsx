'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
      </div>

      <div className="flex items-center space-x-4">
        {session?.user && (
          <>
            <span className="text-sm text-gray-600">{session.user.email}</span>
            {session.user.image && (
              <Image
                src={session.user.image}
                alt="User"
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
          </>
        )}
      </div>
    </header>
  )
}
'use client'

import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/admin/Sidebar'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-[#F8F9FB] p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Toaster />
    </SessionProvider>
  )
}
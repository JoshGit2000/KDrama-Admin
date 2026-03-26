import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K-Drama Admin Panel',
  description: 'Admin panel for managing K-Drama streaming application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — Connect2Kehilla',
  description: 'Admin dashboard',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

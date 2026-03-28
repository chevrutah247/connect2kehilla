import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 text-center">
      <h1 className="text-7xl font-bold text-blue-900 mb-3">404</h1>
      <p className="text-xl text-gray-700 mb-2">Page Not Found</p>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Go Home
      </Link>
    </div>
  )
}

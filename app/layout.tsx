import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Connect2Kehilla — SMS Business Directory',
    template: '%s | Connect2Kehilla',
  },
  description: 'Find local Jewish community businesses instantly via SMS. Text us your need and ZIP code — get business contacts in seconds.',
  keywords: ['jewish business directory', 'sms business search', 'kehilla', 'community directory', 'frum businesses', 'jewish community', 'local business search'],
  authors: [{ name: 'Connect2Kehilla' }],
  metadataBase: new URL('https://www.connect2kehilla.com'),
  alternates: { canonical: 'https://www.connect2kehilla.com' },
  openGraph: {
    title: 'Connect2Kehilla — SMS Business Directory',
    description: 'Find local Jewish community businesses instantly via SMS.',
    url: 'https://www.connect2kehilla.com',
    siteName: 'Connect2Kehilla',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Connect2Kehilla — SMS Business Directory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect2Kehilla — SMS Business Directory',
    description: 'Find local Jewish community businesses via SMS.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Connect2Kehilla',
              url: 'https://www.connect2kehilla.com',
              description: 'SMS-based business directory for the Jewish community.',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+1-845-868-6364',
                contactType: 'customer service',
                availableLanguage: 'English',
              },
            }),
          }}
        />
        <BreadcrumbJsonLd />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is Connect2Kehilla?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Connect2Kehilla is a community platform that connects Jewish families with local kehilla resources, services, and organizations.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Connect2Kehilla free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, the platform is free for community members.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What can I find on Connect2Kehilla?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can find local Jewish organizations, community services, events, and resources in your area.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I list my organization on Connect2Kehilla?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Contact us to add your Jewish organization or service to the directory.',
                  },
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}

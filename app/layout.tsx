import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Connect2Kehilla — Kosher SMS Business Directory for the Jewish Community',
    template: '%s | Connect2Kehilla',
  },
  description: 'Find 18,000+ kosher Jewish community businesses instantly via SMS. Text (888) 516-3399 for plumbers, doctors, pharmacies, minyan times, zmanim, and more in Brooklyn, Monsey, Lakewood & all Jewish areas. Works on any phone — no internet needed.',
  keywords: [
    'kosher business directory', 'jewish sms directory', 'heimishe directory',
    'frum businesses brooklyn', 'jewish community phonebook',
    'williamsburg plumber', 'crown heights doctor', 'boro park pharmacy',
    'monsey services', 'lakewood businesses', 'kosher phone service',
    'flip phone directory', 'beis din', 'mikvah', 'shul times',
    'minyan times', 'halachic zmanim', 'kosher restaurants brooklyn',
    'hatzolah crown heights', 'shomrim', 'chaveirim',
    'sefirat haomer', 'chabad crown heights', 'satmar williamsburg',
  ],
  authors: [{ name: 'Connect2Kehilla', url: 'https://www.connect2kehilla.com' }],
  creator: 'Connect2Kehilla',
  publisher: 'Connect2Kehilla',
  metadataBase: new URL('https://www.connect2kehilla.com'),
  alternates: {
    canonical: 'https://www.connect2kehilla.com',
    languages: {
      'en-US': 'https://www.connect2kehilla.com',
      'he': 'https://www.connect2kehilla.com',
      'yi': 'https://www.connect2kehilla.com',
    },
  },
  openGraph: {
    title: 'Connect2Kehilla — Kosher SMS Business Directory',
    description: '18,000+ Jewish community businesses at your fingertips. Text (888) 516-3399 — works on any phone, no internet needed.',
    url: 'https://www.connect2kehilla.com',
    siteName: 'Connect2Kehilla',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Connect2Kehilla — SMS Business Directory for Jewish Community' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect2Kehilla — Kosher SMS Business Directory',
    description: 'Find Jewish community businesses via SMS. Text (888) 516-3399',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  category: 'Business Directory',
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
              '@graph': [
                // Organization
                {
                  '@type': 'Organization',
                  '@id': 'https://www.connect2kehilla.com/#organization',
                  name: 'Connect2Kehilla',
                  alternateName: ['C2K', 'Connect 2 Kehilla'],
                  url: 'https://www.connect2kehilla.com',
                  description: 'SMS-based business directory for the Jewish community. 18,000+ verified kosher businesses accessible from any phone. Recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the community.',
                  email: 'list@connect2kehilla.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://www.connect2kehilla.com/favicon.png',
                  },
                  sameAs: [],
                  award: 'Recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the community',
                  hasCredential: {
                    '@type': 'EducationalOccupationalCredential',
                    credentialCategory: 'Rabbinical Approval',
                    name: 'Recognition by the Beis Din of Crown Heights',
                    description:
                      'Connect2Kehilla is recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the Jewish community, maintaining the highest standards of technology use as outlined by our Rabbonim.',
                    recognizedBy: {
                      '@type': 'Organization',
                      name: 'Beis Din of Crown Heights',
                      alternateName: ['Beth Din of Crown Heights', 'Vaad Hakashrus of Crown Heights'],
                      areaServed: { '@type': 'Place', name: 'Crown Heights, Brooklyn' },
                    },
                  },
                  contactPoint: [
                    {
                      '@type': 'ContactPoint',
                      telephone: '+1-888-516-3399',
                      contactType: 'customer service',
                      availableLanguage: ['English', 'Hebrew', 'Yiddish'],
                      areaServed: 'US',
                    },
                  ],
                },
                // LocalBusiness — critical for local SEO
                {
                  '@type': 'LocalBusiness',
                  '@id': 'https://www.connect2kehilla.com/#business',
                  name: 'Connect2Kehilla SMS Directory',
                  image: 'https://www.connect2kehilla.com/opengraph-image',
                  url: 'https://www.connect2kehilla.com',
                  telephone: '+1-888-516-3399',
                  email: 'list@connect2kehilla.com',
                  priceRange: 'Free',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Brooklyn',
                    addressRegion: 'NY',
                    addressCountry: 'US',
                  },
                  areaServed: [
                    { '@type': 'City', name: 'Brooklyn' },
                    { '@type': 'Place', name: 'Williamsburg' },
                    { '@type': 'Place', name: 'Crown Heights' },
                    { '@type': 'Place', name: 'Boro Park' },
                    { '@type': 'Place', name: 'Flatbush' },
                    { '@type': 'Place', name: 'Monsey' },
                    { '@type': 'Place', name: 'Monroe' },
                    { '@type': 'Place', name: 'Kiryas Joel' },
                    { '@type': 'Place', name: 'Lakewood' },
                    { '@type': 'Place', name: 'Five Towns' },
                    { '@type': 'Place', name: 'Teaneck' },
                    { '@type': 'Place', name: 'Passaic' },
                  ],
                  openingHoursSpecification: {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    opens: '00:00',
                    closes: '23:59',
                  },
                },
                // WebSite with SearchAction — enables sitelinks searchbox + SMS action
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.connect2kehilla.com/#website',
                  url: 'https://www.connect2kehilla.com',
                  name: 'Connect2Kehilla',
                  description: 'Kosher SMS business directory for the Jewish community',
                  publisher: { '@id': 'https://www.connect2kehilla.com/#organization' },
                  inLanguage: ['en-US', 'he', 'yi'],
                  potentialAction: [
                    {
                      '@type': 'SearchAction',
                      target: {
                        '@type': 'EntryPoint',
                        urlTemplate: 'sms:+18885163399?body={search_term_string}',
                      },
                      'query-input': 'required name=search_term_string',
                    },
                  ],
                },
                // Service — SMS directory as a service
                {
                  '@type': 'Service',
                  '@id': 'https://www.connect2kehilla.com/#service',
                  serviceType: 'SMS Business Directory',
                  provider: { '@id': 'https://www.connect2kehilla.com/#organization' },
                  name: 'Kosher Business Directory via SMS',
                  description: 'Text (888) 516-3399 to find Jewish community businesses, doctors, pharmacies, minyan times, zmanim, and grocery specials. Works on any phone.',
                  areaServed: { '@id': 'https://www.connect2kehilla.com/#business' },
                  availableChannel: {
                    '@type': 'ServiceChannel',
                    serviceSmsNumber: '+1-888-516-3399',
                    availableLanguage: ['English', 'Hebrew', 'Yiddish'],
                  },
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free for SMS users',
                  },
                },
              ],
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
                    text: 'Connect2Kehilla is an SMS-based business directory for the Jewish community. Text (888) 516-3399 with what you need and your ZIP code to instantly find local kosher businesses, plumbers, doctors, pharmacies, minyan times, halachic zmanim, and more. Works on any phone — no smartphone or internet required.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I search for a business by SMS?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Text "+1 (888) 516-3399" with your request, for example: "plumber 11213" (category + ZIP code), "doctor Crown Heights" (category + area), or just a business name like "Lemofet Glass". You will get up to 5 verified businesses with phone numbers and addresses.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Connect2Kehilla free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — the SMS service is free for everyone. Standard text message rates from your carrier may apply. Business listings start free; premium placements are paid. See /pricing for details.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What areas does Connect2Kehilla serve?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We serve Brooklyn (Williamsburg, Crown Heights, Boro Park, Flatbush), Monsey, Monroe/Kiryas Joel, Lakewood, Five Towns (Cedarhurst, Lawrence), Teaneck, Passaic, Staten Island, and surrounding Jewish communities. Over 18,000 businesses in our database.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What can I find besides businesses?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Text "mincha 11225" for minyan/shul times, "zmanim 11213" for daily halachic times (sunrise, sunset, plag, Shma, Sefirat HaOmer), "SPECIALS" for grocery deals, "JOBS" for work/hiring, or "MENU" to see all options.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I list my business?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Email list@connect2kehilla.com or call (888) 516-3399. Basic listing is free. See https://www.connect2kehilla.com/add-business for details.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does Connect2Kehilla work on flip phones?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — any phone that can send SMS works, including kosher flip phones without internet. This is specifically designed for users without smartphones.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What languages are supported?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'English, Hebrew (עברית), and Yiddish (אידיש). Search queries work in all three languages.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Connect2Kehilla approved by Rabbonim?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Connect2Kehilla is proud to be recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the community. We maintain the highest standards of technology use as outlined by our Rabbonim.',
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

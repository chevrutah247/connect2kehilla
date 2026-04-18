import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — How the Kosher SMS Directory Works',
  description: 'Frequently asked questions about Connect2Kehilla. How to search by SMS, what areas we cover, how to list your business, zmanim, minyan times, and more.',
  alternates: { canonical: 'https://www.connect2kehilla.com/faq' },
  openGraph: {
    title: 'FAQ — Connect2Kehilla SMS Directory',
    description: 'How to use the kosher SMS business directory. Works on any phone.',
    url: 'https://www.connect2kehilla.com/faq',
    type: 'article',
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

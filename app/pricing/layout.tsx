import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Listing Pricing — Promote to 18,000+ Community Customers',
  description: 'List your business on Connect2Kehilla — Free basic listing or paid Premium, Standard, Specials, and Ad Boost plans. Reach kosher consumers via SMS in Brooklyn, Monsey, Lakewood and more.',
  keywords: ['business listing pricing', 'jewish community advertising', 'sms marketing', 'kosher business promotion', 'premium listing brooklyn'],
  alternates: { canonical: 'https://www.connect2kehilla.com/pricing' },
  openGraph: {
    title: 'Pricing — Connect2Kehilla Business Listings',
    description: 'Free & paid placements to reach the Jewish community via SMS.',
    url: 'https://www.connect2kehilla.com/pricing',
    type: 'website',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

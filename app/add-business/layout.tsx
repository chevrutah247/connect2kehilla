import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Your Business — Free Listing in Kosher SMS Directory',
  description: 'List your business on Connect2Kehilla — free to start. Reach 18,000+ Jewish community customers via SMS. Brooklyn, Monsey, Lakewood, Crown Heights, Williamsburg, Boro Park, Flatbush.',
  alternates: { canonical: 'https://www.connect2kehilla.com/add-business' },
  openGraph: {
    title: 'Add Your Business — Connect2Kehilla',
    description: 'Free basic listing. Reach the Jewish community via SMS.',
    url: 'https://www.connect2kehilla.com/add-business',
    type: 'website',
  },
}

export default function AddBusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Service Listing — Individual Services (Plumber, Tutor, Driver)',
  description: 'Individual service providers (plumbers, tutors, drivers, babysitters, cleaners) — add yourself to the kosher SMS directory. Reach customers in Brooklyn, Monsey, Lakewood, and beyond.',
  alternates: { canonical: 'https://www.connect2kehilla.com/add-service' },
  openGraph: {
    title: 'Add Service — Connect2Kehilla',
    description: 'List your service skills. Reach kosher customers via SMS.',
    url: 'https://www.connect2kehilla.com/add-service',
    type: 'website',
  },
}

export default function AddServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

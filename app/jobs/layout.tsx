import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jewish Community Jobs Board — Brooklyn, Monsey, Lakewood',
  description: 'Find jobs or workers in the Jewish community: babysitters, drivers, tutors, cleaners, handymen, movers, painters. Post via SMS. Free for job seekers.',
  keywords: ['jewish jobs brooklyn', 'jobs williamsburg', 'babysitter brooklyn', 'driver job jewish', 'kosher jobs', 'heimishe jobs', 'frum jobs lakewood', 'tutor monsey'],
  alternates: { canonical: 'https://www.connect2kehilla.com/jobs' },
  openGraph: {
    title: 'Jewish Community Jobs — Connect2Kehilla',
    description: 'Find or post jobs in the community via SMS.',
    url: 'https://www.connect2kehilla.com/jobs',
    type: 'website',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

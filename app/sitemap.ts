import type { MetadataRoute } from 'next'

const baseUrl = 'https://www.connect2kehilla.com'

// Static lastModified — avoid changing every build (confuses crawlers)
const LAST_MOD = new Date('2026-04-18')

const AREAS = [
  'williamsburg', 'crown-heights', 'boro-park', 'flatbush',
  'monsey', 'monroe', 'lakewood', 'five-towns', 'teaneck', 'passaic',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                 lastModified: LAST_MOD, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/faq`,        lastModified: LAST_MOD, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/pricing`,    lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/jobs`,       lastModified: LAST_MOD, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/business`,   lastModified: LAST_MOD, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/add-business`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/add-service`,  lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/privacy`,    lastModified: LAST_MOD, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,      lastModified: LAST_MOD, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const areaPages: MetadataRoute.Sitemap = AREAS.map(area => ({
    url: `${baseUrl}/${area}`,
    lastModified: LAST_MOD,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  return [...staticPages, ...areaPages]
}

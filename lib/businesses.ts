// lib/businesses.ts
// Поиск бизнесов и учёт лидов

import prisma from './db'
import { BusinessStatus } from '@prisma/client'

// ============================================
// Expand spelling variants for Hebrew transliterations
// (beis/bais/beth/bet/beit) etc.
// ============================================
function expandSpellingVariants(term: string): string[] {
  if (!term) return []
  const lower = term.toLowerCase().trim()
  const variants = new Set<string>([lower])

  // Beis/Bais/Beth/Bet/Beit interchange (Hebrew ב transliteration)
  if (/\b(beis|bais|beth|bet|beit|beys)\b/i.test(lower)) {
    for (const v of ['beis', 'bais', 'beth', 'bet', 'beit']) {
      variants.add(lower.replace(/\b(beis|bais|beth|bet|beit|beys)\b/gi, v))
    }
    // "beis din" → add "rabbinical court" as synonym if "din" present
    if (/\bdin\b/i.test(lower)) {
      variants.add('rabbinical court')
      variants.add('rabbinic court')
    }
  }

  // Shul / shull / shule
  if (/\bshul\b/i.test(lower)) {
    for (const v of ['shul', 'shull', 'shule']) {
      variants.add(lower.replace(/\bshul\b/gi, v))
    }
  }

  return Array.from(variants)
}

// ============================================
// Sponsored listings — always show first for specific keywords
// ============================================
interface SponsoredListing {
  businessName: string    // exact name match in DB
  keywords: string[]      // search terms that trigger this listing
}

const SPONSORED_LISTINGS: SponsoredListing[] = [
  {
    businessName: 'Lemofet Glass',
    keywords: [
      'plexi glass', 'plexiglass', 'shower door', 'shower doors',
      'table top', 'tabletop', 'custom glass', 'antique mirror',
      'bronze mirror', 'gray mirror', 'grey mirror', 'starphire glass',
      'starfire glass', 'shower panel', 'shower panels',
      'glass', 'mirror', 'glazer', 'glazier', 'glass_mirror',
    ],
  },
]

/**
 * Check if a search term matches a sponsored listing
 * Returns the sponsored business name or null
 */
export function getSponsoredBusiness(searchTerm: string): string | null {
  const lower = (searchTerm || '').toLowerCase().trim()
  for (const listing of SPONSORED_LISTINGS) {
    for (const keyword of listing.keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        return listing.businessName
      }
    }
  }
  return null
}

// ============================================
// Типы
// ============================================
interface SearchParams {
  category?: string | null
  zipCode?: string | null
  area?: string | null
  businessName?: string | null
  limit?: number
}

interface SearchResult {
  id: string
  name: string
  phone: string
  area: string | null
  categories: string[]
  status: BusinessStatus
}

// ============================================
// Поиск бизнесов
// ============================================
export async function searchBusinesses(params: SearchParams): Promise<SearchResult[]> {
  const { category, zipCode, area, businessName, limit = 3 } = params

  // ── Check for sponsored listing ──
  const searchTerm = category || businessName || ''
  const sponsoredName = getSponsoredBusiness(searchTerm)
  if (sponsoredName) {
    const sponsored = await prisma.business.findFirst({
      where: { isActive: true, name: { contains: sponsoredName, mode: 'insensitive' } },
      select: { id: true, name: true, phone: true, area: true, categories: true, status: true, address: true, website: true },
    })
    if (sponsored) {
      // Only show other businesses if we have a category filter (avoid random results)
      if (category) {
        const others = await prisma.business.findMany({
          where: {
            isActive: true,
            id: { not: sponsored.id },
            categories: { has: category.toLowerCase() },
            ...(zipCode ? { zipCode } : area ? { area: { contains: area, mode: 'insensitive' } } : {}),
          },
          take: limit - 1,
          orderBy: [{ status: 'desc' }, { leadCount: 'asc' }],
          select: { id: true, name: true, phone: true, area: true, categories: true, status: true, address: true, website: true },
        })
        return [sponsored, ...others]
      }
      // No category → return only sponsored (don't mix in random businesses)
      return [sponsored]
    }
  }

  // Если ищут по имени бизнеса (с expansion по вариантам написания)
  if (businessName) {
    const variants = expandSpellingVariants(businessName)
    const ZIP_TO_AREA: Record<string, string> = {
      '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
      '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
      '11230': 'Flatbush', '11210': 'Flatbush',
      '11213': 'Crown Heights', '11225': 'Crown Heights', '11203': 'Crown Heights',
      '10952': 'Monsey', '08701': 'Lakewood',
    }
    const nameClause = {
      OR: variants.map(v => ({
        name: { contains: v, mode: 'insensitive' as const }
      }))
    }
    const areaFromZip = zipCode ? ZIP_TO_AREA[zipCode] : null

    // Step 1: name match + user's area/ZIP
    let businesses: SearchResult[] = []
    if (zipCode || area) {
      const locationFilter: any[] = []
      if (zipCode) locationFilter.push({ zipCode })
      if (areaFromZip) locationFilter.push({ area: { contains: areaFromZip, mode: 'insensitive' as const } })
      if (area) locationFilter.push({ area: { contains: area, mode: 'insensitive' as const } })

      businesses = await prisma.business.findMany({
        where: {
          isActive: true,
          AND: [nameClause, { OR: locationFilter }]
        },
        take: limit,
        orderBy: [{ status: 'desc' }, { leadCount: 'asc' }],
        select: {
          id: true, name: true, phone: true, area: true,
          categories: true, status: true, address: true, website: true,
        }
      })
    }

    // Step 2: if no results in user's area, fallback to anywhere
    if (businesses.length === 0) {
      businesses = await prisma.business.findMany({
        where: { isActive: true, ...nameClause },
        take: limit,
        orderBy: [{ status: 'desc' }, { leadCount: 'asc' }],
        select: {
          id: true, name: true, phone: true, area: true,
          categories: true, status: true, address: true, website: true,
        }
      })
    }

    return businesses
  }

  // Формируем условия поиска
  const where: any = {
    isActive: true,
  }

  // Поиск по категории (через массив тегов)
  if (category) {
    where.categories = {
      has: category.toLowerCase()
    }
  }

  // Поиск по локации
  if (zipCode) {
    where.zipCode = zipCode
  } else if (area) {
    where.area = {
      contains: area,
      mode: 'insensitive'
    }
  }

  // Search with priority: PREMIUM > STANDARD > AD_BOOST > FREE
  let businesses = await prisma.business.findMany({
    where,
    take: limit,
    orderBy: [
      { status: 'desc' }, // PAID > TRIAL > FREE
      { leadCount: 'asc' } // Ротация: меньше лидов = выше
    ],
    select: {
      id: true,
      name: true,
      phone: true,
      area: true,
      categories: true,
      status: true,
    }
  })

  // If ZIP search gave 0 results, retry with area match (many businesses have null zipCode)
  if (businesses.length === 0 && zipCode && category) {
    const ZIP_TO_AREA: Record<string, string> = {
      '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
      '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
      '11230': 'Flatbush', '11210': 'Flatbush',
      '11213': 'Crown Heights', '11225': 'Crown Heights',
      '10952': 'Monsey', '08701': 'Lakewood',
    }
    const areaFromZip = ZIP_TO_AREA[zipCode]
    if (areaFromZip) {
      businesses = await prisma.business.findMany({
        where: {
          isActive: true,
          categories: { has: category.toLowerCase() },
          area: { contains: areaFromZip, mode: 'insensitive' },
        },
        take: limit,
        orderBy: [{ status: 'desc' }, { leadCount: 'asc' }],
        select: { id: true, name: true, phone: true, area: true, categories: true, status: true, address: true, website: true },
      })
    }
  }

  return businesses
}

// ============================================
// Расширенный поиск (если основной не дал результатов)
// ============================================
export async function searchBusinessesExpanded(params: SearchParams): Promise<SearchResult[]> {
  const { category, limit = 3 } = params

  // Ищем только по категории в любой локации
  if (category) {
    return prisma.business.findMany({
      where: {
        isActive: true,
        categories: {
          has: category.toLowerCase()
        }
      },
      take: limit,
      orderBy: [
        { status: 'desc' },
        { leadCount: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        phone: true,
        area: true,
        categories: true,
        status: true,
        address: true,
        website: true,
      }
    })
  }

  return []
}

// ============================================
// Fuzzy поиск (допуск ошибок, частичное совпадение)
// ============================================
export async function searchBusinessesFuzzy(params: SearchParams): Promise<SearchResult[]> {
  const { category, businessName, zipCode, area, limit = 3 } = params

  const where: any = { isActive: true }

  // Location filter (if provided)
  if (zipCode) {
    where.zipCode = zipCode
  } else if (area) {
    where.area = { contains: area, mode: 'insensitive' }
  }

  // Try partial category match (any tag that CONTAINS the search term)
  // Expand spelling variants (beis/bais/beth/bet/beit → all tried)
  if (category) {
    const variants = expandSpellingVariants(category)
    where.OR = variants.flatMap(v => [
      { categoryRaw: { contains: v, mode: 'insensitive' as const } },
      { name: { contains: v, mode: 'insensitive' as const } },
    ])
  }

  if (businessName) {
    // Split name into words and search for any word match (across all spelling variants)
    const variants = expandSpellingVariants(businessName)
    const allWords = new Set<string>()
    for (const v of variants) {
      v.split(/\s+/).filter(w => w.length > 2).forEach(w => allWords.add(w))
    }
    if (allWords.size > 0) {
      where.OR = Array.from(allWords).map(word => ({
        name: { contains: word, mode: 'insensitive' as const }
      }))
    }
  }

  return prisma.business.findMany({
    where,
    take: limit,
    orderBy: [
      { status: 'desc' },
      { leadCount: 'asc' }
    ],
    select: {
      id: true,
      name: true,
      phone: true,
      area: true,
      categories: true,
      status: true,
    }
  })
}

// ============================================
// Записать выдачу лидов
// ============================================
export async function recordLeads(
  queryId: string,
  userId: string,
  businessIds: string[]
): Promise<void> {
  // Создаём записи лидов + батчим обновление счётчиков одним запросом
  const now = new Date()
  await Promise.all([
    prisma.lead.createMany({
      data: businessIds.map((businessId, index) => ({
        queryId,
        userId,
        businessId,
        position: index + 1,
      }))
    }),
    prisma.business.updateMany({
      where: { id: { in: businessIds } },
      data: {
        leadCount: { increment: 1 },
        lastLeadAt: now,
      }
    }),
  ])
}

// ============================================
// Получить статистику бизнеса
// ============================================
export async function getBusinessStats(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: {
        select: { leads: true }
      }
    }
  })

  if (!business) return null

  // Лиды за последний месяц
  const monthAgo = new Date()
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const recentLeads = await prisma.lead.count({
    where: {
      businessId,
      createdAt: { gte: monthAgo }
    }
  })

  return {
    totalLeads: business._count.leads,
    recentLeads,
    status: business.status,
    lastLeadAt: business.lastLeadAt,
  }
}

// ============================================
// Получить бизнесы для рассылки уведомлений
// (те, кто получил лиды, но не оплатил)
// ============================================
export async function getBusinessesForNotification(): Promise<Array<{
  id: string
  name: string
  phone: string
  leadCount: number
}>> {
  const monthAgo = new Date()
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  return prisma.business.findMany({
    where: {
      status: 'FREE',
      leadCount: { gt: 0 },
      lastLeadAt: { gte: monthAgo }
    },
    select: {
      id: true,
      name: true,
      phone: true,
      leadCount: true,
    },
    orderBy: {
      leadCount: 'desc'
    }
  })
}

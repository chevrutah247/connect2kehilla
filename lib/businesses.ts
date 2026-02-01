// lib/businesses.ts
// Поиск бизнесов и учёт лидов

import prisma from './db'
import { BusinessStatus } from '@prisma/client'

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

  // Если ищут по имени бизнеса
  if (businessName) {
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
        name: {
          contains: businessName,
          mode: 'insensitive'
        }
      },
      take: limit,
      orderBy: [
        { status: 'desc' }, // PAID первыми
        { leadCount: 'asc' } // Меньше лидов = выше приоритет (ротация)
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

  // Выполняем поиск с приоритетом PAID
  const businesses = await prisma.business.findMany({
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
      }
    })
  }

  return []
}

// ============================================
// Записать выдачу лидов
// ============================================
export async function recordLeads(
  queryId: string,
  userId: string,
  businessIds: string[]
): Promise<void> {
  // Создаём записи лидов
  await prisma.lead.createMany({
    data: businessIds.map((businessId, index) => ({
      queryId,
      userId,
      businessId,
      position: index + 1,
    }))
  })

  // Обновляем счётчики у бизнесов
  for (const businessId of businessIds) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        leadCount: { increment: 1 },
        lastLeadAt: new Date(),
      }
    })
  }
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

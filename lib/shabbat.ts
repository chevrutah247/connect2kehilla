// lib/shabbat.ts
// Проверка времени Шаббата через HebCal API

import prisma from './db'
import { lookupZip, DEFAULT_LOCATION } from './locations'

// ============================================
// Типы
// ============================================
interface ShabbatTimes {
  candleLighting: Date
  havdalah: Date
  isShabbat: boolean
}

interface HebCalItem {
  title: string
  date: string
  category: string
}

interface HebCalResponse {
  items: HebCalItem[]
}

// ============================================
// Получить время Шаббата через HebCal API
// ============================================
export async function getShabbatTimes(zipCode?: string): Promise<ShabbatTimes> {
  const location = lookupZip(zipCode) ?? DEFAULT_LOCATION

  try {
    // HebCal API - получаем времена на ближайшие 7 дней
    const url = new URL('https://www.hebcal.com/shabbat')
    url.searchParams.set('cfg', 'json')
    url.searchParams.set('geo', 'pos')
    url.searchParams.set('latitude', location.lat.toString())
    url.searchParams.set('longitude', location.lng.toString())
    url.searchParams.set('tzid', location.tzid)
    url.searchParams.set('m', '18') // 18 минут до захода (стандарт)

    const response = await fetch(url.toString())
    const data: HebCalResponse = await response.json()

    let candleLighting: Date | null = null
    let havdalah: Date | null = null

    for (const item of data.items) {
      if (item.category === 'candles') {
        candleLighting = new Date(item.date)
      } else if (item.category === 'havdalah') {
        havdalah = new Date(item.date)
      }
    }

    // Проверяем, сейчас ли Шаббат
    const now = new Date()
    const isShabbat = !!(
      candleLighting && 
      havdalah && 
      now >= candleLighting && 
      now <= havdalah
    )

    return {
      candleLighting: candleLighting || new Date(),
      havdalah: havdalah || new Date(),
      isShabbat,
    }

  } catch (error) {
    console.error('HebCal API error:', error)
    // Fallback - проверяем по дню недели (грубая проверка)
    return getFallbackShabbatCheck()
  }
}

// ============================================
// Fallback проверка (если API недоступен)
// ============================================
function getFallbackShabbatCheck(): ShabbatTimes {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  // Грубая проверка: пятница после 17:00 или суббота до 21:00
  const isShabbat = 
    (day === 5 && hour >= 17) || // Пятница вечер
    (day === 6 && hour < 21)     // Суббота до вечера

  return {
    candleLighting: new Date(),
    havdalah: new Date(),
    isShabbat,
  }
}

// ============================================
// Быстрая проверка "сейчас Шаббат?"
// ============================================
export async function isCurrentlyShabbat(zipCode?: string): Promise<boolean> {
  const times = await getShabbatTimes(zipCode)
  return times.isShabbat
}

// ============================================
// Проверка с буфером (20 минут до начала)
// ============================================
export async function isShabbatWithBuffer(zipCode?: string): Promise<boolean> {
  const times = await getShabbatTimes(zipCode)
  const now = new Date()
  
  // Добавляем 20 минут буфера до зажигания свечей
  const bufferStart = new Date(times.candleLighting.getTime() - 20 * 60 * 1000)
  
  return now >= bufferStart && now <= times.havdalah
}

// ============================================
// Сохранить/обновить расписание в базе
// ============================================
export async function updateShabbatSchedule(zipCode: string): Promise<void> {
  const times = await getShabbatTimes(zipCode)
  
  await prisma.shabbatSchedule.upsert({
    where: { zipCode },
    update: {
      candleLighting: times.candleLighting,
      havdalah: times.havdalah,
    },
    create: {
      zipCode,
      candleLighting: times.candleLighting,
      havdalah: times.havdalah,
    },
  })
}

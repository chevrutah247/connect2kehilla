// lib/shabbat.ts
// Проверка времени Шаббата через HebCal API

import prisma from './db'

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
// ZIP к координатам (основные районы)
// ============================================
const ZIP_TO_LOCATION: Record<string, { lat: number; lng: number; city: string }> = {
  // Brooklyn
  '11211': { lat: 40.7081, lng: -73.9571, city: 'Williamsburg' },
  '11249': { lat: 40.7081, lng: -73.9571, city: 'Williamsburg' },
  '11219': { lat: 40.6328, lng: -73.9876, city: 'Borough Park' },
  '11230': { lat: 40.6197, lng: -73.9653, city: 'Flatbush' },
  '11213': { lat: 40.6694, lng: -73.9422, city: 'Crown Heights' },
  
  // Monsey / Rockland
  '10952': { lat: 41.1112, lng: -74.0687, city: 'Monsey' },
  
  // Lakewood
  '08701': { lat: 40.0960, lng: -74.2177, city: 'Lakewood' },
  
  // Five Towns
  '11516': { lat: 40.6318, lng: -73.7240, city: 'Cedarhurst' },
  '11559': { lat: 40.6157, lng: -73.7260, city: 'Lawrence' },
  
  // New Jersey
  '07666': { lat: 40.8876, lng: -74.0159, city: 'Teaneck' },
  '07055': { lat: 40.8568, lng: -74.1285, city: 'Passaic' },
}

// Дефолт — Нью-Йорк
const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.0060, city: 'New York' }

// ============================================
// Получить время Шаббата через HebCal API
// ============================================
export async function getShabbatTimes(zipCode?: string): Promise<ShabbatTimes> {
  const location = zipCode && ZIP_TO_LOCATION[zipCode] 
    ? ZIP_TO_LOCATION[zipCode] 
    : DEFAULT_LOCATION

  try {
    // HebCal API - получаем времена на ближайшие 7 дней
    const url = new URL('https://www.hebcal.com/shabbat')
    url.searchParams.set('cfg', 'json')
    url.searchParams.set('geo', 'pos')
    url.searchParams.set('latitude', location.lat.toString())
    url.searchParams.set('longitude', location.lng.toString())
    url.searchParams.set('tzid', 'America/New_York')
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

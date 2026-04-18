// lib/is-shabbat.ts
// Быстрая локальная проверка "сейчас шаббат?" через @hebcal/core.
// Не делает сетевых запросов — считает время заката математически.
// Используется в /api/sms GET (keep-warm), чтобы не пинговать Neon в шаббат.

import { GeoLocation, Zmanim } from '@hebcal/core'

// NYC — приблизительный центр основной аудитории
// (Crown Heights / Williamsburg / BP — заход солнца отличается на ~1-2 мин,
// для keep-warm этого более чем достаточно)
const NYC = new GeoLocation('NYC', 40.7128, -74.0060, 0, 'America/New_York')

// Буферы для безопасности
const CANDLE_LIGHTING_BUFFER_MIN = 20   // стандартный буфер до заката (зажигание свечей)
const HAVDALAH_BUFFER_MIN = 72          // консервативный havdalah (R'Tam)

function nycWeekday(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(now)
}

/**
 * Возвращает true если в NYC сейчас шаббат:
 *  - С пятницы за 20 мин до заката
 *  - До субботы +72 мин после заката (havdalah R'Tam)
 *
 * Считает закат локально для сегодняшнего дня — работает для любого года.
 */
export function isShabbatNow(now: Date = new Date()): boolean {
  const dow = nycWeekday(now)
  if (dow !== 'Fri' && dow !== 'Sat') return false

  try {
    const zmanim = new Zmanim(NYC, now, false)
    const sunset = zmanim.sunset()
    if (!sunset) return false

    if (dow === 'Fri') {
      const shabbatStart = new Date(sunset.getTime() - CANDLE_LIGHTING_BUFFER_MIN * 60_000)
      return now >= shabbatStart
    } else {
      // Saturday
      const shabbatEnd = new Date(sunset.getTime() + HAVDALAH_BUFFER_MIN * 60_000)
      return now <= shabbatEnd
    }
  } catch {
    // Если hebcal упал — fallback на грубую проверку (пт после 18:00 — сб до 21:00 EDT)
    const hour = parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour: 'numeric', hour12: false,
    }).format(now), 10)
    if (dow === 'Fri' && hour >= 18) return true
    if (dow === 'Sat' && hour < 21) return true
    return false
  }
}

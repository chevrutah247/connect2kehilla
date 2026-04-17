// lib/zmanim.ts
// Daily halachic zmanim (prayer times) via @hebcal/core
// Local calculation — no API latency

import { GeoLocation, Zmanim } from '@hebcal/core'

// ============================================
// ZIP → coordinates (shared with shabbat.ts)
// ============================================
const ZIP_TO_LOCATION: Record<string, { lat: number; lng: number; city: string }> = {
  // Brooklyn
  '11211': { lat: 40.7081, lng: -73.9571, city: 'Williamsburg' },
  '11249': { lat: 40.7081, lng: -73.9571, city: 'Williamsburg' },
  '11206': { lat: 40.7010, lng: -73.9430, city: 'Williamsburg' },
  '11205': { lat: 40.6945, lng: -73.9656, city: 'Williamsburg' },
  '11219': { lat: 40.6328, lng: -73.9876, city: 'Borough Park' },
  '11204': { lat: 40.6188, lng: -73.9847, city: 'Borough Park' },
  '11218': { lat: 40.6432, lng: -73.9772, city: 'Borough Park' },
  '11230': { lat: 40.6197, lng: -73.9653, city: 'Flatbush' },
  '11210': { lat: 40.6270, lng: -73.9530, city: 'Flatbush' },
  '11213': { lat: 40.6694, lng: -73.9422, city: 'Crown Heights' },
  '11225': { lat: 40.6610, lng: -73.9540, city: 'Crown Heights' },
  '11203': { lat: 40.6497, lng: -73.9360, city: 'Crown Heights' },
  // Monsey / Rockland
  '10952': { lat: 41.1112, lng: -74.0687, city: 'Monsey' },
  '10977': { lat: 41.1180, lng: -74.0300, city: 'Spring Valley' },
  '10950': { lat: 41.3310, lng: -74.1855, city: 'Monroe' },
  // Lakewood
  '08701': { lat: 40.0960, lng: -74.2177, city: 'Lakewood' },
  // Five Towns
  '11516': { lat: 40.6318, lng: -73.7240, city: 'Cedarhurst' },
  '11559': { lat: 40.6157, lng: -73.7260, city: 'Lawrence' },
  // NJ
  '07666': { lat: 40.8876, lng: -74.0159, city: 'Teaneck' },
  '07055': { lat: 40.8568, lng: -74.1285, city: 'Passaic' },
}

const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.0060, city: 'New York' }

// ============================================
// Format time as "7:23 AM"
// ============================================
function fmtTime(date: Date | null): string {
  if (!date) return '--:--'
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })
}

// ============================================
// Calculate daily zmanim for a ZIP code
// ============================================
export interface DailyZmanim {
  date: Date
  location: string
  alotHaShachar: Date | null
  sunrise: Date | null
  sofZmanShma: Date | null
  sofZmanTfilla: Date | null
  chatzot: Date | null
  minchaGedola: Date | null
  plagHaMincha: Date | null
  sunset: Date | null
  tzeit: Date | null
}

export function getDailyZmanim(zipCode?: string): DailyZmanim {
  const loc = (zipCode && ZIP_TO_LOCATION[zipCode]) || DEFAULT_LOCATION
  const gloc = new GeoLocation(loc.city, loc.lat, loc.lng, 0, 'America/New_York')
  const today = new Date()
  const z = new Zmanim(gloc, today, false)

  return {
    date: today,
    location: loc.city,
    alotHaShachar: z.alotHaShachar(),
    sunrise: z.sunrise(),
    sofZmanShma: z.sofZmanShma(),
    sofZmanTfilla: z.sofZmanTfilla(),
    chatzot: z.chatzot(),
    minchaGedola: z.minchaGedola(),
    plagHaMincha: z.plagHaMincha(),
    sunset: z.sunset(),
    tzeit: z.tzeit(8.5),
  }
}

// ============================================
// Format zmanim for SMS (~2 segments)
// ============================================
export function formatZmanimForSMS(zipCode?: string): string {
  const z = getDailyZmanim(zipCode)
  const dayName = z.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })

  return `🕐 Zmanim — ${z.location}
${dayName}

עלות Dawn: ${fmtTime(z.alotHaShachar)}
הנץ Sunrise: ${fmtTime(z.sunrise)}
סוף ק״ש Shma: ${fmtTime(z.sofZmanShma)}
סוף תפילה Tfilla: ${fmtTime(z.sofZmanTfilla)}
חצות Midday: ${fmtTime(z.chatzot)}
מנחה גדולה Mincha: ${fmtTime(z.minchaGedola)}
פלג Plag: ${fmtTime(z.plagHaMincha)}
שקיעה Sunset: ${fmtTime(z.sunset)}
צאת Nightfall: ${fmtTime(z.tzeit)}

Reply MENU for options.`
}

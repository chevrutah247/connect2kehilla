// lib/locations.ts
// Single source of truth for ZIP → location lookup.
// Previously each of zmanim.ts / shabbat.ts / jewish-calendar.ts had
// its own hardcoded ~20 ZIP table — those covered only NY/NJ Jewish
// communities and silently fell back to NYC for anything else.
//
// Now backed by the `zipcodes` package (all ~41k US ZIPs offline)
// plus `tz-lookup` (lat/lng → IANA timezone, offline). Returns null
// for unknown ZIPs so callers can surface a proper "not supported"
// message instead of pretending the query worked.

// `zipcodes` ships only CJS. Bringing it in via require keeps the
// types loose (no @types package), which is fine for our narrow use.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const zipcodes = require('zipcodes') as {
  lookup: (zip: string) => {
    zip: string
    latitude: number
    longitude: number
    city: string
    state: string
    country: string
  } | null
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tzlookup = require('tz-lookup') as (lat: number, lng: number) => string

export interface LocationInfo {
  zip: string
  lat: number
  lng: number
  city: string
  state: string           // "NY", "CA", ...
  tzid: string            // IANA timezone, e.g. "America/New_York"
}

// Default fallback for callers that absolutely need a location
// (shouldn't happen in normal flow — prefer surfacing null upstream).
export const DEFAULT_LOCATION: LocationInfo = {
  zip: '11213',
  lat: 40.6694,
  lng: -73.9422,
  city: 'Crown Heights',
  state: 'NY',
  tzid: 'America/New_York',
}

/**
 * Look up a US ZIP code. Returns null if not recognised.
 *
 * Accepts 5-digit strings; anything else returns null without
 * touching the underlying lookup table.
 */
export function lookupZip(zip: string | null | undefined): LocationInfo | null {
  if (!zip) return null
  const trimmed = String(zip).trim()
  if (!/^\d{5}$/.test(trimmed)) return null
  try {
    const row = zipcodes.lookup(trimmed)
    if (!row || typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
      return null
    }
    const tzid = tzlookup(row.latitude, row.longitude)
    return {
      zip: row.zip,
      lat: row.latitude,
      lng: row.longitude,
      city: row.city,
      state: row.state,
      tzid,
    }
  } catch {
    return null
  }
}

/**
 * Same as lookupZip but returns DEFAULT_LOCATION instead of null.
 * Use only where a location is structurally required (e.g. legacy
 * code paths that can't handle null).
 */
export function lookupZipOrDefault(zip: string | null | undefined): LocationInfo {
  return lookupZip(zip) ?? DEFAULT_LOCATION
}

// GET /api/specials
// Public JSON feed of all store specials — consumed by the crownheightsgroups
// site and any other client that wants current prices.
//
// Query params:
//   ?area=Williamsburg    — filter by area
//   ?zip=11213            — filter by ZIP
//   ?storeId=foodex       — single store
//
// Response:
//   { updatedAt, stores: [{ id, name, area, zips, address, phone, hours, webUrl, scrapedAt, specials: [...] }] }

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllStores,
  getStoresByArea,
  getStoresByZip,
  getStoreById,
  fetchStoreSpecials,
  type Store,
} from '@/lib/specials';

export const runtime = 'nodejs';
export const revalidate = 300; // 5 min CDN cache

function pickStores(params: URLSearchParams): Store[] {
  const id = params.get('storeId');
  if (id) {
    const s = getStoreById(id);
    return s ? [s] : [];
  }
  const area = params.get('area');
  if (area) return getStoresByArea(area);
  const zip = params.get('zip');
  if (zip) return getStoresByZip(zip);
  return getAllStores();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stores = pickStores(searchParams);

  const data = await Promise.all(stores.map(async (s) => {
    const specials = await fetchStoreSpecials(s);
    return {
      id: s.id,
      name: s.name,
      area: s.area,
      zips: s.zips,
      address: s.address ?? null,
      phone: s.phone ?? null,
      hours: s.hours ?? null,
      webUrl: s.webUrl,
      specials,
    };
  }));

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    count: data.length,
    stores: data,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

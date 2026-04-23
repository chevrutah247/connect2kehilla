// POST /api/update-specials
// Called by the GitHub Actions scraper to push fresh store specials into Postgres.
// Protected by SCRAPER_SECRET (set as env var in Vercel + as a GitHub secret).
//
// Body:
//   { "storeId": "foodex", "items": [{ name, price, oldPrice, category }, ...], "validUntil"?: "2026-04-28" }
//
// Or batch:
//   { "batch": [{ "storeId": ..., "items": [...], "validUntil": ... }, ...] }

import { NextRequest, NextResponse } from 'next/server';
import { upsertStoreSpecials, getStoreById, type Special } from '@/lib/specials';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Payload {
  storeId: string;
  items: Special[];
  validUntil?: string | null;
}

function isValidItem(x: unknown): x is Special {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === 'string'
    && typeof o.price === 'string'
    && (o.oldPrice === null || typeof o.oldPrice === 'string')
    && typeof o.category === 'string';
}

async function applyPayload(p: Payload): Promise<{ storeId: string; accepted: number; error?: string }> {
  if (!p.storeId || !Array.isArray(p.items)) {
    return { storeId: p.storeId ?? '?', accepted: 0, error: 'invalid payload shape' };
  }
  if (!getStoreById(p.storeId)) {
    return { storeId: p.storeId, accepted: 0, error: 'unknown storeId' };
  }
  const clean = p.items.filter(isValidItem);
  const validUntil = p.validUntil ? new Date(p.validUntil) : undefined;
  await upsertStoreSpecials(p.storeId, clean, { validUntil });
  return { storeId: p.storeId, accepted: clean.length };
}

export async function POST(request: NextRequest) {
  const expected = process.env.SCRAPER_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'SCRAPER_SECRET not configured' }, { status: 500 });
  }
  const provided = request.headers.get('authorization')?.replace('Bearer ', '')
    ?? request.headers.get('x-scraper-secret')
    ?? '';
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const payloads: Payload[] = Array.isArray((body as any)?.batch)
    ? (body as any).batch
    : [body as Payload];

  const results = await Promise.all(payloads.map(applyPayload));
  const ok = results.every(r => !r.error);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 207 });
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Public endpoint — returns current (non-expired) specials
// Query params:
//   ?storeId=kahans          — single store
//   ?area=Crown+Heights      — all stores in an area
//   (no params)              — all stores
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  const area = searchParams.get('area');

  const now = new Date();

  const where: Record<string, unknown> = {
    expiresAt: { gt: now },
  };

  if (storeId) where.storeId = storeId;
  else if (area) where.area = { equals: area, mode: 'insensitive' };

  const specials = await prisma.storeSpecial.findMany({
    where,
    orderBy: [{ storeId: 'asc' }, { name: 'asc' }],
    select: {
      storeId: true,
      storeName: true,
      area: true,
      name: true,
      price: true,
      oldPrice: true,
      category: true,
      scrapedAt: true,
    },
  });

  // Group by store
  const byStore: Record<string, {
    storeId: string;
    storeName: string;
    area: string | null;
    scrapedAt: Date;
    specials: { name: string; price: string; oldPrice: string | null; category: string | null }[];
  }> = {};

  for (const s of specials) {
    if (!byStore[s.storeId]) {
      byStore[s.storeId] = {
        storeId: s.storeId,
        storeName: s.storeName,
        area: s.area,
        scrapedAt: s.scrapedAt,
        specials: [],
      };
    }
    byStore[s.storeId].specials.push({
      name: s.name,
      price: s.price,
      oldPrice: s.oldPrice,
      category: s.category,
    });
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    storeCount: Object.keys(byStore).length,
    totalItems: specials.length,
    stores: Object.values(byStore),
  });
}

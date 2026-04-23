import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface IncomingSpecial {
  name: string;
  price: string;
  oldPrice?: string | null;
  category?: string;
}

interface UpdatePayload {
  storeId: string;
  storeName: string;
  area?: string;
  specials: IncomingSpecial[];
  scrapedAt?: string;
}

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  const key = req.headers.get('x-api-key');
  return key === secret;
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UpdatePayload | UpdatePayload[];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payloads = Array.isArray(body) ? body : [body];
  const results: Record<string, number> = {};

  const now = new Date();
  const eightDays = 8 * 24 * 60 * 60 * 1000;

  for (const payload of payloads) {
    const { storeId, storeName, area, specials, scrapedAt } = payload;

    if (!storeId || !storeName || !Array.isArray(specials)) {
      return NextResponse.json(
        { error: `Invalid payload for store: ${storeId}` },
        { status: 400 }
      );
    }

    const scraped = scrapedAt ? new Date(scrapedAt) : now;
    const expires = new Date(scraped.getTime() + eightDays);

    // Replace all specials for this store atomically
    await prisma.$transaction([
      prisma.storeSpecial.deleteMany({ where: { storeId } }),
      prisma.storeSpecial.createMany({
        data: specials.map((s) => ({
          storeId,
          storeName,
          area: area ?? null,
          name: s.name,
          price: s.price,
          oldPrice: s.oldPrice ?? null,
          category: s.category ?? null,
          scrapedAt: scraped,
          expiresAt: expires,
        })),
      }),
    ]);

    results[storeId] = specials.length;
  }

  return NextResponse.json({ ok: true, results });
}

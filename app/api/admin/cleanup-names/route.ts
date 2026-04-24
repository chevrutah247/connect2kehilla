// Admin one-off: чистим мусор в поле Business.name
//
// Что убираем:
//   1) Для RESIDENTIAL записей (categories содержит 'residential'):
//      Ведущий "<digits> " (любые цифры + пробел) — артефакт JBD-импорта,
//      где r.title содержал family-size "1"/"3"/"6"/... ("3 Anshel BABAD" → "Anshel BABAD").
//      Безопасно: в residential-именах цифра в начале никогда не легитимна.
//   2) Для BUSINESS записей (default):
//      Только literal "1 " — консервативно, чтобы не сломать "13th Ave Home Center",
//      "5 Star Photo", "11219 Plumbing" и т.п.
//   3) Множественные пробелы в середине → один пробел
//   4) Leading/trailing whitespace
//
// Точки/запятые в именах НЕ трогаем (по запросу — "1 . COLEMAN" → ". COLEMAN").
//
// Usage:
//   GET /api/admin/cleanup-names?dry=1    — DRY RUN: отчёт без изменений
//   GET /api/admin/cleanup-names          — EXECUTE: применить изменения
//
// Auth: Bearer <CRON_SECRET> или <ADMIN_PASSWORD>
//
//   curl -L -H "Authorization: Bearer $CRON_SECRET" \
//     https://www.connect2kehilla.com/api/admin/cleanup-names?dry=1

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const adminPass = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET
  return Boolean(adminPass && token === adminPass)
}

// ============================================
// Функция очистки одного имени
// Возвращает очищенную строку + список применённых правил
//
// КОНСЕРВАТИВНО: режем ТОЛЬКО явные JBD-артефакты, не трогаем легитимные
// названия типа "13th Ave Home Center", "5 Star Photo", "11219 Plumbing".
// ============================================
function cleanName(raw: string, categories: string[] = []): { clean: string; applied: string[] } {
  let s = raw
  const applied: string[] = []
  const isResidential = categories.includes('residential')

  // 1) Ведущий цифровой префикс — артефакт JBD-импорта, где r.title
  //    содержал family-size ("1 ADLER", "3 Anshel BABAD", "6 Fishel MORGENSTERN").
  //    Для residential: снимаем ЛЮБЫЕ цифры + пробел — безопасно, в именах людей
  //    цифровой префикс никогда не легитимен.
  //    Для business: только literal "1 " — консервативно (не ломаем "13th Ave",
  //    "5 Star Photo", "11219 Plumbing").
  //    Применяется многократно для случаев "1 1 NAME" (повторный артефакт).
  if (isResidential) {
    // Strip any leading digits + single space, repeat for "3 1 NAME" edge cases.
    while (/^\d+\s/.test(s)) {
      s = s.replace(/^\d+\s/, '')
      if (!applied.includes('digit-prefix')) applied.push('digit-prefix')
    }
  } else {
    while (s.startsWith('1 ')) {
      s = s.slice(2)
      if (!applied.includes('one-prefix')) applied.push('one-prefix')
    }
  }

  // 2) Множественные пробелы внутри → один
  if (/\s{2,}/.test(s)) {
    s = s.replace(/\s{2,}/g, ' ')
    applied.push('collapse-spaces')
  }

  // 3) Trim
  const trimmed = s.trim()
  if (trimmed !== s) {
    s = trimmed
    applied.push('trim')
  }

  return { clean: s, applied }
}

// ============================================
// GET handler
// ============================================
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dry = request.nextUrl.searchParams.get('dry') === '1'

  // Загружаем ВСЕ имена (без пагинации — операция one-off,
  // в базе пара десятков тысяч записей, влезет в память).
  // categories нужен чтобы применять агрессивную digit-strip только к residential.
  const rows = await prisma.business.findMany({
    select: { id: true, name: true, categories: true },
  })

  let changedCount = 0
  const ruleCounts: Record<string, number> = {}
  const samples: Array<{ id: string; before: string; after: string; rules: string[] }> = []
  const updates: Array<{ id: string; name: string }> = []

  for (const row of rows) {
    const { clean, applied } = cleanName(row.name, row.categories)
    if (clean !== row.name && clean.length > 0) {
      changedCount++
      for (const rule of applied) {
        ruleCounts[rule] = (ruleCounts[rule] || 0) + 1
      }
      if (samples.length < 20) {
        samples.push({ id: row.id, before: row.name, after: clean, rules: applied })
      }
      updates.push({ id: row.id, name: clean })
    }
  }

  if (dry) {
    return NextResponse.json({
      mode: 'DRY RUN — no changes applied',
      totalRows: rows.length,
      affectedRows: changedCount,
      ruleCounts,
      sample20: samples,
    })
  }

  // EXECUTE: батчим апдейты пачками по 500 в транзакции
  const BATCH = 500
  let applied = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH)
    await prisma.$transaction(
      chunk.map((u) =>
        prisma.business.update({
          where: { id: u.id },
          data: { name: u.name },
        })
      )
    )
    applied += chunk.length
  }

  return NextResponse.json({
    mode: 'APPLIED',
    totalRows: rows.length,
    updatedRows: applied,
    ruleCounts,
    sample20: samples,
  })
}

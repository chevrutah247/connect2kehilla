// Admin one-off: чистим мусор в поле Business.name
//
// Что убираем:
//   1) Ведущий "<digits> " — артефакт импорта JBD ("1 ADLER" → "ADLER")
//   2) Ведущий "<digits>. " или "<digits>) " — варианты нумерации
//   3) Ведущие знаки пунктуации после цифр (. , ; :) — "1 . COLEMAN" → "COLEMAN"
//   4) Ведущие bullet-символы (• · * -) — если остались от импорта
//   5) Множественные пробелы в середине → один пробел
//   6) Leading/trailing whitespace
//
// Usage:
//   GET /api/admin/cleanup-names?dry=1    — DRY RUN: отчёт без изменений
//   GET /api/admin/cleanup-names          — EXECUTE: применить изменения
//
// Auth: Bearer <CRON_SECRET> или <ADMIN_PASSWORD>
//
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     https://connect2kehilla.com/api/admin/cleanup-names?dry=1

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
// ============================================
export function cleanName(raw: string): { clean: string; applied: string[] } {
  let s = raw
  const applied: string[] = []

  // 1) Ведущие цифры с необязательным разделителем и пробелом: "1 ", "1. ", "2) ", "3 - "
  const m1 = s.match(/^(\d+)[.)\s:,;-]*\s*/)
  if (m1 && m1[0].length > 0) {
    s = s.slice(m1[0].length)
    applied.push('digit-prefix')
  }

  // 2) Ведущие знаки пунктуации / bullets после первого шага
  const m2 = s.match(/^[.,;:•·*\-\s]+/)
  if (m2 && m2[0].length > 0) {
    s = s.slice(m2[0].length)
    applied.push('leading-punct')
  }

  // 3) Множественные пробелы внутри → один
  if (/\s{2,}/.test(s)) {
    s = s.replace(/\s{2,}/g, ' ')
    applied.push('collapse-spaces')
  }

  // 4) Trim
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
  // в базе пара десятков тысяч записей, влезет в память)
  const rows = await prisma.business.findMany({
    select: { id: true, name: true },
  })

  let changedCount = 0
  const ruleCounts: Record<string, number> = {}
  const samples: Array<{ id: string; before: string; after: string; rules: string[] }> = []
  const updates: Array<{ id: string; name: string }> = []

  for (const row of rows) {
    const { clean, applied } = cleanName(row.name)
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

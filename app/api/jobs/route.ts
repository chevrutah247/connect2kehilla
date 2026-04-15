// API for jobs CRUD
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

const LISTING_DURATION_DAYS = 8

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const area = searchParams.get('area')
  const category = searchParams.get('category')
  const type = searchParams.get('type') as 'SEEKING' | 'OFFERING' | null

  const where: any = { isActive: true, expiresAt: { gt: new Date() } }
  if (area) where.area = { contains: area, mode: 'insensitive' }
  if (category) where.category = { contains: category, mode: 'insensitive' }
  if (type) where.type = type

  const jobs = await prisma.job.findMany({
    where,
    orderBy: [{ plan: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  })

  return NextResponse.json(jobs)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, area, zipCode, phone, salary, type, plan } = body

    if (!title || !phone || !type) {
      return NextResponse.json({ error: 'Title, phone, and type are required' }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + LISTING_DURATION_DAYS)

    const job = await prisma.job.create({
      data: {
        title, description: description || '', category: category || 'general',
        area, zipCode, phone, salary, type, plan: plan || 'STANDARD',
        expiresAt,
      },
    })

    return NextResponse.json({ ok: true, jobId: job.id })
  } catch (error: any) {
    console.error('Job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

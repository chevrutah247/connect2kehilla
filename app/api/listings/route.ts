// API for creating business/service listings
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

const LISTING_DURATION_DAYS = 8

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, categories, listingType, description, hoursOfWork, priceFrom, zipCode, area, address, email, website, plan } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Create or update business
    let business = await prisma.business.findFirst({ where: { phone } })

    if (business) {
      business = await prisma.business.update({
        where: { id: business.id },
        data: {
          name, categories: categories || [], listingType: listingType || 'BUSINESS',
          description, hoursOfWork, priceFrom, zipCode, area, address, email, website,
          status: plan || 'FREE',
        },
      })
    } else {
      business = await prisma.business.create({
        data: {
          name, phone, categories: categories || [], listingType: listingType || 'BUSINESS',
          description, hoursOfWork, priceFrom, zipCode, area, address, email, website,
          status: plan || 'FREE',
        },
      })
    }

    // Create paid listing if not FREE
    if (plan && plan !== 'FREE') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + LISTING_DURATION_DAYS)

      await prisma.listing.create({
        data: {
          businessId: business.id,
          plan,
          price: plan === 'PREMIUM' ? 50 : plan === 'SPECIALS' ? 40 : plan === 'STANDARD' ? 30 : 7.99,
          expiresAt,
        },
      })
    }

    return NextResponse.json({ ok: true, businessId: business.id, status: business.status })
  } catch (error: any) {
    console.error('Listing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

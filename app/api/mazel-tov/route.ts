// API for submitting Mazel Tov / Simcha announcements (web form)
// POST /api/mazel-tov

import { NextRequest, NextResponse } from 'next/server'
import { submitMazelTov } from '@/lib/mazel-tov'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, type, name, phone, zipCode, area } = body

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Please write a longer message (at least 10 characters)' }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const result = await submitMazelTov({
      text: text.trim(),
      type: type || 'mazel_tov',
      submittedByPhone: phone,
      submittedByName: name || null,
      zipCode: zipCode || null,
      area: area || null,
    })

    return NextResponse.json({
      ok: true,
      id: result.id,
      pending: true,
      message: '🎊 Thank you! Your mazel tov is pending review. Once approved by our team it will be sent to all subscribers.',
    })
  } catch (err: any) {
    console.error('Mazel Tov API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

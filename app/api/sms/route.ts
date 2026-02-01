// app/api/sms/route.ts
// Главный webhook для обработки входящих SMS от Twilio

import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, formatBusinessResponse, MESSAGES } from '@/lib/twilio'
import { parseQuery } from '@/lib/openai'
import { isShabbatWithBuffer } from '@/lib/shabbat'
import { getOrCreateUser, isUserBlocked, blockUser, unblockUser, getUserDefaultZip, setUserDefaultZip } from '@/lib/users'
import { searchBusinesses, searchBusinessesExpanded, recordLeads } from '@/lib/businesses'
import prisma from '@/lib/db'

// ============================================
// POST /api/sms - Twilio Webhook
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Получаем данные от Twilio
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    
    if (!from || !body) {
      return createTwiMLResponse('Invalid request')
    }

    console.log(`📩 SMS from ${from}: ${body}`)

    // Проверяем, заблокирован ли пользователь (STOP)
    const isBlocked = await isUserBlocked(from)
    if (isBlocked) {
      // Проверяем, не пытается ли вернуться (START)
      if (body.trim().toUpperCase() === 'START') {
        await unblockUser(from)
        return createTwiMLResponse(MESSAGES.WELCOME)
      }
      // Иначе - не отвечаем
      return createTwiMLResponse('')
    }

    // Получаем или создаём пользователя
    const user = await getOrCreateUser(from)

    // Парсим сообщение через AI
    const parsed = await parseQuery(body)
    console.log('🤖 Parsed:', parsed)

    // Обрабатываем по интенту
    let responseText = ''

    switch (parsed.intent) {
      case 'help':
        responseText = MESSAGES.HELP
        break

      case 'stop':
        await blockUser(from)
        responseText = MESSAGES.STOP
        break

      case 'info':
        responseText = MESSAGES.WELCOME
        break

      case 'search':
        responseText = await handleSearch(user.id, from, body, parsed)
        break

      default:
        // Если AI не понял - просим уточнить
        responseText = MESSAGES.NEED_MORE_INFO
    }

    // Сохраняем запрос в базу
    await prisma.query.create({
      data: {
        userId: user.id,
        rawMessage: body,
        parsedCategory: parsed.category,
        parsedZip: parsed.zipCode,
        parsedArea: parsed.area,
        parsedIntent: parsed.intent.toUpperCase() as any,
        responseText,
        processedAt: new Date(),
      }
    })

    return createTwiMLResponse(responseText)

  } catch (error) {
    console.error('❌ SMS processing error:', error)
    return createTwiMLResponse(MESSAGES.ERROR)
  }
}

// ============================================
// Обработка поискового запроса
// ============================================
async function handleSearch(
  userId: string,
  phone: string,
  rawMessage: string,
  parsed: Awaited<ReturnType<typeof parseQuery>>
): Promise<string> {
  
  // Проверяем Шаббат
  const zipForShabbat = parsed.zipCode || await getUserDefaultZip(phone)
  const isShabbat = await isShabbatWithBuffer(zipForShabbat ?? undefined)
  
  if (isShabbat) {
    // Сохраняем запрос для обработки после Шаббата
    await prisma.query.create({
      data: {
        userId,
        rawMessage,
        parsedCategory: parsed.category,
        parsedZip: parsed.zipCode,
        parsedArea: parsed.area,
        parsedIntent: 'SEARCH',
        isShabbat: true,
      }
    })
    return MESSAGES.SHABBAT
  }

  // Если нет локации - пробуем взять дефолтную
  let zipCode = parsed.zipCode
  let area = parsed.area

  if (!zipCode && !area) {
    const defaultZip = await getUserDefaultZip(phone)
    if (defaultZip) {
      zipCode = defaultZip
    }
  }

  // Если всё ещё нет локации и категории - просим уточнить
  if (!parsed.category && !parsed.businessName) {
    return MESSAGES.NEED_MORE_INFO
  }

  // Ищем бизнесы
  let businesses = await searchBusinesses({
    category: parsed.category,
    zipCode,
    area,
    businessName: parsed.businessName,
    limit: 3,
  })

  // Если не нашли - расширяем поиск
  if (businesses.length === 0 && parsed.category) {
    businesses = await searchBusinessesExpanded({
      category: parsed.category,
      limit: 3,
    })
  }

  // Если нашли - сохраняем ZIP как дефолтный
  if (zipCode && businesses.length > 0) {
    await setUserDefaultZip(phone, zipCode)
  }

  // Создаём запись запроса и лидов
  const query = await prisma.query.create({
    data: {
      userId,
      rawMessage,
      parsedCategory: parsed.category,
      parsedZip: zipCode,
      parsedArea: area,
      parsedIntent: 'SEARCH',
      businessCount: businesses.length,
      processedAt: new Date(),
    }
  })

  if (businesses.length > 0) {
    await recordLeads(
      query.id,
      userId,
      businesses.map(b => b.id)
    )
  }

  // Форматируем ответ
  return formatBusinessResponse(
    businesses,
    parsed.category || parsed.businessName || 'results'
  )
}

// ============================================
// Создание TwiML ответа
// ============================================
function createTwiMLResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}

// ============================================
// Экранирование XML
// ============================================
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

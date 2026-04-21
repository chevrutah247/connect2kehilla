// lib/twilio.ts
// Отправка и обработка SMS через Twilio

import twilio from 'twilio'
import prisma from '@/lib/db'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!

const client = twilio(accountSid, authToken)

// ============================================
// Отправка SMS
// ============================================
export async function sendSMS(to: string, body: string): Promise<boolean> {
  try {
    const message = await client.messages.create({
      body,
      from: twilioPhone,
      to,
    })
    
    console.log(`SMS sent: ${message.sid}`)
    return true
  } catch (error) {
    console.error('SMS send error:', error)
    return false
  }
}

// ============================================
// Форматирование ответа с бизнесами
// ============================================
export function formatBusinessResponse(
  businesses: Array<{ name: string; phone: string; area?: string | null; address?: string | null; website?: string | null }>,
  category: string
): string {
  if (businesses.length === 0) {
    return `Sorry, we couldn't find any ${category} in your area. Try a different ZIP code or category.`
  }

  let response = `Found ${businesses.length} ${category}:\n\n`

  businesses.forEach((biz, index) => {
    response += `${index + 1}. ${biz.name}\n`
    response += `   📞 ${biz.phone}\n`
    if (biz.address) {
      // Truncate very long addresses (some have multiple locations separated by ;)
      const addr = biz.address.length > 80 ? biz.address.slice(0, 77) + '...' : biz.address
      response += `   📍 ${addr}\n`
    } else if (biz.area) {
      response += `   📍 ${biz.area}\n`
    }
    if (biz.website) {
      response += `   🌐 ${biz.website}\n`
    }
    response += '\n'
  })

  response += '💡 Tell them Connect2Kehilla sent you!\n'
  response += 'Reply MENU for options, STOP to opt out.'

  return response
}

// ============================================
// Сообщения системы
// ============================================
export const MESSAGES = {
  WELCOME: `Welcome to Connect2Kehilla! 🕎
Text us what you need + your ZIP code.
Example: "plumber 11211" or "electrician Monsey"

Reply MENU for options, HELP for support.`,

  // Compliance auto-reply (CTIA/carrier standard)
  HELP: `Connect2Kehilla — community SMS directory.
Reply MENU for options.
Reply STOP to unsubscribe.
Support: (888) 516-3399
Msg & data rates may apply.`,

  // Feature menu — prefer getMenuMessage() which injects live business count.
  // This static fallback is used only if the DB lookup fails.
  MENU: `Connect2Kehilla MENU
Text (888) 516-3399

SEARCH   - find any business
SIMCHA   - mazel tovs & engagements
LECHAIM  - l'chaim events
SPECIALS - grocery store deals
JOBS     - find or post a job
MINYAN   - minyan times
ZMANIM   - zmanim & Jewish calendar
GMACH    - free loan gemachs
SHIDDUCH - singles & matchmaking
CHARITY  - tzedaka & donations

TIP: Add ? for help (Example: JOBS ?)
17,000+ businesses | connect2kehilla.com`,

  STOP: `You have been unsubscribed from Connect2Kehilla. 
You will no longer receive messages.
Text START to resubscribe.`,

  SHABBAT: `Shabbat Shalom! 🕯️
We observe Shabbat and will process your request after Havdalah.
Your message has been saved.
Gut Voch! Have a wonderful week!`,

  NEED_MORE_INFO: `Please provide more details:
• What service do you need?
• What's your ZIP code or neighborhood?

Example: "plumber 11211"`,

  ADD_BUSINESS: `📋 Add Your Business to Connect2Kehilla!

Send the following info via SMS or email:

1️⃣ Business name
2️⃣ Category (plumber, restaurant, etc.)
3️⃣ Phone number
4️⃣ Address
5️⃣ Email
6️⃣ Hours of operation
7️⃣ Do you offer specials/discounts?

📧 Email to: list@connect2kehilla.com
📞 Or call: (888) 516-3399

We'll add your business within 24 hours!`,

  ERROR: `Sorry, something went wrong. Please try again.
If the problem persists, text MENU for options.`,

  // ==========================================================
  // COMMAND ? help messages — one per category.
  // See app/api/sms/route.ts + lib/help-commands.ts for the
  // matcher that triggers these (e.g. "SIMCHA ?", "? simcha").
  // ==========================================================
  SEARCH_HELP: `SEARCH - Find any business

HOW TO SEARCH:
Text: [what you need] [ZIP code]
ZIP code = 5-digit number on your mail
Examples: 11225, 11213, 11211

EXAMPLES:
plumber 11213
kosher restaurant Crown Heights
electrician 11225
dentist Williamsburg

No ZIP? Use your neighborhood:
lawyer Crown Heights
doctor Flatbush`,

  SIMCHA_HELP: `SIMCHA - Mazel Tov Announcements

VIEW: SIMCHA [ZIP or neighborhood]
Example: SIMCHA 11225
Example: SIMCHA Crown Heights

POST YOURS: Text ADD SIMCHA
You receive a template to fill in.
Types: Engagement, Wedding, Birth,
Bar/Bat Mitzva

GET NOTIFICATIONS: Text SUBSCRIBE SIMCHA
(or short: SUB SIMCHA)
STOP NOTIFICATIONS: Text UNSUBSCRIBE SIMCHA
(or short: UNSUB SIMCHA)`,

  LECHAIM_HELP: `LECHAIM - L'Chaim Event Announcements

VIEW: LECHAIM [ZIP or neighborhood]
Example: LECHAIM 11225

POST YOURS: Text ADD LECHAIM
Include: names, date, time, address

GET NOTIFICATIONS: Text SUBSCRIBE LECHAIM
(or short: SUB LECHAIM)
STOP NOTIFICATIONS: Text UNSUBSCRIBE LECHAIM
(or short: UNSUB LECHAIM)`,

  SPECIALS_HELP: `SPECIALS - Kosher Grocery Store Deals

Text SPECIALS [neighborhood or ZIP]
Example: SPECIALS Crown Heights
Example: SPECIALS 11225

You get a list of stores.
Reply with store number for their
weekly deals. Updated every Thursday.

For businesses: email
business@connect2kehilla.com`,

  JOBS_HELP: `JOBS - Job Board

FIND A JOB: Text JOBS [ZIP or area]
Example: JOBS 11225
Example: JOBS Crown Heights

POST A JOB: Text ADD JOB
Free to post!

GET NOTIFICATIONS: Text SUBSCRIBE JOBS [ZIP]
(or short: SUB JOBS 11225)
STOP NOTIFICATIONS: Text UNSUBSCRIBE JOBS
(or short: UNSUB JOBS)`,

  MINYAN_HELP: `MINYAN - Minyan Times

Text MINYAN [ZIP or shul name]
Example: MINYAN 11225
Example: MINYAN 770 Eastern Pkwy
Example: MINYAN Williamsburg
Example: shacharis Crown Heights
Example: mincha 11213

Results: shul name, address, times.
To add your shul: Text ADD MINYAN`,

  ZMANIM_HELP: `ZMANIM - Jewish Times & Calendar

ZMANIM [ZIP] - daily times
(sunrise, sunset, candle lighting)
Example: ZMANIM 11225

CANDLE [ZIP] - Shabbat candle lighting
Example: CANDLE 11225

SFIRA - today's Omer count
ROSH CHODESH - next Rosh Chodesh date
(Not RC - write full words)
FAST - next fast day & times
BIRKAT LEVANA - Kiddush Levana window
(Not BL - write full words)`,

  GMACH_HELP: `GMACH - Free Loan Services

GET GMACH ALERTS in your area:
Text SUBSCRIBE GMACH [ZIP]
(or short: SUB GMACH 11225)

You'll receive a text whenever
someone offers a gmach near you —
baby items, wedding, money,
medical, furniture, food, etc.

STOP ALERTS:
Text UNSUBSCRIBE GMACH
(or short: UNSUB GMACH)

OFFER A GMACH:
Email contact@connect2kehilla.com
or call (888) 516-3399`,

  SHIDDUCH_HELP: `SHIDDUCH - Matchmaking & Singles

For full matchmaking visit:
getashidduch.org

Or text SHIDDUCH for options:
1 - I am looking for a shidduch
2 - I am a shadchan (matchmaker)
3 - Submit a resume

All information is kept private.`,

  CHARITY_HELP: `CHARITY - Tzedaka & Donations

Text CHARITY [type or ZIP]
Example: CHARITY food 11225
Example: CHARITY medical Crown Heights

DONATE: Text DONATE [organization name]

LIST YOUR ORG: Text ADD CHARITY
Free for registered nonprofits.`,

  ZIP_HELP: `For better results, add your ZIP code
or neighborhood name.

ZIP code = 5-digit number on your mail.
Example: 11225 or 11213

Brooklyn ZIPs:
Crown Heights: 11225 or 11213
Williamsburg:  11211 or 11206
Flatbush:      11230 or 11210
Boro Park:     11219 or 11204

Or just write your neighborhood:
plumber Crown Heights
electrician Williamsburg`,
}

// ============================================
// Динамическое главное меню
// ============================================
// Читает живое количество одобренных бизнесов из SystemCache
// (обновляется cron-ом в воскресенье: /api/cron/update-stats).
// Если в кэше ничего нет — откатываемся на статический MESSAGES.MENU.
let _menuCache: { value: string; expiresAt: number } | null = null
const MENU_TTL_MS = 5 * 60 * 1000 // 5 минут — защита от избыточных DB-запросов

export async function getMenuMessage(): Promise<string> {
  if (_menuCache && Date.now() < _menuCache.expiresAt) {
    return _menuCache.value
  }

  let count = '17,000+'
  try {
    const cache = await prisma.systemCache.findUnique({
      where: { key: 'business_count' },
    })
    if (cache?.value) count = cache.value
  } catch {
    // fallback below; DB may be cold or migration not yet applied
  }

  const menu = [
    'Connect2Kehilla MENU',
    '',
    'HOW TO USE:',
    'Text COMMAND + your ZIP',
    'Example: plumber 11225',
    'ZIP = 5 digits on your mail',
    '',
    'COMMANDS (add ? for details,',
    'e.g. SIMCHA ? or JOBS ?):',
    'SEARCH   - find any business',
    'SIMCHA   - mazel tovs & engagements',
    "LECHAIM  - l'chaim events",
    'SPECIALS - grocery store deals',
    'JOBS     - find or post a job',
    'MINYAN   - minyan times',
    'ZMANIM   - zmanim & Jewish calendar',
    'GMACH    - free loan gemachs',
    'SHIDDUCH - singles & matchmaking',
    'CHARITY  - tzedaka & donations',
    '',
    `${count} businesses | connect2kehilla.com`,
  ].join('\n')

  _menuCache = { value: menu, expiresAt: Date.now() + MENU_TTL_MS }
  return menu
}

// ============================================
// Валидация Twilio webhook (безопасность)
// ============================================
export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(authToken, signature, url, params)
}

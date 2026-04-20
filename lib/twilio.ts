// lib/twilio.ts
// Отправка и обработка SMS через Twilio

import twilio from 'twilio'

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

  // Feature menu (what the product can do)
  MENU: `📱 Connect2Kehilla MENU

🔍 SEARCH
 "plumber 11213"
 "doctor Crown Heights"
 "Lemofet Glass"

🕍 MINYAN
 "mincha 11225"
 "shacharis Williamsburg"
 "770"

🕐 ZMANIM: "zmanim 11213"
📅 ZMAN — calendar menu
  CANDLE / SFIRA / ROSH CHODESH
  FAST / BIRKAT LEVANA
🏷 SPECIALS: text SPECIALS
👷 JOBS: text JOBS or "job 11213"
❤️ CHARITY: text CHARITY
💍 SHIDDUCH: text SHIDDUCH
📋 ADD BUSINESS: (888) 516-3399

🌐 connect2kehilla.com
17,000+ businesses • EN / עברית / אידיש

Reply HELP for support, STOP to opt out.`,

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

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
  businesses: Array<{ name: string; phone: string; area?: string | null }>,
  category: string
): string {
  if (businesses.length === 0) {
    return `Sorry, we couldn't find any ${category} in your area. Try a different ZIP code or category.`
  }
  
  let response = `Found ${businesses.length} ${category}:\n\n`
  
  businesses.forEach((biz, index) => {
    response += `${index + 1}. ${biz.name}\n`
    response += `   📞 ${biz.phone}\n`
    if (biz.area) {
      response += `   📍 ${biz.area}\n`
    }
    response += '\n'
  })
  
  response += 'Reply HELP for assistance or STOP to unsubscribe.'
  
  return response
}

// ============================================
// Сообщения системы
// ============================================
export const MESSAGES = {
  WELCOME: `Welcome to Connect2Kehilla! 🕎
Text us what you need + your ZIP code.
Example: "plumber 11211" or "electrician Monsey"

Reply HELP for more info.`,

  HELP: `📞 Connect2Kehilla — Your Community Directory

🔍 FIND A SERVICE:
Text what you need + area
• "plumber Williamsburg"
• "electrician 11211"
• "dentist Monsey"

🏷 STORE SPECIALS:
• "specials" — see all stores
• "specials Crown Heights"

📋 ADD YOUR BUSINESS:
• Call (888) 516-3399
• Or visit connect2kehilla.com

📌 COMMANDS:
• SPECIALS — grocery deals
• HELP — this menu
• STOP — unsubscribe
• START — resubscribe

Msg & data rates may apply.`,

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
If the problem persists, text HELP for support.`,
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

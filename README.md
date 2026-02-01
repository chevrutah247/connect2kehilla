# Connect2Kehilla 🕎

SMS-based business directory for the Jewish community. Works with kosher phones!

## What It Does

1. User texts: `"plumber 11211"` or `"electrician Monsey"`
2. AI parses the request
3. System finds matching businesses from the database
4. User receives up to 3 contacts via SMS

**Special Features:**
- 🕯️ **Shabbat Mode** - Auto-pauses during Shabbat
- 🤖 **AI Parsing** - Understands natural language queries
- 📊 **Lead Tracking** - Counts how many times each business is shared
- 💰 **Monetization Ready** - Paid businesses appear first

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **SMS:** Twilio
- **AI:** OpenAI GPT-4o Mini
- **Database:** PostgreSQL (Vercel Postgres / Supabase)
- **Shabbat Times:** HebCal API
- **Hosting:** Vercel

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/connect2kehilla.git
cd connect2kehilla
npm install
```

### 2. Set Up Database

**Option A: Vercel Postgres (recommended)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Copy the `DATABASE_URL` to `.env`

**Option B: Supabase**
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string
3. Copy the URI to `.env`

Then run:
```bash
npx prisma db push
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
# Twilio (get from twilio.com/console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY=sk-xxxxxxxx

# Database
DATABASE_URL=postgresql://...

# Security
PHONE_HASH_SALT=your_random_secret_string
```

### 4. Set Up Twilio

1. Buy a phone number at [twilio.com/console/phone-numbers](https://twilio.com/console/phone-numbers)
2. Configure the webhook:
   - Go to Phone Numbers → Your Number → Messaging
   - Set "When a message comes in" to:
     - **URL:** `https://your-domain.vercel.app/api/sms`
     - **Method:** POST

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect GitHub repo in Vercel Dashboard.

### 6. Import Businesses

Prepare a CSV file with columns:
- `name` (required)
- `phone` (required)
- `category`
- `zip_code`
- `area`
- `city`

Run import:
```bash
npm run import -- --file=businesses.csv
```

---

## Project Structure

```
connect2kehilla/
├── app/
│   ├── api/
│   │   └── sms/
│   │       └── route.ts      # Main SMS webhook
│   ├── layout.tsx
│   ├── page.tsx              # Landing page
│   └── globals.css
├── lib/
│   ├── db.ts                 # Database connection
│   ├── twilio.ts             # SMS sending
│   ├── openai.ts             # AI query parsing
│   ├── shabbat.ts            # Shabbat time checking
│   ├── users.ts              # User management
│   └── businesses.ts         # Business search
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   └── import-businesses.ts  # CSV import script
└── package.json
```

---

## SMS Commands

| Command | Description |
|---------|-------------|
| `HELP` | Show help message |
| `STOP` | Unsubscribe from all messages |
| `START` | Resubscribe after STOP |
| `[service] [ZIP]` | Search for businesses |

**Examples:**
- `plumber 11211`
- `electrician Monsey`
- `kosher restaurant Borough Park`
- `Haim's Tires` (search by name)

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sms` | POST | Twilio webhook for incoming SMS |

---

## Shabbat Mode

The system automatically:
1. Fetches Shabbat times from HebCal API based on user's ZIP
2. Enters "Shabbat mode" 20 minutes before candle lighting
3. Sends auto-reply to all incoming messages
4. Saves queries for processing after Havdalah
5. Resumes normal operation after Havdalah

---

## Monetization Model

**Month 1 (Trial):**
- All businesses shown for free
- System tracks lead counts

**Month 2+:**
- Paid businesses ($15/month) shown first
- Free businesses shown after paid
- Auto-notification to businesses about their leads

---

## Development

```bash
# Run locally
npm run dev

# View database
npx prisma studio

# Push schema changes
npx prisma db push
```

---

## Support

- Text `HELP` to the service number
- Email: support@connect2kehilla.com

---

## License

MIT © 2024 Connect2Kehilla

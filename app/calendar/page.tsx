// Public Jewish Calendar reference page — shows all calendar SMS commands
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jewish Calendar Commands — Candle Lighting, Sfiras HaOmer, Rosh Chodesh | Connect2Kehilla',
  description: 'SMS commands for candle lighting times, Sfiras Ha\'Omer, Rosh Chodesh, fast days, and Birkas HaLevana. Works on any kosher phone.',
}

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="max-w-5xl mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition mb-6 text-sm font-medium"
          >
            <span className="text-lg">←</span> Back to Home
          </a>
          <div className="text-center">
            <div className="inline-block bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-1.5 mb-4">
              <span className="text-yellow-300 font-semibold text-sm">📅 JEWISH CALENDAR</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Zman — Jewish Calendar Commands</h1>
            <p className="text-lg text-blue-300">All Jewish calendar info via SMS — no smartphone needed</p>
          </div>
        </div>
      </section>

      {/* Commands */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 mb-8">
          <h2 className="text-xl font-bold text-amber-900 mb-2">📱 How to use</h2>
          <p className="text-amber-800 mb-3">
            Text one of the commands below to <strong>(888) 516-3399</strong>. Works on any phone that can send SMS — flip phones, kosher phones, feature phones.
          </p>
          <p className="text-amber-700 text-sm">
            Start with <code className="bg-white px-2 py-1 rounded font-mono text-amber-900 font-bold">ZMAN</code> to see the full menu.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Candle Lighting */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="text-4xl mb-3">🕯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Candle Lighting</h3>
            <div className="bg-gray-900 text-emerald-400 font-mono text-sm p-3 rounded mb-3">
              CANDLE 11213
            </div>
            <p className="text-gray-600 text-sm">
              Returns the candle-lighting time for the upcoming Shabbos or Yom Tov in your ZIP code. Havdalah time included (72 minutes after sunset — Chabad minhag).
            </p>
          </div>

          {/* Sfiras HaOmer */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="text-4xl mb-3">🌾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sfiras Ha&apos;Omer</h3>
            <div className="bg-gray-900 text-emerald-400 font-mono text-sm p-3 rounded mb-3">
              SFIRA
            </div>
            <p className="text-gray-600 text-sm">
              Active between the 2nd night of Pesach (16 Nissan) and Shavuos. Returns today&apos;s day and week count, plus the middah of the day (Chesed she&apos;b&apos;Chesed, etc.).
            </p>
            <p className="text-xs text-gray-500 mt-2">Remember: the count is said after nightfall.</p>
          </div>

          {/* Rosh Chodesh */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="text-4xl mb-3">🌑</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Rosh Chodesh</h3>
            <div className="bg-gray-900 text-emerald-400 font-mono text-sm p-3 rounded mb-3">
              ROSH CHODESH
            </div>
            <p className="text-gray-600 text-sm">
              Shows the next few Rosh Chodesh dates. If within 3 days, flagged with a reminder so you don&apos;t forget <em>Yaʿaleh V&apos;yavo</em> and <em>Hallel</em>.
            </p>
          </div>

          {/* Fast days */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="text-4xl mb-3">🕍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Days</h3>
            <div className="bg-gray-900 text-emerald-400 font-mono text-sm p-3 rounded mb-3">
              FAST
            </div>
            <p className="text-gray-600 text-sm">
              Lists the upcoming fasts: Tzom Gedaliah, Yom Kippur, Asara B&apos;Teves, Taʿanis Esther, Shivʿa Asar b&apos;Tammuz, Tishʿa B&apos;Av. Reminder if within 3 days.
            </p>
          </div>

          {/* Birkas HaLevana */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 md:col-span-2">
            <div className="text-4xl mb-3">🌙</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Birkas HaLevana (Kiddush Levana)</h3>
            <div className="bg-gray-900 text-emerald-400 font-mono text-sm p-3 rounded mb-3">
              BIRKAT LEVANA
            </div>
            <p className="text-gray-600 text-sm">
              Shows the window for this Hebrew month. Both the earliest (3 days) and Chabad minhag (7 days) are given, plus the latest acceptable date (15th of the month).
              You&apos;ll be reminded 3 days before the window opens.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Recited at night, outside, under clear sky when the moon is visible.
            </p>
          </div>

          {/* Zmanim (already existing) */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 md:col-span-2">
            <div className="text-4xl mb-3">🕐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Zmanim (prayer times)</h3>
            <div className="bg-gray-900 text-emerald-400 font-mono text-sm p-3 rounded mb-3">
              ZMANIM 11213
            </div>
            <p className="text-gray-600 text-sm">
              Returns today&apos;s halachic times for your location: Alos Hashachar, Netz, Sof Zman Krias Shema, Chatzos, Mincha Gedola, Shkia, Tzeis HaKochavim.
            </p>
          </div>
        </div>

        {/* Data source */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">📚 Data source</h3>
          <p className="text-gray-700 text-sm">
            All times and dates come from the <a href="https://www.hebcal.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Hebcal</a> open-source Hebrew calendar library (<code>@hebcal/core</code>), which is the same engine that powers Chabad.org, MyZmanim.com, and other trusted Jewish calendar sites. Calculations use your ZIP code&apos;s latitude/longitude for accurate sunset and sunrise times.
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-10 pt-6 border-t border-gray-200">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <span className="text-xl">←</span> Back to Home
          </a>
        </div>
      </section>
    </main>
  )
}

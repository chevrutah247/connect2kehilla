#!/usr/bin/env npx tsx
// scripts/generate-whitepaper-pdf.ts
// Generates the public-facing market report PDF from the same content as
// /research/kosher-phone-market-2026. Output goes to public/ so Vercel
// serves it directly at /connect2kehilla-market-report-2026.pdf.
//
// Run: npx tsx scripts/generate-whitepaper-pdf.ts

import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'public', 'connect2kehilla-market-report-2026.pdf');
mkdirSync(join(process.cwd(), 'public'), { recursive: true });

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  info: {
    Title: 'The Kosher Phone Market: Size, Demographics & Opportunity',
    Author: 'Levi Dombrovsky',
    Subject: 'Connect2Kehilla Market Research Report — April 2026',
    Keywords: 'kosher phone, Haredi, ultra-Orthodox, SMS, Connect2Kehilla',
  },
});
doc.pipe(createWriteStream(OUT));

const EMERALD = '#047857';
const TEXT = '#1f2937';
const MUTED = '#6b7280';
const RULE = '#d1d5db';

function h1(text: string) {
  doc.moveDown(0.4);
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(20).text(text);
  doc.moveDown(0.5);
  const y = doc.y - 4;
  doc.strokeColor(EMERALD).lineWidth(1.5).moveTo(72, y).lineTo(540, y).stroke();
  doc.moveDown(0.6);
}

function h2(text: string) {
  doc.moveDown(0.6);
  doc.fillColor(EMERALD).font('Helvetica-Bold').fontSize(14).text(text);
  doc.moveDown(0.3);
}

function p(text: string) {
  doc.fillColor(TEXT).font('Helvetica').fontSize(11).text(text, { align: 'justify' });
  doc.moveDown(0.5);
}

function bullets(items: string[]) {
  doc.fillColor(TEXT).font('Helvetica').fontSize(11);
  for (const it of items) {
    doc.text(`• ${it}`, { indent: 12, paragraphGap: 4 });
  }
  doc.moveDown(0.5);
}

function table(headers: string[], rows: string[][], colWidths: number[]) {
  const startX = 72;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const rowHeight = 22;

  // Header
  doc.fillColor(EMERALD).rect(startX, doc.y, totalWidth, rowHeight).fill();
  doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
  let x = startX + 6;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, doc.y - rowHeight + 6, { width: colWidths[i] - 12 });
    x += colWidths[i];
  }
  doc.y += 4;

  // Rows
  for (const row of rows) {
    if (doc.y + rowHeight > 720) {
      doc.addPage();
    }
    const yStart = doc.y;
    let maxRowHeight = rowHeight;
    // Estimate row height by tallest cell
    doc.font('Helvetica').fontSize(10).fillColor(TEXT);
    let cellX = startX;
    for (let i = 0; i < row.length; i++) {
      const h = doc.heightOfString(row[i], { width: colWidths[i] - 12 });
      if (h + 10 > maxRowHeight) maxRowHeight = h + 10;
      cellX += colWidths[i];
    }
    // Draw cells
    cellX = startX;
    for (let i = 0; i < row.length; i++) {
      doc.strokeColor(RULE).lineWidth(0.5).rect(cellX, yStart, colWidths[i], maxRowHeight).stroke();
      doc.text(row[i], cellX + 6, yStart + 6, { width: colWidths[i] - 12 });
      cellX += colWidths[i];
    }
    doc.y = yStart + maxRowHeight;
  }
  doc.moveDown(0.6);
}

// ── Cover ────────────────────────────────────────────────────────────────
doc.fillColor(EMERALD).font('Helvetica-Bold').fontSize(11)
  .text('CONNECT2KEHILLA', { align: 'left' });
doc.fillColor(MUTED).font('Helvetica').fontSize(9)
  .text('Market Research Report  •  April 2026', { align: 'left' });
doc.moveDown(8);

doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(28)
  .text('The Kosher Phone Market', { align: 'left' });
doc.font('Helvetica').fontSize(20).fillColor(MUTED)
  .text('Size, Demographics & Opportunity', { align: 'left' });
doc.moveDown(6);

doc.fillColor(TEXT).font('Helvetica').fontSize(12);
doc.text('A market analysis of the global Jewish population, the Haredi (ultra-Orthodox) community, and the prevalence of kosher phone usage — defining the total addressable market for an SMS-based community information service.',
  { align: 'left', width: 460 });
doc.moveDown(4);

doc.fillColor(MUTED).font('Helvetica').fontSize(10);
doc.text('Author: Levi Dombrovsky');
doc.text('Market Research Lead, Connect2Kehilla');
doc.text('Published: April 2026');
doc.text('Web edition: connect2kehilla.com/research/kosher-phone-market-2026');

doc.addPage();

// ── 1. Executive Summary ─────────────────────────────────────────────────
h1('1. Executive Summary');
p('This report analyzes the global Jewish population, the Haredi (ultra-Orthodox) community, and the prevalence of kosher phone usage — to define the total addressable market for Connect2Kehilla, a free SMS-based community information service for kosher phone users.');
h2('Key findings');
bullets([
  'Approximately 16.5 million Jews in the world as of 2026 (DellaPergola, Hebrew University; Wikipedia 2026).',
  'Roughly 2.1 million — 14% — are Haredi (ultra-Orthodox) (JPR, 2022).',
  '84% of Haredim in Israel use kosher phones (Israel Democracy Institute, 2022).',
  '~700,000 Haredim in the US, mainly in the New York metropolitan area.',
  'Haredi population grows 3.5–4% annually, doubling every 20 years.',
  'No equivalent SMS information service exists anywhere in the world.',
]);

// ── 2. World Jewish Population ───────────────────────────────────────────
h1('2. World Jewish Population');
p('Distribution of Jews by major country as of 2026, based on data from the Jewish Virtual Library, Pew Research Center (2025), and Hebrew University demographer Sergio DellaPergola.');
table(
  ['Country', 'Population', '% of World', 'Notes'],
  [
    ['Israel', '7,760,000', '47.0%', 'Largest Jewish country'],
    ['United States', '6,300,000', '38.2%', 'NY area: 1.73M'],
    ['France', '438,500', '2.7%', 'Paris-based'],
    ['Canada', '398,000', '2.4%', 'Toronto–Montreal'],
    ['United Kingdom', '312,000', '1.9%', 'London, Manchester'],
    ['Argentina', '171,000', '1.0%', 'Buenos Aires'],
    ['Russia', '132,000', '0.8%', 'Moscow, St. Petersburg'],
    ['Germany', '125,000', '0.8%', 'Berlin, Frankfurt'],
    ['Australia', '117,200', '0.7%', 'Sydney, Melbourne'],
    ['Belgium', '30,000', '0.2%', 'Antwerp: major Haredi hub'],
    ['World total', '~16,500,000', '100%', '— Wikipedia 2026'],
  ],
  [115, 100, 80, 173],
);

// ── 3. Haredi Population ─────────────────────────────────────────────────
h1('3. The Haredi (Ultra-Orthodox) Population');
p('The Haredi community is the primary target market for Connect2Kehilla, as they are the principal users of kosher phones and have the greatest need for community information services that do not require internet access.');
table(
  ['Country / Region', 'Haredi Population', '% of Local Jews', 'Key Communities'],
  [
    ['Israel', '1,452,350', '14.3% of Israelis', 'Jerusalem, Bnei Brak, Beit Shemesh'],
    ['United States', '~700,000', '~11%', 'Brooklyn, Lakewood NJ, Monsey NY, Monroe NY'],
    ['United Kingdom', '~76,000', '~25%', 'Stamford Hill (London), Manchester'],
    ['Belgium', '~15,000', '~50%', 'Antwerp Diamond District'],
    ['Canada', '~30,000', '~8%', 'Montreal, Toronto'],
    ['France', '~12,000', '~3%', 'Paris, Strasbourg'],
  ],
  [110, 105, 100, 153],
);

// ── 4. Kosher Phone Adoption ─────────────────────────────────────────────
h1('4. Kosher Phone Adoption');
p('Kosher phone adoption is high and rising in every major Haredi hub.');
table(
  ['Community', 'Adoption', 'Source'],
  [
    ['Israel — Haredi sector', '84%', 'IDI Statistical Report 2025'],
    ['Williamsburg, Brooklyn', 'Near 100%', '18Forty / Daily Beast, 2024–2025'],
    ['Crown Heights, Brooklyn', 'Very high', 'Connect2Kehilla / community observation'],
    ['Stamford Hill, London', 'Majority', 'JPR UK, 2022'],
    ['Antwerp, Belgium', 'Majority', 'JPR European Haredi report, 2022'],
    ['Lakewood, NJ', 'Very high', 'KosherCell Inc. / 18Forty interview, 2025'],
  ],
  [180, 100, 188],
);

// ── 5. Growth ────────────────────────────────────────────────────────────
h1('5. Growth — A Rapidly Expanding Market');
table(
  ['Metric', '2025', '2040 forecast', 'Notes'],
  [
    ['Global Haredi population', '~2.1M', '~4.2M', 'Doubles every 20 years (JPR, 2022)'],
    ['Israel Haredi share', '14.3%', '~16%', 'Israel CBS forecast, IDI 2025'],
    ['Haredi share of world Jewry', '14%', '>20%', '1 in 5 Jews will be Haredi by 2040'],
    ['Haredi annual growth rate', '3.5–4%', '3.5–4%', 'vs. 0.7% for the rest of world Jewry'],
    ['Kosher-phone users (estimate)', '~1.5–1.8M', '~3–4M', 'Based on Israel 84% + US + EU'],
  ],
  [165, 75, 90, 138],
);

// ── 6. Opportunities ─────────────────────────────────────────────────────
h1('6. Opportunities for Connect2Kehilla');
table(
  ['Market segment', 'Population', 'Kosher-phone users', 'Status'],
  [
    ['NY (Brooklyn, Monsey, Lakewood NJ)', '~350,000', '200–280,000', 'Active'],
    ['Other US communities', '~350,000', '200–250,000', 'Phase 1'],
    ['Israel (Haredi, SMS)', '~1,450,000', '~1.2M', 'Phase 2'],
    ['UK + Belgium', '~91,000', '~60,000', 'Phase 3'],
    ['Canada + Australia + others', '~60,000', '~30,000', 'Phase 4'],
    ['Total addressable market', '~2,300,000', '~1.7–1.8M', 'Kosher-phone users only'],
  ],
  [200, 90, 110, 68],
);

// ── 7. No Competitors ────────────────────────────────────────────────────
h1('7. Why There Are No Competitors');
bullets([
  'Kosher phone users cannot use apps, websites, or social media.',
  'WhatsApp and other messengers are unavailable on most kosher phones.',
  'No existing SMS service offers the full bundle — Zmanim, Minyanim, Simchas, Specials, Jobs, Gmach — in one place.',
  'Connect2Kehilla is Shabbos-aware. No competitor has accounted for this.',
]);

// ── 8. Sources ───────────────────────────────────────────────────────────
h1('8. Sources');
const sources = [
  'Wikipedia — Jewish population by country, 2026. Data from Prof. Sergio DellaPergola, Hebrew University of Jerusalem.',
  'Pew Research Center — Changes in the global religious landscape, 2010–2020. June 2025.',
  'Institute for Jewish Policy Research (JPR) — Haredim in the World: Demographic Trends. Dr. Daniel Staetsky, 2022.',
  'Israel Democracy Institute (IDI) — Statistical Report on the Ultra-Orthodox Society of Israel, 2025.',
  '18Forty — What Haredim Can Teach Us: Kosher Phones. December 2025.',
  'The Daily Beast — Can a Kosher Phone Cure Your Tech Addiction? September 2024.',
  'Times of Israel — By 2050, almost one in four Israelis will be ultra-Orthodox. February 2026.',
  'WorldPopulationReview.com — Jewish population in the world 2026.',
  'TheWorldData.com — World Jewish population 2025: statistics and facts.',
  'Jerusalem Post — One in seven Jews worldwide is ultra-Orthodox. May 2022.',
];
doc.fillColor(TEXT).font('Helvetica').fontSize(10);
sources.forEach((s, i) => {
  doc.text(`${i + 1}. ${s}`, { paragraphGap: 4 });
});

// ── Footer ───────────────────────────────────────────────────────────────
doc.moveDown(2);
doc.strokeColor(RULE).lineWidth(0.5).moveTo(72, doc.y).lineTo(540, doc.y).stroke();
doc.moveDown(0.5);
doc.fillColor(MUTED).font('Helvetica').fontSize(9);
doc.text('© 2026 Connect2Kehilla. Recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the community.');
doc.text('connect2kehilla.com  •  list@connect2kehilla.com  •  (888) 516-3399');

doc.end();

console.log(`✅ Generated ${OUT}`);

const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

pres.layout = "LAYOUT_WIDE";

// ═══════════════════════════════════════════════
// FLYER 1 — FOR CONSUMERS (Kosher Phone Users)
// ═══════════════════════════════════════════════
const s1 = pres.addSlide();
s1.background = { color: "1E3A5F" };

// Top gold line
s1.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: "C9A227" } });

// Title
s1.addText("Connect2Kehilla", {
  x: 0.5, y: 0.3, w: 12.33, h: 0.85,
  fontSize: 52, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center",
});

// Kosher Phone badge
s1.addShape(pres.ShapeType.roundRect, {
  x: 3, y: 1.25, w: 7.33, h: 0.55, rectRadius: 0.12,
  fill: { color: "C9A227" },
});
s1.addText("📱  SMS DIRECTORY FOR KOSHER PHONE USERS", {
  x: 3, y: 1.25, w: 7.33, h: 0.55,
  fontSize: 16, fontFace: "Arial", color: "1E3A5F", bold: true, align: "center", valign: "middle",
});

// Subtitle
s1.addText("No Internet Needed — Just Text What You Need!", {
  x: 0.5, y: 2.0, w: 12.33, h: 0.35,
  fontSize: 17, fontFace: "Arial", color: "CADCFC", align: "center",
});

// ── Phone number block ──
s1.addShape(pres.ShapeType.roundRect, {
  x: 2.5, y: 2.55, w: 8.33, h: 0.95, rectRadius: 0.15,
  fill: { color: "0D2847" }, line: { color: "C9A227", width: 2.5 },
});
s1.addText("TEXT US NOW", {
  x: 2.5, y: 2.55, w: 8.33, h: 0.3,
  fontSize: 11, fontFace: "Arial", color: "C9A227", bold: true, align: "center", valign: "middle",
});
s1.addText("(888) 516-3399", {
  x: 2.5, y: 2.82, w: 8.33, h: 0.65,
  fontSize: 40, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center", valign: "middle",
});

// ── HOW IT WORKS — 4 examples in a row ──
s1.addText("HOW IT WORKS", {
  x: 0.5, y: 3.75, w: 12.33, h: 0.35,
  fontSize: 18, fontFace: "Arial Black", color: "C9A227", align: "center",
});

const examples = [
  { icon: "🔧", cmd: '"plumber 11205"', result: "Get plumber contacts\nin Williamsburg" },
  { icon: "🏷️", cmd: '"specials williamsburg"', result: "See grocery store\ndeals & prices" },
  { icon: "🕍", cmd: '"mincha 11225"', result: "Find minyan times\nnear you" },
  { icon: "🚗", cmd: '"rent a car"', result: "Car rental options\ninstantly" },
];

examples.forEach((ex, i) => {
  const x = 0.5 + i * 3.15;
  s1.addShape(pres.ShapeType.roundRect, {
    x, y: 4.2, w: 2.95, h: 1.65, rectRadius: 0.1,
    fill: { color: "162F50" }, line: { color: "2D5A87", width: 1 },
  });
  s1.addText(ex.icon, { x, y: 4.25, w: 2.95, h: 0.45, fontSize: 28, align: "center" });
  s1.addText([
    { text: "TXT ", options: { fontSize: 10, color: "8EACC9", fontFace: "Arial" } },
    { text: ex.cmd, options: { fontSize: 13, color: "C9A227", fontFace: "Arial", bold: true } },
  ], { x: x + 0.1, y: 4.72, w: 2.75, h: 0.35, align: "center" });
  s1.addText(ex.result, { x: x + 0.1, y: 5.1, w: 2.75, h: 0.65, fontSize: 11, color: "CADCFC", fontFace: "Arial", lineSpacing: 14, align: "center" });
});

// ── Features bar ──
s1.addShape(pres.ShapeType.rect, { x: 0, y: 6.1, w: 13.33, h: 0.85, fill: { color: "0D2847" } });
const feats = [
  { val: "17,000+", lbl: "Businesses" },
  { val: "🏷️", lbl: "Store Specials" },
  { val: "🕍", lbl: "Minyan Times" },
  { val: "📱", lbl: "Any Kosher Phone" },
];
feats.forEach((f, i) => {
  const x = 0.8 + i * 3.1;
  s1.addText(f.val, { x, y: 6.12, w: 2.7, h: 0.45, fontSize: 22, fontFace: "Arial Black", color: "C9A227", align: "center" });
  s1.addText(f.lbl, { x, y: 6.52, w: 2.7, h: 0.35, fontSize: 11, fontFace: "Arial", color: "8EACC9", align: "center" });
});

// ── Bottom section ──
s1.addText("🌐  English  •  עברית  •  אידיש", {
  x: 0.5, y: 7.1, w: 5.5, h: 0.3,
  fontSize: 13, fontFace: "Arial", color: "CADCFC", align: "left",
});
s1.addText("connect2kehilla.com", {
  x: 7, y: 7.1, w: 5.83, h: 0.3,
  fontSize: 13, fontFace: "Arial", color: "CADCFC", align: "right",
});

// Gold bottom bar + tagline
s1.addShape(pres.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: "C9A227" } });

// ═══════════════════════════════════════════════
// FLYER 2 — FOR BUSINESSES
// ═══════════════════════════════════════════════
const s2 = pres.addSlide();
s2.background = { color: "FFFFFF" };

// Dark header
s2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 2.35, fill: { color: "1E3A5F" } });
s2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: "059669" } });

s2.addText("Connect2Kehilla", {
  x: 0.5, y: 0.2, w: 12.33, h: 0.6,
  fontSize: 36, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center",
});
s2.addText("Get Your Business Found by Kosher Phone Users", {
  x: 0.5, y: 0.8, w: 12.33, h: 0.45,
  fontSize: 20, fontFace: "Georgia", color: "059669", italic: true, align: "center",
});

// Key message badge
s2.addShape(pres.ShapeType.roundRect, {
  x: 2.5, y: 1.45, w: 8.33, h: 0.6, rectRadius: 0.12,
  fill: { color: "059669" },
});
s2.addText("Reach Customers Who CAN'T Google You!", {
  x: 2.5, y: 1.45, w: 8.33, h: 0.6,
  fontSize: 20, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle",
});

// ── 6 benefit cards — 3x2 grid ──
s2.addText("WHY LIST YOUR BUSINESS", {
  x: 0.5, y: 2.55, w: 12.33, h: 0.35,
  fontSize: 18, fontFace: "Arial Black", color: "1E3A5F", align: "center",
});

const benefits = [
  { icon: "📲", title: "SMS Search Results", desc: "Customers text a keyword → YOUR business shows up instantly" },
  { icon: "⭐", title: "Premium Listing", desc: "Always appear FIRST — above all free listings" },
  { icon: "📊", title: "Lead Tracking", desc: "See how many customers found you through our service" },
  { icon: "🌐", title: "Multi-Language", desc: "Found by English, Hebrew & Yiddish speakers" },
  { icon: "📱", title: "Kosher Phone Ready", desc: "Your clients don't need internet to find you" },
  { icon: "🏪", title: "17,000+ Directory", desc: "Join the largest kosher phone business directory" },
];

benefits.forEach((b, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.5 + col * 4.2;
  const y = 3.05 + row * 1.15;

  s2.addShape(pres.ShapeType.roundRect, {
    x, y, w: 3.95, h: 0.95, rectRadius: 0.08,
    fill: { color: "F0FDF4" }, line: { color: "059669", width: 1.2 },
  });
  s2.addText(b.icon, { x: x + 0.05, y: y + 0.1, w: 0.6, h: 0.6, fontSize: 26, align: "center", valign: "middle" });
  s2.addText(b.title, { x: x + 0.65, y: y + 0.08, w: 3.1, h: 0.3, fontSize: 13, fontFace: "Arial", color: "1E3A5F", bold: true });
  s2.addText(b.desc, { x: x + 0.65, y: y + 0.4, w: 3.1, h: 0.45, fontSize: 10, fontFace: "Arial", color: "555555", lineSpacing: 13 });
});

// ── How customers find you — demo ──
s2.addShape(pres.ShapeType.roundRect, {
  x: 0.5, y: 5.5, w: 12.33, h: 1.1, rectRadius: 0.12,
  fill: { color: "1E3A5F" },
});
s2.addText("HOW CUSTOMERS FIND YOU", {
  x: 0.5, y: 5.55, w: 12.33, h: 0.25,
  fontSize: 12, fontFace: "Arial Black", color: "059669", align: "center",
});
s2.addText([
  { text: 'Customer texts: ', options: { fontSize: 13, color: "8EACC9" } },
  { text: '"plumber Williamsburg"', options: { fontSize: 15, color: "FFFFFF", bold: true } },
  { text: '   ➜   ', options: { fontSize: 18, color: "059669" } },
  { text: 'They get: ', options: { fontSize: 13, color: "8EACC9" } },
  { text: 'YOUR business name + phone', options: { fontSize: 15, color: "C9A227", bold: true } },
], { x: 0.8, y: 5.85, w: 11.73, h: 0.35, fontFace: "Arial", align: "center" });
s2.addText("No website needed. No app needed. Works on ANY kosher phone.", {
  x: 0.8, y: 6.2, w: 11.73, h: 0.25,
  fontSize: 11, fontFace: "Arial", color: "CADCFC", align: "center", italic: true,
});

// ── CTA — Green bottom ──
s2.addShape(pres.ShapeType.rect, { x: 0, y: 6.8, w: 13.33, h: 0.72, fill: { color: "059669" } });

s2.addText("LIST YOUR BUSINESS TODAY", {
  x: 0.5, y: 6.8, w: 3.5, h: 0.72,
  fontSize: 16, fontFace: "Arial Black", color: "FFFFFF", align: "center", valign: "middle",
});

// 3 contact methods inline
const contacts = [
  { icon: "📞", label: "CALL", val: "(888) 516-3399" },
  { icon: "📧", label: "EMAIL", val: "list@connect2kehilla.com" },
  { icon: "🌐", label: "VISIT", val: "connect2kehilla.com" },
];
contacts.forEach((c, i) => {
  const x = 4.2 + i * 3.1;
  s2.addText([
    { text: `${c.icon} ${c.label}: `, options: { fontSize: 10, color: "B0F0D0" } },
    { text: c.val, options: { fontSize: 12, color: "FFFFFF", bold: true } },
  ], { x, y: 6.8, w: 3, h: 0.72, fontFace: "Arial", valign: "middle" });
});

// Pricing strip
s2.addShape(pres.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: "047857" } });

const outPath = "/Users/admin/Documents/ПАРНОСА/WEBSITES/connect2kehilla/flyers/Connect2Kehilla-Flyers.pptx";
pres.writeFile({ fileName: outPath }).then(() => console.log("Created: " + outPath));

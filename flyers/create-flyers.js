const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

pres.layout = "LAYOUT_WIDE";
pres.defineLayout({ name: "FLYER", w: 10, h: 13 });
pres.layout = "FLYER";

// ═══════════════════════════════════════════════
// FLYER 1 — FOR CONSUMERS
// ═══════════════════════════════════════════════
const s1 = pres.addSlide();

// Dark blue background
s1.background = { color: "1E3A5F" };

// Gold accent bar at top
s1.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.15, fill: { color: "C9A227" } });

// Title block
s1.addText("Connect2Kehilla", {
  x: 0.5, y: 0.5, w: 9, h: 0.9,
  fontSize: 48, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center",
});
s1.addText("Your Community at Your Fingertips", {
  x: 0.5, y: 1.35, w: 9, h: 0.5,
  fontSize: 22, fontFace: "Georgia", color: "C9A227", italic: true, align: "center",
});

// Kosher Phone badge
s1.addShape(pres.ShapeType.roundRect, {
  x: 2, y: 2.1, w: 6, h: 0.7, rectRadius: 0.15,
  fill: { color: "C9A227" },
});
s1.addText("📱  THE SMS DIRECTORY FOR KOSHER PHONE USERS", {
  x: 2, y: 2.1, w: 6, h: 0.7,
  fontSize: 16, fontFace: "Arial", color: "1E3A5F", bold: true, align: "center", valign: "middle",
});

// "No Internet Needed" subtitle
s1.addText("No Internet Needed — Just Text What You Need!", {
  x: 0.5, y: 3.0, w: 9, h: 0.4,
  fontSize: 18, fontFace: "Arial", color: "FFFFFF", align: "center",
});

// Phone number — BIG
s1.addShape(pres.ShapeType.roundRect, {
  x: 1.5, y: 3.6, w: 7, h: 1.1, rectRadius: 0.2,
  fill: { color: "0D2847" }, line: { color: "C9A227", width: 3 },
});
s1.addText("TEXT US NOW", {
  x: 1.5, y: 3.65, w: 7, h: 0.35,
  fontSize: 14, fontFace: "Arial", color: "C9A227", bold: true, align: "center",
});
s1.addText("(888) 516-3399", {
  x: 1.5, y: 3.95, w: 7, h: 0.7,
  fontSize: 44, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center", valign: "middle",
});

// How it works section
s1.addText("HOW IT WORKS", {
  x: 0.5, y: 5.0, w: 9, h: 0.4,
  fontSize: 20, fontFace: "Arial Black", color: "C9A227", align: "center",
});

// Example cards — 2x2 grid
const examples = [
  { icon: "🔧", text: '"plumber 11211"', result: "Get plumber contacts\nin Williamsburg" },
  { icon: "🏷️", text: '"specials"', result: "See grocery store\ndeals & prices" },
  { icon: "🕍", text: '"mincha 11225"', result: "Find minyan times\nnear you" },
  { icon: "🏦", text: '"Alma Bank"', result: "Get business info\ninstantly" },
];

examples.forEach((ex, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.6 + col * 4.6;
  const y = 5.6 + row * 1.5;

  s1.addShape(pres.ShapeType.roundRect, {
    x, y, w: 4.3, h: 1.3, rectRadius: 0.12,
    fill: { color: "162F50" }, line: { color: "2D5A87", width: 1 },
  });
  s1.addText(ex.icon, { x: x + 0.15, y: y + 0.15, w: 0.7, h: 0.7, fontSize: 32, align: "center", valign: "middle" });
  s1.addText([
    { text: "Text: ", options: { fontSize: 13, color: "8EACC9", fontFace: "Arial" } },
    { text: ex.text, options: { fontSize: 15, color: "C9A227", fontFace: "Arial", bold: true } },
  ], { x: x + 0.85, y: y + 0.1, w: 3.2, h: 0.45 });
  s1.addText(ex.result, { x: x + 0.85, y: y + 0.55, w: 3.2, h: 0.65, fontSize: 12, color: "CADCFC", fontFace: "Arial", lineSpacing: 16 });
});

// Features row
const features = [
  { num: "17,000+", label: "Businesses" },
  { num: "🏷️", label: "Store Specials" },
  { num: "🕍", label: "Minyan Times" },
  { num: "📱", label: "Any Kosher Phone" },
];

s1.addShape(pres.ShapeType.rect, { x: 0, y: 8.8, w: 10, h: 1.3, fill: { color: "0D2847" } });
features.forEach((f, i) => {
  const x = 0.4 + i * 2.4;
  s1.addText(f.num, { x, y: 8.9, w: 2.1, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: "C9A227", align: "center", valign: "middle" });
  s1.addText(f.label, { x, y: 9.5, w: 2.1, h: 0.4, fontSize: 12, fontFace: "Arial", color: "8EACC9", align: "center" });
});

// Languages
s1.addText("🌐  English  •  עברית  •  אידיש", {
  x: 0.5, y: 10.3, w: 9, h: 0.4,
  fontSize: 16, fontFace: "Arial", color: "FFFFFF", align: "center",
});

// Tagline
s1.addText("Text.  Find.  Connect.", {
  x: 0.5, y: 10.8, w: 9, h: 0.6,
  fontSize: 30, fontFace: "Georgia", color: "C9A227", italic: true, align: "center", bold: true,
});

// Bottom bar
s1.addShape(pres.ShapeType.rect, { x: 0, y: 11.6, w: 10, h: 0.6, fill: { color: "C9A227" } });
s1.addText("connect2kehilla.com  •  (888) 516-3399  •  Text HELP for menu", {
  x: 0, y: 11.6, w: 10, h: 0.6,
  fontSize: 14, fontFace: "Arial", color: "1E3A5F", bold: true, align: "center", valign: "middle",
});

// Gold accent bar at bottom
s1.addShape(pres.ShapeType.rect, { x: 0, y: 12.2, w: 10, h: 0.08, fill: { color: "C9A227" } });

// Free text
s1.addText("FREE  •  No App Download  •  No Internet Required", {
  x: 0.5, y: 12.35, w: 9, h: 0.4,
  fontSize: 12, fontFace: "Arial", color: "8EACC9", align: "center",
});

// ═══════════════════════════════════════════════
// FLYER 2 — FOR BUSINESSES
// ═══════════════════════════════════════════════
const s2 = pres.addSlide();

s2.background = { color: "FFFFFF" };

// Dark header
s2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 3.2, fill: { color: "1E3A5F" } });
s2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.12, fill: { color: "059669" } });

s2.addText("Get Your Business Found", {
  x: 0.5, y: 0.4, w: 9, h: 0.8,
  fontSize: 42, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center",
});
s2.addText("by 1000s of Kosher Phone Users", {
  x: 0.5, y: 1.15, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Georgia", color: "059669", italic: true, align: "center",
});

// Key message badge
s2.addShape(pres.ShapeType.roundRect, {
  x: 1.2, y: 2.0, w: 7.6, h: 0.8, rectRadius: 0.15,
  fill: { color: "059669" },
});
s2.addText("Reach Customers Who CAN'T Google You!", {
  x: 1.2, y: 2.0, w: 7.6, h: 0.8,
  fontSize: 22, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle",
});

// Benefits section
s2.addText("WHY LIST YOUR BUSINESS", {
  x: 0.5, y: 3.5, w: 9, h: 0.5,
  fontSize: 22, fontFace: "Arial Black", color: "1E3A5F", align: "center",
});

const benefits = [
  { icon: "📲", title: "SMS Search Results", desc: "Customers text a keyword — YOUR business shows up" },
  { icon: "⭐", title: "Premium Listing", desc: "Always appear FIRST in search results" },
  { icon: "📊", title: "Lead Tracking", desc: "See how many customers found you through us" },
  { icon: "🌐", title: "Multi-Language", desc: "Found by English, Hebrew & Yiddish speakers" },
  { icon: "📱", title: "Kosher Phone Ready", desc: "Your clients don't need internet to find you" },
  { icon: "🏪", title: "17,000+ Businesses", desc: "Join the largest kosher phone directory" },
];

benefits.forEach((b, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.5 + col * 4.8;
  const y = 4.2 + row * 1.4;

  s2.addShape(pres.ShapeType.roundRect, {
    x, y, w: 4.5, h: 1.2, rectRadius: 0.1,
    fill: { color: "F0FDF4" }, line: { color: "059669", width: 1.5 },
  });
  s2.addText(b.icon, { x: x + 0.1, y: y + 0.15, w: 0.8, h: 0.8, fontSize: 32, align: "center", valign: "middle" });
  s2.addText(b.title, { x: x + 0.95, y: y + 0.12, w: 3.3, h: 0.4, fontSize: 16, fontFace: "Arial", color: "1E3A5F", bold: true });
  s2.addText(b.desc, { x: x + 0.95, y: y + 0.52, w: 3.3, h: 0.55, fontSize: 12, fontFace: "Arial", color: "555555", lineSpacing: 15 });
});

// How it works for user (demo)
s2.addShape(pres.ShapeType.roundRect, {
  x: 0.5, y: 8.6, w: 9, h: 1.6, rectRadius: 0.15,
  fill: { color: "1E3A5F" },
});
s2.addText("HOW CUSTOMERS FIND YOU", {
  x: 0.5, y: 8.7, w: 9, h: 0.4,
  fontSize: 16, fontFace: "Arial Black", color: "059669", align: "center",
});
s2.addText([
  { text: 'Customer texts: ', options: { fontSize: 14, color: "8EACC9" } },
  { text: '"plumber Williamsburg"', options: { fontSize: 16, color: "FFFFFF", bold: true } },
], { x: 0.8, y: 9.1, w: 8.4, h: 0.35, fontFace: "Arial", align: "center" });
s2.addText("➜", { x: 4.3, y: 9.45, w: 1.4, h: 0.35, fontSize: 24, color: "059669", align: "center" });
s2.addText([
  { text: 'They get: ', options: { fontSize: 14, color: "8EACC9" } },
  { text: 'YOUR business name + phone number', options: { fontSize: 16, color: "C9A227", bold: true } },
], { x: 0.8, y: 9.75, w: 8.4, h: 0.35, fontFace: "Arial", align: "center" });

// CTA section
s2.addShape(pres.ShapeType.rect, { x: 0, y: 10.5, w: 10, h: 2.5, fill: { color: "059669" } });

s2.addText("LIST YOUR BUSINESS TODAY", {
  x: 0.5, y: 10.6, w: 9, h: 0.5,
  fontSize: 24, fontFace: "Arial Black", color: "FFFFFF", align: "center",
});

// Three contact methods
const contacts = [
  { icon: "📞", method: "CALL", value: "(888) 516-3399" },
  { icon: "📧", method: "EMAIL", value: "list@connect2kehilla.com" },
  { icon: "🌐", method: "VISIT", value: "connect2kehilla.com" },
];
contacts.forEach((c, i) => {
  const x = 0.5 + i * 3.2;
  s2.addText(c.icon, { x, y: 11.15, w: 2.9, h: 0.4, fontSize: 24, align: "center" });
  s2.addText(c.method, { x, y: 11.5, w: 2.9, h: 0.3, fontSize: 12, fontFace: "Arial", color: "B0F0D0", bold: true, align: "center" });
  s2.addText(c.value, { x, y: 11.75, w: 2.9, h: 0.35, fontSize: 14, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center" });
});

// Pricing
s2.addShape(pres.ShapeType.roundRect, {
  x: 2.5, y: 12.2, w: 5, h: 0.5, rectRadius: 0.1,
  fill: { color: "047857" },
});
s2.addText("Free Basic Listing  •  Premium Plans Available", {
  x: 2.5, y: 12.2, w: 5, h: 0.5,
  fontSize: 13, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle",
});

const outPath = "/Users/admin/Documents/ПАРНОСА/WEBSITES/connect2kehilla/flyers/Connect2Kehilla-Flyers.pptx";
pres.writeFile({ fileName: outPath }).then(() => console.log("Created: " + outPath));

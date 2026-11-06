// Vetoriza a palavra do portal na fonte real do site. Exige `npm start` na porta 3140.
import { chromium } from "playwright-core";
import potrace from "potrace";
import sharp from "sharp";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";

const WORD = "SAÚDE";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 2400, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await p.goto("http://localhost:3140", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.evaluate((word) => {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-bodoni").trim();
  document.body.innerHTML = `<div id="w">${word.split("").map((c) => `<span>${c}</span>`).join("")}</div>`;
  const el = document.getElementById("w");
  Object.assign(el.style, { position: "fixed", left: "60px", top: "90px", background: "#fff", color: "#000", padding: "60px 40px 20px", fontFamily: family, fontWeight: "500", fontSize: "460px", lineHeight: "1", fontOpticalSizing: "none", fontVariationSettings: "'opsz' 28", whiteSpace: "nowrap" });
}, WORD);
await p.evaluate((word) => document.fonts.load(`500 460px ${getComputedStyle(document.documentElement).getPropertyValue("--font-bodoni").trim()}`, word), WORD);
await p.waitForTimeout(600);
const box = await p.locator("#w").boundingBox();
const letters = await p.$$eval("#w span", (s, ox) => s.map((e) => { const r = e.getBoundingClientRect(); return { l: (r.left - ox) * 2, r: (r.right - ox) * 2 }; }), box.x);
const png = await p.locator("#w").screenshot({ path: new URL("../qa/out/glyph.png", import.meta.url).pathname });
await b.close();

// Apara a borda da captura: sem isso, o limite do elemento vira um fio no vetor.
const meta = await sharp(png).metadata();
const EDGE = 6;
const clean = await sharp(png).extract({ left: EDGE, top: EDGE, width: meta.width - EDGE * 2, height: meta.height - EDGE * 2 }).png().toBuffer();
const { data, info } = await sharp(clean).grayscale().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, row = Math.round(H * 0.62);
// Haste grossa do D: é por dentro dela que a câmera atravessa.
let best = { len: 0, x: 0 }, run = 0;
for (let x = Math.round(letters[3].l) - EDGE; x < letters[3].r - EDGE; x++) {
  if (data[row * W + x] < 128) { run++; if (run > best.len) best = { len: run, x: x - run / 2 }; } else run = 0;
}
const svg = await promisify(potrace.trace)(clean, { threshold: 128, turdSize: 40, optTolerance: 0.5 });
const d = svg.match(/ d="([^"]+)"/)[1];
await writeFile(new URL("../../src/lib/glyph.ts", import.meta.url), `// Gerado por tools/media/glyph.mjs a partir da fonte do site.\nexport const GLYPH = { word: ${JSON.stringify(WORD)}, width: ${W}, height: ${H}, portal: { x: ${Math.round(best.x)}, y: ${row}, stem: ${best.len} }, d: ${JSON.stringify(d)} };\n`);
if (best.len < 40) throw new Error("Haste do D não encontrada: a fonte não carregou.");
console.log({ W, H, stem: best, bytes: d.length });

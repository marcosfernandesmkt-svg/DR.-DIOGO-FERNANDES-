// Percorre a página e mede onde a tela fica vazia. Exige `npm start` na porta 3140.
// Uma posição conta como vazia quando quase nenhum pixel se destaca do fundo.
import { chromium } from "playwright-core";
import sharp from "sharp";

const views = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844, hasTouch: true, isMobile: true },
];
const STEP = 0.1; // em alturas de tela
const b = await chromium.launch({ channel: "chrome" });

for (const v of views) {
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, hasTouch: v.hasTouch, isMobile: v.isMobile });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3140", { waitUntil: "load" });
  await p.waitForTimeout(3200);
  // Esconde o cabeçalho: ele aparece em toda posição e mascararia a medição.
  await p.addStyleTag({ content: "header{visibility:hidden!important}" });
  const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const gaps = [];
  let run = null;
  for (let y = 0; y <= total; y += v.height * STEP) {
    await p.evaluate((t) => scrollTo({ top: t, behavior: "instant" }), y);
    await p.waitForTimeout(520);
    const buf = await p.screenshot({ type: "png" });
    const { data, info } = await sharp(buf).resize(160).greyscale().raw().toBuffer({ resolveWithObject: true });
    let lit = 0;
    for (let i = 0; i < data.length; i++) if (data[i] > 56) lit++;
    const share = lit / (info.width * info.height);
    if (share < 0.004) {
      run ??= { from: y, to: y };
      run.to = y;
    } else if (run) {
      gaps.push(run);
      run = null;
    }
  }
  if (run) gaps.push(run);
  const label = await p.evaluate(() => [...document.querySelectorAll("section, footer")].map((s) => ({ name: s.getAttribute("aria-label") ?? s.id ?? s.tagName, top: s.getBoundingClientRect().top + scrollY })));
  console.log(`\n${v.name}: ${Math.round((total / v.height) * 100) / 100} telas de rolagem`);
  if (!gaps.length) console.log("  nenhum intervalo vazio");
  for (const g of gaps) {
    const screens = (g.to - g.from) / v.height + STEP;
    const near = label.filter((l) => l.top <= g.to).at(-1)?.name;
    console.log(`  vazio por ${screens.toFixed(1)} tela(s), de ${Math.round(g.from)}px a ${Math.round(g.to)}px, perto de "${near}"`);
  }
  await ctx.close();
}
await b.close();

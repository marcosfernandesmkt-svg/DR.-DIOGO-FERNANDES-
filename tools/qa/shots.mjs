// QA visual: node tools/qa/shots.mjs [base] — exige o site rodando (dev ou start).
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] ?? "http://localhost:3140";
const out = new URL("./out/", import.meta.url).pathname;
await mkdir(out, { recursive: true });
const b = await chromium.launch({ channel: "chrome" });
const views = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180, hasTouch: true },
  { name: "mobile", width: 390, height: 844, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
];
for (const v of views) {
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, hasTouch: v.hasTouch, isMobile: v.isMobile, deviceScaleFactor: v.deviceScaleFactor ?? 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => ["error", "warning"].includes(m.type()) && errs.push(m.text().slice(0, 240)));
  p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}${v.name}-00-intro.jpg`, quality: 70, type: "jpeg" });
  await p.waitForTimeout(3600);
  await p.screenshot({ path: `${out}${v.name}-01-hero.jpg`, quality: 80, type: "jpeg" });
  const go = async (y, n) => {
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}${v.name}-${n}.jpg`, quality: 80, type: "jpeg" });
  };
  const track = await p.evaluate(() => document.querySelector(".hero-track").offsetHeight - innerHeight);
  const innerH = v.height;
  const hv = v.height;
  await go(hv * 0.72, "02-frase");
  for (const [f, n] of [[0.86, "a"], [0.96, "b"], [1.06, "c"], [1.2, "d"], [1.4, "e"]]) await go(hv * f, `02-passagem-${n}`);
  const top = (sel) => p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  const pt = await top(".portrait-track");
  const ptLen = await p.evaluate(() => document.querySelector(".portrait-track").offsetHeight - innerHeight);
  await go(pt + ptLen * 0.42, "03-retrato");
  await go(pt + ptLen * 0.72, "03b-camada");
  await go(pt + ptLen * 0.97, "03c-camada");
  await go(await top("#sobre") + 10, "04-filosofia");
  const gt = await top(".glyph-track");
  const gl = await p.evaluate(() => document.querySelector(".glyph-track").offsetHeight - innerHeight);
  for (const f of [0.1, 0.25, 0.42, 0.56, 0.7, 0.8, 0.99]) await go(gt + gl * f, `05-portal-${String(Math.round(f * 100)).padStart(2, "0")}`);
  const at0 = await top("#atuacao");
  await go(at0 - v.height * 0.62, "06-linha-a");
  await go(at0 - v.height * 0.46, "06-linha-b");
  await go(at0, "06-atuacao");
  const bk = await top("#agendar");
  await go(bk - 30, "07-agendar");
  await go(bk + 420, "07b");
  const end = await p.evaluate(() => document.querySelector("main").offsetHeight);
  await go(end - v.height * 0.55, "08-rodape-a");
  await go(end + 200, "08-rodape-b");
  const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight, bodyOverflow: getComputedStyle(document.body).overflowY }));
  console.log(v.name, ov, errs.length ? errs : "sem erros");
  await ctx.close();
}
await b.close();

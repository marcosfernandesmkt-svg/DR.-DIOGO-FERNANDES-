// Percorre a clínica virtual com GPU real. Exige `npm start` na porta 3140.
import { chromium } from "playwright-core";
import sharp from "sharp";
const out = new URL("./out/", import.meta.url).pathname;
const only = process.argv[2];
// GPU simulada em software: confere fluxo e imagem; fps e tempos não valem como medida.
const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const v of [{ n: "d", width: 1440, height: 900 }, { n: "m", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }].filter((x) => !only || x.n === only)) {
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.isMobile, hasTouch: v.hasTouch, deviceScaleFactor: v.deviceScaleFactor ?? 1 });
  await ctx.route(/wa\.me|wa\.link|whatsapp\.com/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("crash", () => console.log("PAGINA CAIU", v.n));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 200)));
  const names = [];
  const snap = async (n) => { await p.screenshot({ path: `${out}cl-${v.n}-${n}.jpg`, type: "jpeg", quality: 82 }); names.push(`cl-${v.n}-${n}.jpg`); };
  await p.goto("http://localhost:3140", { waitUntil: "load" });
  await p.waitForTimeout(5000);
  console.log(v.n, "scrollY na abertura:", await p.evaluate(() => scrollY));
  await snap("0-abertura");
  const kb = await p.evaluate(() => performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").reduce((a, r) => a + r.encodedBodySize, 0) / 1024);
  const before = await p.evaluate(() => performance.getEntriesByType("resource").length);
  await p.locator('button:has-text("Marque seu atendimento")').click();
  const t0 = Date.now();
  await p.waitForTimeout(1300);
  await snap("1-boasvindas");
  await p.waitForTimeout(2600);
  await snap("2-fachada");
  await p.waitForTimeout(900);
  await snap("3-portas");
  await p.waitForTimeout(900);
  await snap("4-travessia");
  await p.waitForSelector('[role="dialog"] ul a', { timeout: 15000 });
  const reached = Date.now() - t0;
  await p.waitForTimeout(1600);
  await snap("5-salao");
  if (!v.isMobile) {
    await p.locator('[role="dialog"] ul a').nth(1).hover();
    await p.waitForTimeout(900);
    await snap("6-hover");
  }
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const s = performance.now(); const f = () => { n++; performance.now() - s < 2000 ? requestAnimationFrame(f) : res(Math.round(n / 2)); }; f(); }));
  const pop = p.waitForEvent("popup", { timeout: 2500 }).catch(() => null);
  await p.locator('[role="dialog"] ul a').nth(0)[v.isMobile ? "tap" : "click"]();
  await p.waitForTimeout(450);
  await snap("7-escolha");
  const tab = await pop;
  console.log(v.n, { kbScriptsAntes: Math.round(kb), recursos: before, salaoEmMs: reached, fps, abriuGuia: !!tab, erros: errs });
  await tab?.close();
  const H = v.n === "d" ? 300 : 430;
  const items = await Promise.all(names.map((f) => sharp(out + f).resize({ height: H }).toBuffer()));
  const w = (await sharp(items[0]).metadata()).width, cols = v.n === "d" ? 4 : 7;
  await sharp({ create: { width: cols * (w + 8), height: Math.ceil(names.length / cols) * (H + 8), channels: 3, background: "#444" } }).composite(items.map((input, i) => ({ input, left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (H + 8) }))).jpeg({ quality: 84 }).toFile(`${out}cl-sheet-${v.n}.jpg`);
  await ctx.close();
}
await b.close();

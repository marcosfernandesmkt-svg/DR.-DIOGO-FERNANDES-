// Mede a fluidez da abertura e confirma que o fundo se move. Exige `npm start` na porta 3140.
import { chromium } from "playwright-core";
import sharp from "sharp";
const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const fpsOf = (p) => p.evaluate(() => new Promise((res) => { let n = 0, worst = 0, last = performance.now(); const s = last; const f = (t) => { n++; worst = Math.max(worst, t - last); last = t; t - s < 3000 ? requestAnimationFrame(f) : res({ fps: Math.round(n / 3), piorQuadroMs: Math.round(worst) }); }; requestAnimationFrame(f); }));
for (const v of [{ n: "desktop", width: 1440, height: 900 }, { n: "celular", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]) {
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.isMobile, hasTouch: v.hasTouch, deviceScaleFactor: v.deviceScaleFactor ?? 1 });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://localhost:3140", { waitUntil: "load" });
  await p.waitForTimeout(4500);
  const gpu = await p.evaluate(() => { const g = document.createElement("canvas").getContext("webgl"); const d = g?.getExtension("WEBGL_debug_renderer_info"); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : "sem webgl"; });
  const box = v.n === "desktop" ? { x: 1100, y: 120, width: 300, height: 220 } : { x: 0, y: 70, width: 390, height: 60 };
  const a = await sharp(await p.screenshot({ clip: box })).greyscale().raw().toBuffer();
  await p.waitForTimeout(2500);
  const c = await sharp(await p.screenshot({ clip: box })).greyscale().raw().toBuffer();
  let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - c[i]);
  console.log(v.n, { gpu: gpu.slice(0, 44), ...(await fpsOf(p)), mudancaFundo: +(d / a.length).toFixed(2), vivo: await p.evaluate(() => getComputedStyle(document.querySelector(".hero-cells canvas")).opacity), erros: errs.length });
  await ctx.close();
}
await b.close();

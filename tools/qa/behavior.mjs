// Testes de comportamento: node tools/qa/behavior.mjs — exige `npm start` na porta 3140.
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE ?? "http://localhost:3140";
const out = new URL("./out/", import.meta.url).pathname;
await mkdir(out, { recursive: true });

const EXPECTED = [
  "https://wa.me/5528999013592?text=Quero+agendar+minha+consulta+com+Dr.+Diogo+Fernandes",
  "https://api.whatsapp.com/send/?phone=5522998485333&text=",
  "https://wa.me/5528999321307?text=Quero+agendar+minha+consulta+com+Dr.+Diogo+Fernandes",
  "https://wa.me/5528999183137?text=Ol%C3%A1%21+Gostaria+de+agendar+uma+consulta+na+Endocrinologia+com+Dr+Diogo+Fernandes.",
  "https://wa.link/vus96f",
  "https://wa.me/5528999013592?text=Quero+agendar+minha+consulta+on-line+com+Dr.+Diogo+Fernandes",
];

let fails = 0;
const ok = (c, m, x = "") => {
  console.log(`${c ? "PASS " : "FALHA"} ${m} ${x}`);
  if (!c) fails++;
};
const b = await chromium.launch({ channel: "chrome" });
const stub = (ctx) => ctx.route(/wa\.me|wa\.link|whatsapp\.com/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
const rows = "section#agendar ul a";
const gotoBooking = async (p) => {
  await p.evaluate(() => document.querySelector("#agendar ul").scrollIntoView({ behavior: "instant", block: "center" }));
  await p.waitForTimeout(1100);
};

// Links e clique
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await stub(ctx);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(base);
  await p.waitForTimeout(3800);
  const hrefs = await p.$$eval(rows, (a) => a.map((x) => x.getAttribute("href")));
  ok(JSON.stringify(hrefs) === JSON.stringify(EXPECTED), "seis destinos idênticos ao briefing", `(${hrefs.length})`);
  ok(await p.$$eval(rows, (a) => a.every((x) => x.target === "_blank" && x.rel.includes("noopener"))), "nova guia e noopener em todos");
  await gotoBooking(p);
  for (let i = 0; i < 6; i++) {
    const t0 = Date.now();
    let openedAt = 0;
    const pop = p.waitForEvent("popup", { timeout: 2500 }).then((t) => ((openedAt = Date.now()), t)).catch(() => null);
    await p.locator(rows).nth(i).click();
    await p.waitForTimeout(350);
    const overlay = await p.locator('[role="status"]').innerText().catch(() => "");
    if (i === 0) await p.screenshot({ path: `${out}click-overlay.jpg`, quality: 80, type: "jpeg" });
    const tab = await pop;
    const opened = openedAt - t0;
    await tab?.waitForURL(EXPECTED[i], { timeout: 3000 }).catch(() => {});
    ok(!!tab && tab.url() === EXPECTED[i] && opened < 700, `clique ${i + 1} abre a guia no gesto e chega ao destino`, `${opened}ms`);
    ok(/SERÁ UM PRAZER/i.test(overlay) && /direcionado/i.test(overlay), `transição ${i + 1} com a mensagem`);
    await tab?.close();
    await p.bringToFront();
    await p.waitForTimeout(1800);
    ok((await p.locator('[role="status"]').count()) === 0, `transição ${i + 1} se fecha sozinha`);
  }
  // Cmd+clique abre em segundo plano: conta como nova página, não como popup.
  const bg = ctx.waitForEvent("page", { timeout: 1500 }).catch(() => null);
  await p.locator(rows).nth(0).click({ modifiers: ["Meta"] });
  const pg = await bg;
  ok(!!pg && (await p.locator('[role="status"]').count()) === 0, "cmd+clique segue o link nativo, sem transição", pg?.url() ?? "");
  const text = await p.locator("main, footer").allInnerTexts();
  const joined = text.join(" ").toLowerCase();
  ok(/será um prazer receber você/.test(joined), "rodapé com a mensagem");
  ok(/cuidado em cada etapa/.test(joined) && /tireoide/.test(joined), "etapas e novas áreas presentes");
  ok((await p.getAttribute('footer a[href*="instagram.com"]', "href")) === "https://www.instagram.com/drdiogofernandes/", "Instagram correto");
  ok(/um olhar individual para sua saúde/.test(joined) && /seu cuidado começa aqui/.test(joined), "títulos com espaços reais");
  ok((await p.locator("footer img").count()) === 0, "rodapé sem fotografia");
  ok((await p.locator("#sobre img").count()) === 0, "filosofia sem fotografia");
  ok(/nossa filosofia/.test(joined) && /compreender cada pessoa/.test(joined), "filosofia com o texto");
  ok(errs.length === 0, "sem erros de console", errs.join(" | ").slice(0, 200));
  await ctx.close();
}

// Rolagem real por roda, ida e volta
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForTimeout(3800);
  await p.mouse.move(640, 400);
  const track = await p.evaluate(() => document.querySelector(".hero-track").offsetHeight);
  for (let i = 0; i < 40 && (await p.evaluate(() => scrollY)) < track; i++) {
    await p.mouse.wheel(0, 400);
    await p.waitForTimeout(90);
  }
  await p.waitForTimeout(900);
  const y1 = await p.evaluate(() => scrollY);
  ok(y1 >= track - 800, "a roda atravessa a abertura e segue a página", `y=${Math.round(y1)}`);
  for (let i = 0; i < 60 && (await p.evaluate(() => scrollY)) > 5; i++) {
    await p.mouse.wheel(0, -500);
    await p.waitForTimeout(70);
  }
  await p.waitForTimeout(1200);
  const y2 = await p.evaluate(() => scrollY);
  ok(y2 < 5, "retorno natural ao início", `y=${Math.round(y2)}`);
  ok((await p.$eval(".name-a", (e) => +getComputedStyle(e).opacity)) > 0.9, "nome reaparece ao voltar");
  const st = await p.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow, getComputedStyle(document.body).position]);
  ok(!st[0] && !st[1] && st[2] === "static", "nenhum estilo global de bloqueio", JSON.stringify(st));
  await p.keyboard.press("Tab");
  await p.keyboard.press("Tab");
  const f = await p.evaluate(() => document.activeElement.outerHTML.slice(0, 60));
  ok(/href/.test(f), "teclado alcança links", f);
  const gd = await p.evaluate(() => { const t = document.querySelector(".glyph-track"); return t.getBoundingClientRect().top + scrollY + t.offsetHeight - innerHeight; });
  await p.evaluate((y) => scrollTo({ top: y - 2, behavior: "instant" }), gd);
  await p.waitForTimeout(900);
  ok(await p.$eval(".gp-front", (e) => getComputedStyle(e).visibility === "hidden"), "portal termina no desktop");
  await p.evaluate((y) => scrollTo({ top: y * 0.6, behavior: "instant" }), gd);
  await p.waitForTimeout(400);
  await p.evaluate((y) => scrollTo({ top: y - 2000, behavior: "instant" }), gd);
  await p.waitForTimeout(600);
  ok(await p.$eval(".gp-front", (e) => getComputedStyle(e).visibility === "visible"), "portal volta ao rolar para cima");
  // Rodapé: revelado no fim e fora do caminho das clínicas
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await p.waitForTimeout(1200);
  const hit = await p.evaluate(() => { const r = document.querySelector('footer a[href="#topo"]').getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a")?.getAttribute("href"); });
  ok(hit === "#topo", "rodapé visível e clicável no fim da página");
  await p.evaluate(() => document.querySelector("#agendar ul").scrollIntoView({ behavior: "instant", block: "center" }));
  await p.waitForTimeout(700);
  const covered = await p.$$eval(rows, (a) => a.filter((x) => { const r = x.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) return false; return !document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("#agendar"); }).length);
  ok(covered === 0, "nada cobre as clínicas");
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(500);
  // Clínica virtual: abre, pula, mostra os seis destinos reais, fecha e devolve o foco
  await p.locator('button:has-text("Marque seu atendimento")').click();
  await p.waitForSelector('[role="dialog"]');
  const pular = p.locator('[role="dialog"] button[aria-label^="Pular"]');
  await p.waitForTimeout(700);
  if (await pular.isVisible()) await pular.click({ force: true });
  await p.waitForSelector('[role="dialog"] ul a', { timeout: 6000 });
  const inDialog = await p.$$eval('[role="dialog"] ul a', (a) => a.map((x) => x.getAttribute("href")));
  ok(JSON.stringify(inDialog) === JSON.stringify(EXPECTED), "clínica virtual com os seis destinos corretos", `(${inDialog.length})`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  ok((await p.locator('[role="dialog"]').count()) === 0, "Esc fecha a clínica virtual");
  ok(await p.evaluate(() => document.activeElement?.textContent?.includes("Marque seu atendimento")), "foco volta ao botão");
  ok(await p.evaluate(() => !document.body.style.overflow && !document.documentElement.style.overflow), "experiência não bloqueia a página");
  // O "Agendar" do topo abre a mesma clínica virtual do "Marque seu atendimento"
  await p.locator("header a", { hasText: /^agendar$/i }).click();
  await p.waitForTimeout(900);
  ok((await p.locator('[role="dialog"]').count()) === 1, "Agendar do topo abre a clínica virtual");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.activeElement?.textContent?.trim() === "Agendar"), "foco volta ao Agendar do topo");
  // A cortina continua no link "Clínicas" do menu
  await p.evaluate(() => document.querySelector('header nav a[href="#agendar"]').click());
  await p.waitForTimeout(450);
  const mid = await p.$eval(".curtain", (e) => getComputedStyle(e).visibility);
  await p.waitForTimeout(1400);
  const cur = await p.evaluate(() => ({ top: document.querySelector("#agendar").getBoundingClientRect().top, vis: getComputedStyle(document.querySelector(".curtain")).visibility }));
  ok(mid === "visible" && cur.vis === "hidden" && Math.abs(cur.top) < 60, "cortina leva ao agendamento e some", JSON.stringify(cur));
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(600);
  await p.locator('.hero-meta a[aria-label^="Role"]').click();
  await p.waitForTimeout(2200);
  const y3 = await p.evaluate(() => document.querySelector("#retrato").getBoundingClientRect().top);
  ok(Math.abs(y3) < 90, "botão circular avança para o retrato", `top=${Math.round(y3)}`);
  await ctx.close();
}

// Toque
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForTimeout(3800);
  const cdp = await ctx.newCDPSession(p);
  const swipe = (from, to) => cdp.send("Input.synthesizeScrollGesture", { x: 195, y: from, yDistance: to - from, speed: 2400 });
  for (let i = 0; i < 4; i++) await swipe(760, 60);
  await p.waitForTimeout(500);
  const y = await p.evaluate(() => scrollY);
  ok(y > 1500, "gesto de toque rola pela abertura", `y=${Math.round(y)}`);
  for (let i = 0; i < 12; i++) await swipe(60, 780);
  await p.waitForTimeout(500);
  ok((await p.evaluate(() => scrollY)) < 5, "toque volta ao início");
  await p.evaluate(() => document.querySelector("#agendar ul").scrollIntoView({ behavior: "instant", block: "center" }));
  await p.waitForTimeout(900);
  await ctx.route(/wa\.me|wa\.link|whatsapp\.com/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
  const touchPop = p.waitForEvent("popup", { timeout: 1500 }).catch(() => null);
  await p.locator(rows).nth(0).tap();
  const tp = await touchPop;
  ok(!!tp && tp.url().includes("wa.me"), "toque abre o destino direto", tp?.url().slice(0, 40) ?? "");
  await tp?.close();
  const gl = await p.evaluate(() => { const t = document.querySelector(".glyph-track"); return t.getBoundingClientRect().top + scrollY + t.offsetHeight - innerHeight; });
  await p.evaluate((y) => scrollTo({ top: y - 2, behavior: "instant" }), gl);
  await p.waitForTimeout(900);
  ok(await p.$eval(".gp-front", (e) => getComputedStyle(e).visibility === "hidden"), "portal termina no celular");
  const sizes = await p.$$eval(rows, (a) => a.map((x) => Math.round(x.getBoundingClientRect().height)));
  ok(sizes.every((h) => h >= 44), "áreas de toque das clínicas", sizes.join(","));
  await ctx.close();
}

// Movimento reduzido
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", hasTouch: true });
  await stub(ctx);
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForTimeout(800);
  ok(Math.abs((await p.$eval(".hero-track", (e) => e.offsetHeight)) - 844) < 2, "reduzido: abertura com altura de uma tela");
  ok(await p.$eval(".name-b .ch", (e) => getComputedStyle(e).visibility === "visible" && !e.style.transform), "reduzido: nome estático visível");
  await p.screenshot({ path: `${out}reduced-hero.jpg`, quality: 80, type: "jpeg" });
  await gotoBooking(p);
  const pop = p.waitForEvent("popup", { timeout: 500 }).catch(() => null);
  await p.locator(rows).nth(2).click();
  ok(!!(await pop) && (await p.locator('[role="status"]').count()) === 0, "reduzido: link abre direto, sem transição");
  await ctx.close();
}

// Sem JavaScript
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(base);
  ok((await p.$$(rows)).length === 6, "sem JS: seis links presentes");
  ok(/Fernandes/i.test(await p.locator("h1").getAttribute("aria-label")), "sem JS: h1 presente");
  await p.screenshot({ path: `${out}nojs-hero.jpg`, quality: 80, type: "jpeg" });
  await ctx.close();
}

// Telas extremas
for (const [w, h, t] of [[320, 568, 1], [360, 740, 1], [844, 390, 1], [1024, 768, 0], [1920, 1080, 0], [2560, 1300, 0]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!t });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForTimeout(3700);
  await p.screenshot({ path: `${out}size-${w}.jpg`, quality: 78, type: "jpeg" });
  const r = await p.evaluate(() => {
    const c = [...document.querySelectorAll(".name-b .ch")].map((e) => e.getBoundingClientRect());
    return { sw: document.documentElement.scrollWidth, iw: innerWidth, nameR: Math.round(Math.max(...c.map((x) => x.right))), lines: new Set(c.slice(9).map((x) => Math.round(x.top))).size };
  });
  ok(r.sw <= r.iw && r.nameR <= r.iw && r.lines === 1, `${w}x${h} sem overflow e nome inteiro`, JSON.stringify(r));
  await ctx.close();
}

// Quadros da entrada
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "commit" });
  for (const ms of [500, 900, 1300, 1800, 2400, 3200]) {
    await p.waitForTimeout(ms === 500 ? 500 : 340);
    await p.screenshot({ path: `${out}intro-${String(ms).padStart(4, "0")}.jpg`, quality: 70, type: "jpeg" });
  }
  await ctx.close();
}

await b.close();
console.log(fails ? `\n${fails} FALHA(S)` : "\nTudo passou");

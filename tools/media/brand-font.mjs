// Fonte da marca: cada letra é vetorizada do logotipo aprovado (a tipografia dele é desenhada
// sob medida e não existe à venda). Só contém as letras do nome. "ND" é a ligadura do logotipo.
import sharp from "sharp";
import potrace from "potrace";
import opentype from "opentype.js";
import { compress } from "wawoff2";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";

const SRC = new URL("./source/logo-branco.png", import.meta.url).pathname;
const OUT = new URL("../../src/app/fonts/diogo-fernandes-marca.woff2", import.meta.url).pathname;
const S = 4, LEFT = 570, WIDTH = 2426 - LEFT, CAP = 700, trace = promisify(potrace.trace);
const LINES = [
  { top: 0, bottom: 212, capTop: 13, base: 830, letters: ["D", "R", ".", "D", "I", "O", "G", "O"] },
  { top: 252, bottom: 466, capTop: 12, base: 829, letters: ["F", "E", "R", "N", "A", "ND", "E", "S"] },
];
const glyphs = {}, gaps = [];

for (const line of LINES) {
  const { data, info } = await sharp(SRC).extract({ left: LEFT, top: line.top, width: WIDTH, height: line.bottom - line.top }).extractChannel(3)
    .resize({ width: WIDTH * S, kernel: "cubic" }).blur(2).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, label = new Int32Array(W * H), comps = [];
  for (let i = 0; i < W * H; i++) {
    if (data[i] < 128 || label[i]) continue;
    const id = comps.length + 1, stack = [i], box = { id, l: W, r: 0, area: 0 };
    label[i] = id;
    while (stack.length) {
      const p = stack.pop(), x = p % W;
      box.l = Math.min(box.l, x); box.r = Math.max(box.r, x); box.area++;
      for (const q of [p - 1, p + 1, p - W, p + W]) if (q >= 0 && q < W * H && data[q] >= 128 && !label[q]) { label[q] = id; stack.push(q); }
    }
    comps.push(box);
  }
  const letters = comps.filter((c) => c.area > 200).sort((a, b) => a.l - b.l);
  if (letters.length !== line.letters.length) throw new Error(`esperava ${line.letters.length} letras, achei ${letters.length}`);

  for (const [n, box] of letters.entries()) {
    const name = line.letters[n], next = letters[n + 1];
    if (next) gaps.push([name, line.letters[n + 1], (next.l - box.r) * (CAP / (line.base - line.capTop))]);
    if (glyphs[name]) continue;
    // Só esta letra sobre fundo branco; o cinza da borda é mantido para a curva sair suave
    const left = Math.max(0, box.l - 12), width = box.r - box.l + 25, gray = Buffer.alloc(width * H, 255);
    for (let y = 0; y < H; y++) for (let x = 0; x < width; x++) {
      const p = y * W + x + left;
      if (label[p] === box.id || (label[p] === 0 && data[p] > 0 && near(label, p, W, box.id))) gray[y * width + x] = 255 - data[p];
    }
    const png = await sharp(gray, { raw: { width, height: H, channels: 1 } }).png().toBuffer();
    const svg = await trace(png, { threshold: 128, turdSize: 60, alphaMax: 1.1, optTolerance: 0.8 });
    const k = CAP / (line.base - line.capTop), path = new opentype.Path();
    const X = (v) => Math.round((v + left - box.l) * k), Y = (v) => Math.round((line.base - v) * k);
    for (const [, cmd, args] of svg.match(/ d="([^"]+)"/)[1].matchAll(/([MLCZ])([^MLCZ]*)/g)) {
      const v = args.match(/-?[\d.]+/g)?.map(Number) ?? [];
      if (cmd === "M") path.moveTo(X(v[0]), Y(v[1]));
      if (cmd === "L") for (let i = 0; i < v.length; i += 2) path.lineTo(X(v[i]), Y(v[i + 1]));
      if (cmd === "C") for (let i = 0; i < v.length; i += 6) path.curveTo(X(v[i]), Y(v[i + 1]), X(v[i + 2]), Y(v[i + 3]), X(v[i + 4]), Y(v[i + 5]));
      if (cmd === "Z") path.close();
    }
    glyphs[name] = { path: windHoles(path), width: Math.round((box.r - box.l) * k) };
  }
}
/* O traçado devolve miolos no mesmo sentido do contorno: em iPhone e Windows a letra sairia preenchida. */
function windHoles(path) {
  const subs = [];
  for (const c of path.commands) { if (c.type === "M") subs.push([]); subs.at(-1).push(c); }
  const area = (cmds) => { const p = cmds.filter((c) => c.type !== "Z"); let a = 0; p.forEach((c, i) => { const n = p[(i + 1) % p.length]; a += c.x * n.y - n.x * c.y; }); return a / 2; };
  const reverse = (cmds) => {
    const seg = cmds.filter((c) => c.type !== "Z"), out = [{ type: "M", x: seg.at(-1).x, y: seg.at(-1).y }];
    for (let i = seg.length - 1; i > 0; i--) {
      const c = seg[i], to = seg[i - 1];
      out.push(c.type === "C" ? { type: "C", x1: c.x2, y1: c.y2, x2: c.x1, y2: c.y1, x: to.x, y: to.y } : { type: "L", x: to.x, y: to.y });
    }
    out.push({ type: "Z" });
    return out;
  };
  const outer = subs.reduce((m, c) => (Math.abs(area(c)) > Math.abs(area(m)) ? c : m));
  const fixed = new opentype.Path();
  for (const sub of subs) {
    const wanted = sub === outer ? 1 : -1;
    fixed.commands.push(...(Math.sign(area(sub)) === wanted ? sub : reverse(sub)));
  }
  return fixed;
}
function near(lab, p, W, id) { for (const d of [-3, -2, -1, 1, 2, 3]) if (lab[p + d] === id || lab[p + d * W] === id) return true; return false; }

// Espaços laterais que reproduzem o espaçamento do logotipo, par a par
const lsb = {}, rsb = {};
for (const n of Object.keys(glyphs)) { lsb[n] = 28; rsb[n] = 28; }
for (let it = 0; it < 400; it++) for (const [a, b, g] of gaps) { const e = (g - rsb[a] - lsb[b]) * 0.1; rsb[a] += e; lsb[b] += e; }

const out = [new opentype.Glyph({ name: ".notdef", advanceWidth: 500, path: new opentype.Path() }),
  new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 250, path: new opentype.Path() })];
for (const [name, g] of Object.entries(glyphs)) {
  const shift = Math.round(lsb[name]), path = new opentype.Path();
  for (const c of g.path.commands) {
    const m = { ...c };
    for (const key of ["x", "x1", "x2"]) if (key in m) m[key] += shift;
    path.commands.push(m);
  }
  const code = name.length === 1 ? name.charCodeAt(0) : undefined;
  const glyph = new opentype.Glyph({ name: { ".": "period", ND: "N_D" }[name] ?? name, unicode: code, advanceWidth: Math.round(g.width + lsb[name] + rsb[name]), path });
  if (code && code !== 46) glyph.addUnicode(code + 32); // minúsculas usam o mesmo desenho
  out.push(glyph);
}
// "DR. DIOGO" fica colado como no logotipo; o espaço normal separa DIOGO de FERNANDES
const period = out.find((g) => g.name === "period");
out.push(new opentype.Glyph({ name: "period_space", advanceWidth: period.advanceWidth + 50, path: period.path }));
const font = new opentype.Font({ familyName: "Diogo Fernandes Marca", styleName: "Regular", unitsPerEm: 1000, ascender: 850, descender: -150, glyphs: out });
const id = (n) => out.findIndex((g) => g.name === n);
font.substitution.addLigature("liga", { sub: [id("N"), id("D")], by: id("N_D") });
font.substitution.addLigature("liga", { sub: [id("period"), id("space")], by: id("period_space") });
const woff2 = await compress(new Uint8Array(font.toArrayBuffer()));
await writeFile(OUT, woff2);
console.log("glifos", out.length, "kb", (woff2.length / 1024).toFixed(1), out.map((g) => `${g.name}:${g.advanceWidth}`).join(" "));

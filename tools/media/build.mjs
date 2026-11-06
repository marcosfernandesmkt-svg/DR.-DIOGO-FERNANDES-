// Pipeline de mídia: recorte + tratamento low-key + monograma vetorial.
// O tratamento só altera luz e cor (nunca a geometria do rosto).
// Para trocar uma foto: substitua o arquivo em tools/media/source, gere a máscara
// com matte.swift e rode `npm run media`.
import sharp from "sharp";
import potrace from "potrace";
import opentype from "opentype.js";
import { decompress } from "wawoff2";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const SRC = new URL("./source/", import.meta.url).pathname;
const OUT = new URL("../../public/media/", import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const GOLD = [198, 166, 103];
const BLUE = [52, 124, 181];
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Recorta e aplica luz lateral, fim de queda para o preto e contorno dourado indireto. */
async function grade(name, { lightFrom = "left", fade = 0.82, gamma = 1.18, rim = 0.5, keyMin = 0.5, blue = 0.3, rolloff = 1, face = null, grain = 0 }) {
  const img = sharp(`${SRC}${name}`).removeAlpha().toColourspace("srgb");
  const { width: w, height: h } = await img.metadata();
  const rgb = await img.clone().raw().toBuffer();
  const maskSharp = sharp(`${SRC}${name.split(".")[0]}-mask.png`).resize(w, h).toColourspace("b-w").extractChannel(0);
  const mask = await maskSharp.clone().blur(Math.max(w, h) / 600).raw().toBuffer();
  const halo = await maskSharp.clone().blur(Math.max(w, h) / 90).raw().toBuffer();
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const yy = y / h;
    const floor = yy < fade ? 1 : 1 - Math.min(1, (yy - fade) / (1 - fade)) ** 1.4;
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 3, q = i * 4;
      // Curva no alfa: come a franja clara do fundo original.
      const a = Math.min(1, Math.max(0, (mask[i] / 255 - 0.42) / 0.5));
      const xx = x / w;
      const key = lightFrom === "left" ? 1 - xx : xx;
      const light = keyMin + (1 - keyMin) * Math.min(1, key * 1.55);
      const edge = a * (1 - halo[i] / 255) * 2;
      const side = Math.max(0, 1 - key) ** 1.3;
      let lum = 0;
      for (let c = 0; c < 3; c++) {
        let v = 255 * (rgb[p + c] / 255) ** gamma;
        // Abre as sombras do rosto com uma máscara suave; nenhuma forma é alterada.
        if (face) {
          const dist = Math.hypot((xx - face.x) * (w / h), yy - face.y) / face.r;
          if (dist < 1) v = 255 * (v / 255) ** (1 - (1 - dist * dist) * face.lift);
        }
        // Segura as altas luzes: tecido branco deixa de estourar, sem tocar nos tons de pele.
        if (v > 168) v = 168 + (v - 168) * rolloff;
        lum += v / 3;
        // Dourado no lado da sombra e azul indireto no lado da luz: só contorno, nunca o rosto.
        out[q + c] = clamp(v * light * floor + (GOLD[c] * side * rim + BLUE[c] * (1 - side) * blue) * edge * floor);
      }
      // Sombras levemente frias: o corpo passa a pertencer ao ambiente azul, sem tocar na pele clara.
      const shade = Math.max(0, 1 - lum / 90);
      out[q] = clamp(out[q] * (1 - shade * 0.12));
      out[q + 2] = clamp(out[q + 2] * (1 + shade * 0.16));
      // Granulação fotográfica fina: tira o aspecto liso, sem inventar detalhe.
      if (grain) {
        const n = (Math.random() - 0.5) * grain;
        for (let c = 0; c < 3; c++) out[q + c] = clamp(out[q + c] + n);
      }
      out[q + 3] = Math.round(a * 255);
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png();
}

/** Ampliação por Lanczos com nitidez leve: melhora a nitidez percebida sem recriar traços. */
async function enlarge(pipe, factor, crop) {
  let base = sharp(await pipe.toBuffer());
  if (crop) base = sharp(await base.extract(crop).png().toBuffer());
  const { width } = await base.metadata();
  return base.resize({ width: Math.round(width * factor), kernel: "lanczos3" }).sharpen({ sigma: 0.7, m1: 0.5, m2: 0.8 }).png();
}

async function save(pipe, base, { webp = 90 } = {}) {
  const buf = await pipe.toBuffer();
  await sharp(buf).webp({ quality: webp, alphaQuality: 90, effort: 6 }).toFile(`${OUT}${base}.webp`);
}

// 1. Abertura — retrato de corpo inteiro em camada transparente.
await save(await enlarge(await grade("terno.png", { lightFrom: "left", fade: 0.78, gamma: 0.98, rim: 0.3, keyMin: 0.78, blue: 0.34, face: { x: 0.5, y: 0.24, r: 0.17, lift: 0.14 }, grain: 5 }), 1.5), "hero-figure");

// 2. Retrato: mesma fonte da abertura, com recorte 4:5 e luz lateral dura de um só lado.
await save(
  await enlarge(await grade("terno.png", { lightFrom: "left", fade: 0.9, gamma: 0.96, rim: 0.28, keyMin: 0.7, blue: 0.3, face: { x: 0.5, y: 0.24, r: 0.17, lift: 0.16 }, grain: 5 }), 2, { left: 220, top: 96, width: 587, height: 734 }),
  "portrait",
);

// 4. Monograma oficial vetorizado a partir do logotipo aprovado.
const logo = sharp(`${SRC}logo-branco.png`);
const { width: lw, height: lh } = await logo.metadata();
const alpha = await logo.clone().extractChannel(3).raw().toBuffer();
let right = 0, started = false;
for (let x = 0; x < lw; x++) {
  let ink = false;
  for (let y = 0; y < lh; y++) if (alpha[y * lw + x] > 40) { ink = true; break; }
  if (ink) started = true;
  else if (started) { right = x; break; }
}
const crop = await logo.clone().extract({ left: 0, top: 0, width: right + 2, height: lh }).extractChannel(3).negate().png().toBuffer();
const trimmed = await sharp(crop).trim({ threshold: 20 }).extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#fff" }).toBuffer();
const svg = await promisify(potrace.trace)(trimmed, { threshold: 128, turdSize: 20, optTolerance: 0.4 });
// O SVG do potrace traz um único path.
const d = svg.match(/ d="([^"]+)"/)[1];
const vb = svg.match(/width="(\d+)" height="(\d+)"/);
await writeFile(new URL("../../src/lib/monogram.ts", import.meta.url), `// Gerado por tools/media/build.mjs a partir do logotipo aprovado.\nexport const MONOGRAM = { width: ${vb[1]}, height: ${vb[2]}, d: ${JSON.stringify(d)} };\n`);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 ${+vb[1] + 120} ${+vb[1] + 120}"><rect x="-60" y="-60" width="${+vb[1] + 120}" height="${+vb[1] + 120}" fill="#080808"/><path transform="translate(0 ${(+vb[1] - +vb[2]) / 2})" fill="#C6A667" fill-rule="evenodd" d="${d}"/></svg>`;
await writeFile(new URL("../../src/app/icon.svg", import.meta.url), icon);

// 5. Imagem de compartilhamento.
const fig = await sharp(`${OUT}hero-figure.webp`).extract({ left: 135, top: 90, width: 1290, height: 1500 }).resize({ height: 630 }).toBuffer();
const brandBytes = await decompress(await readFile(new URL("../../src/app/fonts/diogo-fernandes-marca.woff2", import.meta.url)));
const brandFont = opentype.parse(brandBytes.buffer.slice(brandBytes.byteOffset, brandBytes.byteOffset + brandBytes.byteLength));
const og = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g" cx="74%" cy="42%" r="50%"><stop offset="0" stop-color="#C6A667" stop-opacity=".2"/><stop offset="1" stop-color="#080808" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#080808"/><rect width="1200" height="630" fill="url(#g)"/><path fill="#F7F5F0" fill-rule="evenodd" d="${brandFont.getPath("DR.DIOGO", 70, 290, 84).toPathData(1)}"/><path fill="#F7F5F0" fill-rule="evenodd" d="${brandFont.getPath("FERNANDES", 70, 382, 84).toPathData(1)}"/><rect x="72" y="418" width="96" height="1.5" fill="#C6A667"/><text x="72" y="462" font-family="Helvetica Neue, sans-serif" letter-spacing="4" font-size="20" fill="#E4D1A5">MÉDICO  |  CRM-ES 23.787</text></svg>`;
await sharp(Buffer.from(og)).composite([{ input: fig, left: 620, top: 0 }]).jpeg({ quality: 86 }).toFile(new URL("../../public/og.jpg", import.meta.url).pathname);

console.log("mídia gerada", { monograma: vb.slice(1) });

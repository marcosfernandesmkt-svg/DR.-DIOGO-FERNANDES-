// Troca as fotos do site mantendo a posição: encaixa o recorte novo nas mesmas telas e
// na mesma escala das imagens anteriores. Ajusta só luz, cor e textura, pixel a pixel:
// nenhuma deformação, nenhum preenchimento gerado. Olhos, boca e traços ficam intactos.
import sharp from "sharp";

const SRC = new URL("./source/terno-recorte.png", import.meta.url).pathname;
const OUT = new URL("../../public/media/", import.meta.url).pathname;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, px = Buffer.from(data);

// O recorte veio de fundo branco: leva a cor do terno para a borda, senão surge um halo no escuro
let known = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) known[i] = px[i * 4 + 3] >= 245 ? 1 : 0;
for (let pass = 0; pass < 6; pass++) {
  const next = known.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (known[i]) continue;
    let r = 0, g = 0, b = 0, n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = x + dx, c = y + dy;
      if (a < 0 || c < 0 || a >= W || c >= H || !known[c * W + a]) continue;
      const j = (c * W + a) * 4; r += px[j]; g += px[j + 1]; b += px[j + 2]; n++;
    }
    if (n) { const j = i * 4; px[j] = r / n; px[j + 1] = g / n; px[j + 2] = b / n; next[i] = 1; }
  }
  known = next;
}
const rgb = Buffer.alloc(W * H * 3), alpha = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  rgb[i * 3] = px[i * 4]; rgb[i * 3 + 1] = px[i * 4 + 1]; rgb[i * 3 + 2] = px[i * 4 + 2];
  alpha[i] = Math.min(255, Math.max(0, ((px[i * 4 + 3] - 70) * 255) / 170));
}

/* Acabamento fotográfico: tira o brilho plástico e assenta a figura na luz azul e dourada do site. */
{
  const blurA = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(5).extractChannel(0).raw().toBuffer();
  const curve = (v) => { const x = v / 255; return 255 * (x < 0.5 ? 0.5 * Math.pow(2 * x, 1.12) : 1 - 0.5 * Math.pow(2 - 2 * x, 1.12)); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, j = i * 3;
    let r = rgb[j], g = rgb[j + 1], b = rgb[j + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Saturação um pouco menor: as imagens geradas exageram a cor do terno e da pele
    r = l + (r - l) * 0.9; g = l + (g - l) * 0.9; b = l + (b - l) * 0.9;
    // Contraste suave e sombras levemente frias, altas luzes levemente quentes
    const t = l / 255, shadow = Math.pow(1 - t, 2), light = Math.pow(t, 2);
    r = curve(r) - 5 * shadow + 4 * light; g = curve(g) - 1 * shadow + 2 * light; b = curve(b) + 7 * shadow - 3 * light;
    // Luz de recorte azul vinda da direita, como o brilho das células atrás dele
    const a = alpha[i] / 255, edge = Math.max(0, a - blurA[i] / 255);
    const gx = (blurA[i + (x < W - 1 ? 1 : 0)] - blurA[i - (x > 0 ? 1 : 0)]) / 255;
    const rim = Math.min(1, edge * 2.2) * Math.min(1, Math.max(0, -gx * 9) + 0.25);
    r += (121 - r) * rim * 0.32; g += (185 - g) * rim * 0.32; b += (228 - b) * rim * 0.32;
    rgb[j] = Math.max(0, Math.min(255, r)); rgb[j + 1] = Math.max(0, Math.min(255, g)); rgb[j + 2] = Math.max(0, Math.min(255, b));
  }
}

/* Granulação fina de filme depois da ampliação: devolve textura à pele e ao tecido. */
function grain(buf, width, height) {
  // mulberry32: ruído sem padrão de linhas (um gerador simples deixava listras visíveis)
  let seed = 7;
  const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < width * height; i++) {
    const n = (rand() + rand() + rand() - 1.5) * 5;
    for (let c = 0; c < 3; c++) {
      const v = buf[i * 3 + c], mid = 1 - Math.abs(v / 255 - 0.45) * 1.4;
      buf[i * 3 + c] = Math.max(0, Math.min(255, v + n * Math.max(0.25, mid)));
    }
  }
  return buf;
}

async function scaled(scale) {
  const width = Math.round(W * scale), height = Math.round(H * scale);
  const raw = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).resize(width, height, { kernel: "lanczos3" }).sharpen({ sigma: 0.9, m1: 0.3, m2: 0.7 }).raw().toBuffer();
  const color = await sharp(grain(raw, width, height), { raw: { width, height, channels: 3 } }).blur(0.45).png().toBuffer();
  const mask = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).resize(width, height, { kernel: "cubic" }).toColourspace("b-w").png().toBuffer();
  return sharp(color).joinChannel(await sharp(mask).extractChannel(0).toBuffer()).png().toBuffer().then((input) => ({ input, width, height }));
}

/* A base da figura se dissolve no fundo, como na versão anterior: sem corte reto no terno. */
const FADE = (w, h) => `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset=".76" stop-color="#fff"/><stop offset=".985" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#f)"/></svg>`;

/* Escala e posição medidas sobre as imagens anteriores: cabeça, ombros e mãos no mesmo lugar. */
const CANVAS = [
  { file: "hero-figure-3.webp", cw: 1536, ch: 2304, scale: 3, left: 219, top: 316, fade: true },
  { file: "portrait-3.webp", cw: 1174, ch: 1468, scale: 4.01, left: -165, top: 229 },
];
for (const { file, cw, ch, scale, left, top, fade } of CANVAS) {
  const s = await scaled(scale), x = Math.max(0, -left), y = Math.max(0, -top);
  const piece = await sharp(s.input).extract({ left: x, top: y, width: Math.min(s.width - x, cw - Math.max(0, left)), height: Math.min(s.height - y, ch - Math.max(0, top)) }).png().toBuffer();
  await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }]).png().toBuffer()
    .then((img) => (fade ? sharp(img).composite([{ input: Buffer.from(FADE(cw, ch)), blend: "dest-in" }]).png().toBuffer() : img))
    .then((img) => sharp(img).webp({ quality: 90, alphaQuality: 95 }).toFile(`${OUT}${file}`));
}

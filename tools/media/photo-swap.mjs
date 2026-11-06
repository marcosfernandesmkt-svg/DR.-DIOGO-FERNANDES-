// Troca as fotos do site mantendo a posição: encaixa o recorte novo nas mesmas telas e
// na mesma escala das imagens anteriores. Só amplia e limpa a borda; não altera o rosto.
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

async function scaled(scale) {
  const width = Math.round(W * scale), height = Math.round(H * scale);
  const color = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).resize(width, height, { kernel: "lanczos3" }).sharpen({ sigma: 1.1, m1: 0.5, m2: 1.2 }).png().toBuffer();
  const mask = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).resize(width, height, { kernel: "cubic" }).toColourspace("b-w").png().toBuffer();
  return sharp(color).joinChannel(await sharp(mask).extractChannel(0).toBuffer()).png().toBuffer().then((input) => ({ input, width, height }));
}

/* A base da figura se dissolve no fundo, como na versão anterior: sem corte reto no terno. */
const FADE = (w, h) => `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset=".76" stop-color="#fff"/><stop offset=".985" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#f)"/></svg>`;

/* Escala e posição medidas sobre as imagens anteriores: cabeça, ombros e mãos no mesmo lugar. */
const CANVAS = [
  { file: "hero-figure-2.webp", cw: 1536, ch: 2304, scale: 3, left: 219, top: 316, fade: true },
  { file: "portrait-2.webp", cw: 1174, ch: 1468, scale: 4.01, left: -165, top: 229 },
];
for (const { file, cw, ch, scale, left, top, fade } of CANVAS) {
  const s = await scaled(scale), x = Math.max(0, -left), y = Math.max(0, -top);
  const piece = await sharp(s.input).extract({ left: x, top: y, width: Math.min(s.width - x, cw - Math.max(0, left)), height: Math.min(s.height - y, ch - Math.max(0, top)) }).png().toBuffer();
  await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }]).png().toBuffer()
    .then((img) => (fade ? sharp(img).composite([{ input: Buffer.from(FADE(cw, ch)), blend: "dest-in" }]).png().toBuffer() : img))
    .then((img) => sharp(img).webp({ quality: 90, alphaQuality: 95 }).toFile(`${OUT}${file}`));
}

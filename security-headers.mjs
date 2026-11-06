/*
 * Cabeçalhos de segurança do site. Valem para a Vercel (next.config.ts) e para
 * hospedagens comuns (tools/static/write-headers.mjs).
 *
 * 'unsafe-inline' em script-src: a página é estática e o Next.js embute scripts que mudam a
 * cada build, então não há nonce possível sem perder o cache estático. O risco fica contido
 * porque o site não exibe nada vindo de visitantes.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // A despedida da clínica escreve na guia que abre: "same-origin" quebraria esse fluxo
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

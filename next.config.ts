import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { SECURITY_HEADERS } from "./security-headers.mjs";

/* `npm run build:static` gera a pasta out/: HTML, CSS e JS para qualquer hospedagem. */
const estatico = process.env.STATIC_EXPORT === "1";

/* O domínio oficial fica em src/lib/site.ts; esta variável só serve para testar outro endereço. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  const base: NextConfig = { poweredByHeader: false, env: siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {} };
  if (estatico) return { ...base, output: "export", images: { unoptimized: true } };
  return {
    ...base,
    images: { formats: ["image/avif", "image/webp"], qualities: [75, 90], localPatterns: [{ pathname: "/media/**" }] },
    async headers() {
      return [
        // A CSP bloquearia o recarregamento automático do modo de desenvolvimento
        { source: "/:path*", headers: dev ? SECURITY_HEADERS.filter((h) => h.key !== "Content-Security-Policy") : SECURITY_HEADERS },
        { source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      ];
    },
  };
}

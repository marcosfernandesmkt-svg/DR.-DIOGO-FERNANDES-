import type { NextConfig } from "next";

/* `npm run build:static` gera a pasta out/: HTML, CSS e JS para qualquer hospedagem. */
const estatico = process.env.STATIC_EXPORT === "1";

const config: NextConfig = estatico
  ? { output: "export", images: { unoptimized: true } }
  : {
      images: { formats: ["image/avif", "image/webp"], qualities: [75, 90] },
      async headers() {
        return [{ source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
      },
    };
export default config;

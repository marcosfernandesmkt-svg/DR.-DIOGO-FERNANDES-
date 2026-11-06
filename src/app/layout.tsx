import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { SITE } from "@/lib/site";
import "./globals.css";

const bodoni = Bodoni_Moda({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bodoni", display: "swap" });
/* Letras do logotipo aprovado, vetorizadas por tools/media/brand-font.mjs */
const brand = localFont({ src: "./fonts/diogo-fernandes-marca.woff2", variable: "--font-brand", display: "swap", weight: "400" });

const description = `${SITE.name} — ${SITE.role} | ${SITE.crm}. Atendimento com foco em saúde hormonal e metabólica em Marataízes, Piúma, Bom Jesus do Norte e on-line.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} | ${SITE.role} ${SITE.crm}`,
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE.name, title: `${SITE.name} | ${SITE.crm}`, description, url: "/", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${SITE.name}, ${SITE.crm}` }] },
  twitter: { card: "summary_large_image", title: `${SITE.name} | ${SITE.crm}`, description, images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#080808", width: "device-width", initialScale: 1, viewportFit: "cover" };

/* Roda antes da pintura: esconde a abertura só quando ela realmente vai tocar, com rede de segurança. */
const boot = `(function(){var d=document.documentElement;d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('ready')}else{setTimeout(function(){d.classList.add('ready')},4000)}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bodoni.variable} ${brand.variable} ${GeistSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

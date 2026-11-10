import { SmoothScroll } from "@/components/smooth-scroll";
import { Header } from "@/components/header";
import { ScrollLockedVideoHero } from "@/components/ui/scroll-locked-video-hero";
import { Philosophy } from "@/components/sections/philosophy";
import { Portrait } from "@/components/sections/portrait";
import { Care } from "@/components/sections/care";
import { Areas } from "@/components/sections/areas";
import { Booking } from "@/components/sections/booking";
import { MotionFooter } from "@/components/ui/motion-footer";
import { Testimonials } from "@/components/sections/testimonials";
import { TESTIMONIALS_ON } from "@/lib/testimonials";
import { CLINICS, SITE } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: SITE.fullName,
  alternateName: SITE.name,
  identifier: SITE.crm,
  url: SITE.url,
  image: `${SITE.url}/og.jpg`,
  areaServed: [...new Set(CLINICS.slice(0, 5).map((c) => c.city))],
};

export default function Home() {
  return (
    <SmoothScroll>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-gold focus:px-4 focus:py-3 focus:text-ink">
        Pular para o conteúdo
      </a>
      <Header />
      <main className="relative z-10 bg-ink">
        <ScrollLockedVideoHero skipTo="#retrato" />
        <div id="conteudo" tabIndex={-1} className="outline-none">
          <Portrait />
          <Philosophy />
          <Care />
          <Areas />
          <Booking />
          {TESTIMONIALS_ON ? <Testimonials /> : null}
        </div>
      </main>
      <MotionFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </SmoothScroll>
  );
}

"use client";

import { useRef } from "react";
import { ArrowUp } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { SITE } from "@/lib/site";
import { Magnetic } from "../magnetic";
import { Monogram } from "../monogram";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Rodapé com Curtain Reveal.
 *
 * Em vez de `position: fixed`, o rodapé fica `sticky` no fim da tela, atrás do <main>
 * (z-index maior e fundo opaco). Ao rolar, o conteúdo sobe e o descobre: sem cálculo de
 * altura, sem camada fixa sobre as clínicas e com rolagem nativa nos dois sentidos.
 */
export function MotionFooter() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const main = document.querySelector("main");
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: main, start: "bottom bottom", end: "bottom top", scrub: 0.2 } })
          .fromTo(".mf-df", { yPercent: 16, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1 }, 0)
          .fromTo(".mf-aurora", { xPercent: -14, opacity: 0.2 }, { xPercent: 10, opacity: 1, duration: 1 }, 0)
          .fromTo(".mf-line", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, 0.12)
          .fromTo(".mf-title", { yPercent: 108, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.42, ease: "power3.out" }, 0.06)
          .fromTo(".mf-fade", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.08 }, 0.26);
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <footer ref={scope} className="footer-reveal relative z-0 flex min-h-svh flex-col overflow-hidden bg-ink">
      {/* Assinatura e aurora ficam atrás de tudo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mf-aurora absolute -bottom-[34%] left-[8%] h-[80%] w-[84%] rounded-full bg-deep blur-[100px]" />
        <Monogram className="mf-df absolute bottom-[-6svh] left-1/2 h-[92svh] w-auto -translate-x-1/2 text-gold/[.045] portrait:h-[62svh]" />
      </div>

      <div className="gutter relative flex flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24">
        <p className="mf-fade brand text-center text-xl text-gold-light">{SITE.name}</p>

        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="display max-w-[16ch] overflow-hidden text-balance pb-[.1em] pt-[.24em] text-[clamp(2.25rem,6.4vw,6.5rem)] leading-[1.1] text-bone">
            <span className="mf-title block">Será um prazer receber você.</span>
          </p>
          <span aria-hidden className="mf-line mt-8 block h-px w-[min(60vw,28rem)] bg-linear-to-r from-transparent via-gold to-transparent" />
          <p className="mf-fade mt-8 max-w-[44ch] text-[1.0625rem] leading-[1.6] text-bone/78">Cuidado médico individualizado, com atenção à sua saúde como um todo.</p>
        </div>

        <div className="mf-fade flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-gold/20 pt-5 portrait:flex-col portrait:text-center">
          <div>
            <p className="brand text-xl text-bone">{SITE.name}</p>
            <p className="mt-0.5 text-xs uppercase tracking-[.16em] text-ash">{SITE.role} | {SITE.crm}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 portrait:justify-center">
            <Magnetic>
              <a href={SITE.instagram.href} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${SITE.instagram.handle} (abre em nova guia)`} className="group inline-flex min-h-11 items-center gap-2.5 text-sm text-bone/80 transition-colors hover:text-gold-light">
                <InstagramIcon className="size-5 transition-transform duration-500 ease-cine group-hover:-rotate-6 group-hover:scale-110" />
                {SITE.instagram.handle}
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#topo" className="eyebrow inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/45 px-5 text-gold-light transition-colors hover:border-gold hover:bg-gold hover:text-ink">
                Voltar ao início
                <ArrowUp className="size-3.5" aria-hidden />
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </footer>
  );
}

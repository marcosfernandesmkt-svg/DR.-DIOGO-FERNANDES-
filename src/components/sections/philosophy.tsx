"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Só tipografia: prepara o preto de onde nasce a palavra do portal. */
export function Philosophy() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        /* Text Mask Reveal: tocado uma vez, curto, para o texto nunca ficar pela metade. */
        gsap
          .timeline({ scrollTrigger: { trigger: scope.current, start: "top 92%", once: true } })
          .fromTo(".ph-eyebrow", { opacity: 0 }, { opacity: 1, duration: 0.5 })
          .fromTo(".ph-a", { clipPath: "inset(-12% 0% 112% 0%)", y: 34 }, { clipPath: "inset(-12% 0% -12% 0%)", y: 0, duration: 1, ease: "expo.out" }, 0.05)
          .fromTo(".ph-b", { clipPath: "inset(-12% 100% -12% 0%)", x: -28 }, { clipPath: "inset(-12% -2% -12% 0%)", x: 0, duration: 1.05, ease: "expo.inOut" }, 0.35)
          .fromTo(".ph-c", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1);

        /* A última linha some suavemente e deixa o preto para a palavra SAÚDE. */
        gsap.to(".ph-leave", { opacity: 0, ease: "none", scrollTrigger: { trigger: scope.current, start: "bottom 62%", end: "bottom 30%", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="sobre" tabIndex={-1} className="after-portrait gutter relative z-[2] flex min-h-svh flex-col justify-between gap-14 pb-16 pt-[clamp(5.5rem,14svh,9rem)] outline-none md:pb-20">
      <p className="ph-eyebrow eyebrow text-gold">02 / Nossa filosofia</p>

      <h2 className="display text-[clamp(2.5rem,6.6vw,7.5rem)] leading-[1.1]">
        <span className="ph-a block max-w-[16ch] text-bone">Mais do que cuidar da saúde.</span>
        <span className="ph-b mt-[.2em] block max-w-[14ch] text-gold-light md:ml-[20vw]">Compreender cada pessoa.</span>
      </h2>

      <div className="ph-leave grid gap-8 md:grid-cols-12">
        <dl className="ph-c order-2 grid content-end gap-5 text-sm sm:grid-cols-2 md:order-1 md:col-span-5">
          <div>
            <dt className="text-xs uppercase tracking-[.16em] text-ash">Formação médica</dt>
            <dd className="mt-1.5 text-bone">Universidade São Carlos — UniFamesc</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[.16em] text-ash">Atuação</dt>
            <dd className="mt-1.5 text-bone">Saúde hormonal e metabólica</dd>
          </div>
        </dl>
        <p className="ph-c order-1 max-w-[46ch] text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.6] text-bone/78 md:order-2 md:col-span-6 md:col-start-7">
          O <span className="brand brand-inline">Dr. Diogo Fernandes</span> valoriza a escuta, a avaliação clínica e uma visão integral da saúde, com atenção às necessidades individuais de cada paciente.
        </p>
      </div>
    </section>
  );
}

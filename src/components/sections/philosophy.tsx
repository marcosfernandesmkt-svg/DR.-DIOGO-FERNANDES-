"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { FORMATION, SITE } from "@/lib/site";

/** Título, apresentação curta e formação: uma leitura editorial, sem cards. */
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

        /* Microinteração: as linhas douradas se desenham e as informações chegam em sequência. */
        for (const group of gsap.utils.toArray<HTMLElement>(".ph-group", scope.current)) {
          gsap
            .timeline({ scrollTrigger: { trigger: group, start: "top 86%", once: true } })
            .fromTo(group.querySelectorAll(".ph-line"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "expo.out", stagger: 0.06 })
            .fromTo(group.querySelectorAll(".ph-item"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06 }, 0.1);
        }

        /* A última linha some suavemente e deixa o preto para a palavra SAÚDE. */
        gsap.to(".ph-leave", { opacity: 0, ease: "none", scrollTrigger: { trigger: scope.current, start: "bottom 62%", end: "bottom 30%", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="sobre" tabIndex={-1} className="after-portrait gutter relative z-[2] flex min-h-svh flex-col gap-12 pb-16 pt-[clamp(7rem,16svh,9rem)] outline-none portrait:pt-[5.5rem] md:gap-16 md:pb-24">
      <p className="ph-eyebrow eyebrow text-gold">02 / Nossa filosofia</p>

      {/* 1. Título */}
      <h2 className="display text-[clamp(2.25rem,6.6vw,7.5rem)] leading-[1.16] md:leading-[1.1]">
        <span className="ph-a block max-w-[16ch] pt-[.06em] text-bone">Mais do que cuidar da saúde.</span>
        <span className="ph-b mt-[.24em] block max-w-[14ch] pt-[.06em] text-gold-light md:ml-[20vw]">Compreender cada pessoa.</span>
      </h2>

      {/* 2. Apresentação */}
      <div className="ph-c grid gap-6 md:grid-cols-12">
        <p className="max-w-[48ch] text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.65] text-bone/80 md:col-span-7 md:col-start-6">
          Cada pessoa traz uma história que merece ser ouvida. Por isso, o <span className="brand brand-inline">{SITE.name}</span> busca compreender o que vai além dos sintomas: a rotina, os desafios e o que importa para você. Um cuidado construído com escuta, atenção e respeito à sua individualidade.
        </p>
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs uppercase leading-relaxed tracking-[.16em] text-ash md:col-span-7 md:col-start-6">
          <span className="brand whitespace-nowrap text-[1.2em] tracking-normal text-bone">{SITE.name}</span>
          <span aria-hidden className="text-gold/60">|</span>
          <span className="whitespace-nowrap">{SITE.role} — {SITE.crm}</span>
        </p>
      </div>

      {/* 3. Formação médica */}
      <div className="ph-group ph-leave grid gap-6 md:grid-cols-12">
        <h3 className="ph-item eyebrow text-gold md:col-span-4">Formação médica</h3>
        <dl className="md:col-span-8">
          {FORMATION.map((f) => (
            <div key={f.label} className="relative grid gap-1.5 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <span aria-hidden className="ph-line absolute inset-x-0 top-0 h-px origin-left bg-linear-to-r from-gold/45 via-gold/20 to-transparent" />
              <dt className="ph-item text-[.6875rem] uppercase tracking-[.18em] text-ash">
                {f.label}
                {f.status === "ongoing" ? <span className="ml-2 inline-block rounded-full border border-ice/40 px-2 py-px align-middle text-[.625rem] tracking-[.14em] text-ice">Cursando</span> : null}
              </dt>
              <dd className="ph-item min-w-0">
                <span className="block text-[1.0625rem] leading-snug text-bone">{f.title}</span>
                {"place" in f ? <span className="mt-1 block text-sm leading-relaxed text-bone/60">{f.place}</span> : null}
                {"notSpecialist" in f ? <span className="mt-2 block text-[.6875rem] font-medium tracking-[.16em] text-gold/80">NÃO ESPECIALISTA</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>

    </section>
  );
}

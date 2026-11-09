"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { AREAS } from "@/lib/site";
import { Fade, Rule } from "../reveal";

export function Areas() {
  const scope = useRef<HTMLElement>(null);

  /* Editorial Line Reveal: curto, sem pin e sem trilha extra de rolagem. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const arrive = { trigger: scope.current, start: "top 88%", end: "top 42%", scrub: 0.2 };
        // Só na cena: no celular as etapas são uma lista que ainda está sendo lida.
        gsap.to(document.querySelector(".gp-content"), { opacity: 0.18, ease: "none", scrollTrigger: arrive });
        gsap.fromTo(".ed-line", { scaleX: 0 }, { scaleX: 1, ease: "power2.inOut", scrollTrigger: arrive });
        gsap.fromTo(".ed-glint", { xPercent: -100, opacity: 0 }, { xPercent: 1000, opacity: 1, ease: "none", scrollTrigger: { ...arrive, start: "top 72%", end: "top 30%" } });
        // Cada filete dourado se desenha quando a área entra na tela
        for (const mark of gsap.utils.toArray<HTMLElement>(".ar-mark", scope.current)) {
          gsap.fromTo(mark, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: mark, start: "top 90%", once: true } });
        }
        gsap.fromTo(".ar-title", { yPercent: 112 }, { yPercent: 0, duration: 0.95, ease: "expo.out", scrollTrigger: { trigger: scope.current, start: "top 62%", once: true } });
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="atuacao" tabIndex={-1} className="section relative overflow-clip bg-[#09111a] outline-none">
      {/* A linha cruza o limite entre as seções; o reflexo azul a percorre */}
      <span aria-hidden className="ed-line hero-hidden-rm absolute inset-x-0 top-0 block h-px origin-center overflow-hidden bg-linear-to-r from-transparent via-gold to-transparent">
        <span className="ed-glint absolute inset-y-0 left-0 block w-[12%] bg-linear-to-r from-transparent via-ice to-transparent" />
      </span>
      <div className="gutter relative">
        <p className="eyebrow text-gold">04 / Atuação</p>
        <div className="mt-7 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="overflow-hidden pt-[.1em] lg:col-span-8">
            <h2 className="ar-title display max-w-[16ch] text-balance text-[clamp(2.25rem,5vw,5.25rem)] leading-[1.08] text-bone lg:max-w-none">
              Um olhar <span className="italic text-gold-light">individual</span> para sua saúde.
            </h2>
          </div>
          <Fade delay={0.1} className="lg:col-span-4">
            <p className="max-w-[36ch] leading-[1.7] text-bone/68 lg:ml-auto">Conheça algumas das áreas abordadas nos atendimentos do <span className="brand brand-inline">Dr. Diogo Fernandes</span>.</p>
          </Fade>
        </div>

        {/* Dez áreas em duas colunas no computador: cada uma com respiro, sem virar uma lista longa */}
        <ul className="mt-14 grid md:mt-20 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-24">
          {AREAS.map((a) => (
            <li key={a.n} className="row group relative isolate">
              <Rule className="bg-gold/25!" />
              <span aria-hidden className="band -z-10" />
              <motion.div
                className="grid gap-y-3 py-8 md:py-10"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                {/* No lugar do número, um filete dourado que se desenha ao entrar e se estende ao passar o mouse */}
                <span aria-hidden className="ar-mark slide block h-px w-8 origin-left bg-linear-to-r from-gold to-gold/0 transition-[width] duration-700 ease-cine group-hover:w-16" />
                <h3 className="display slide tint text-balance text-[clamp(1.375rem,2.1vw,2.125rem)] leading-[1.15] text-bone">{a.title}</h3>
                <p className="slide max-w-[46ch] text-[.9375rem] leading-[1.7] text-bone/68 md:text-base">{a.text}</p>
              </motion.div>
            </li>
          ))}
          <li aria-hidden className="lg:col-span-2"><Rule className="bg-gold/25!" /></li>
        </ul>
      </div>
    </section>
  );
}

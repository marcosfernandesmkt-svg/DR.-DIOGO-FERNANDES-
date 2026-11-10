"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { Monogram } from "./monogram";
import { Magnetic } from "./magnetic";
import { OPEN_CLINIC } from "./clinic-entry";
import { TESTIMONIALS_ON } from "@/lib/testimonials";

const NAV = [
  { href: "#sobre", label: "Sobre" },
  { href: "#atuacao", label: "Atuação" },
  { href: "#agendar", label: "Clínicas" },
];

export function Header() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      {/* Faixa escura atrás do menu: o texto que passa por baixo não aparece atrás do logo e do Agendar */}
      <span aria-hidden className="absolute inset-x-0 top-0 -z-10 h-28 bg-linear-to-b from-ink from-45% via-ink/90 via-70% to-transparent" />
      <motion.span aria-hidden style={{ scaleX }} className="block h-px origin-left bg-linear-to-r from-gold via-gold to-ice" />
      <div data-intro className="gutter pointer-events-auto flex items-center justify-between pt-[max(.875rem,env(safe-area-inset-top))] mix-blend-normal">
        <a href="#topo" aria-label="Dr. Diogo Fernandes — início" className="-m-2 grid size-14 place-items-center text-gold transition-colors hover:text-gold-light">
          <Monogram className="h-8 w-auto" />
        </a>
        <nav aria-label="Seções" className="hidden items-center gap-10 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="eyebrow py-3 text-bone/70 transition-colors hover:text-gold-light">
              {n.label}
            </a>
          ))}
          {TESTIMONIALS_ON ? (
            <a href="#depoimentos" className="eyebrow py-3 text-bone/70 transition-colors hover:text-gold-light">
              Depoimentos
            </a>
          ) : null}
        </nav>
        <div className="flex items-center gap-4">
        {TESTIMONIALS_ON ? (
          <a href="#depoimentos" className="eyebrow flex min-h-11 items-center text-bone/75 transition-colors hover:text-gold-light md:hidden">
            Depoimentos
          </a>
        ) : null}
        <Magnetic>
          <a
            href="#agendar"
            onClick={(e) => {
              // Mesmo destino do "Marque seu atendimento"; sem JavaScript, o link leva às clínicas
              e.preventDefault();
              window.dispatchEvent(new CustomEvent(OPEN_CLINIC, { detail: e.currentTarget }));
            }}
            className="eyebrow flex min-h-11 items-center rounded-full border border-gold/60 bg-ink/40 px-5 text-gold-light backdrop-blur-sm transition-colors hover:bg-gold hover:text-ink">
            Agendar
          </a>
        </Magnetic>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { LivingCells } from "./living-cells";

/* Poucas partículas, cada uma no seu tempo. Longe do centro, onde ficam os textos. */
const MOTES = [
  { x: 6, y: 62, s: 3, d: 21, l: 2 },
  { x: 14, y: 34, s: 2, d: 27, l: 9 },
  { x: 24, y: 78, s: 2, d: 33, l: 5 },
  { x: 71, y: 12, s: 3, d: 24, l: 14 },
  { x: 86, y: 30, s: 2, d: 29, l: 7 },
  { x: 93, y: 70, s: 3, d: 37, l: 18 },
  { x: 79, y: 88, s: 2, d: 26, l: 11 },
];

/**
 * Fundo celular da abertura. A imagem fornecida ondula devagar, com parallax de câmera,
 * luz ambiente e poucas partículas. Com movimento reduzido, fica apenas a imagem parada.
 */
export function HeroCells() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
        // Três planos, em sentidos e distâncias diferentes: é isso que cria profundidade.
        const follow = (target: Element | string | null, range: number) => ({
          x: gsap.quickTo(target, "x", { duration: 1.5, ease: "power3.out" }),
          y: gsap.quickTo(target, "y", { duration: 1.5, ease: "power3.out" }),
          range,
        });
        const planes = [follow(".cells-depth", -26), follow(document.querySelector(".figure-follow"), 12), follow(document.querySelector(".cells-front"), 40)];
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
          planes.forEach((p) => {
            p.x(nx * p.range);
            p.y(ny * p.range * 0.6);
          });
        };
        window.addEventListener("pointermove", move, { passive: true });
        return () => window.removeEventListener("pointermove", move);
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} aria-hidden className="hero-cells pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sobra nas bordas para o parallax nunca revelar o fundo */}
      <div className="cells-depth absolute -inset-[3%]">
        <LivingCells hero />
      </div>
      {/* Luz ambiente nas áreas que já têm reflexo na imagem */}
      <div className="cells-light absolute inset-0 bg-[radial-gradient(26vmax_26vmax_at_88%_56%,rgb(198_166_103/.1),transparent_70%)] portrait:hidden" />
      <div className="cells-light alt absolute inset-0 bg-[radial-gradient(30vmax_24vmax_at_12%_12%,rgb(52_124_181/.1),transparent_70%)]" />
      {MOTES.map((m, i) => (
        <span key={i} className={`mote ${i % 2 ? "portrait:hidden" : ""}`} style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, animationDuration: `${m.d}s`, animationDelay: `-${m.l}s` }} />
      ))}
    </div>
  );
}

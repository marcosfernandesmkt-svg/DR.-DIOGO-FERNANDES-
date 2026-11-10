"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { LivingCells } from "./living-cells";

/* Partículas, cada uma no seu tempo. Longe do centro, onde ficam os textos. */
const MOTES = [
  { x: 6, y: 62, s: 3, d: 13, l: 2 },
  { x: 14, y: 34, s: 2, d: 16, l: 9 },
  { x: 24, y: 78, s: 2, d: 19, l: 5 },
  { x: 71, y: 12, s: 3, d: 14, l: 11 },
  { x: 86, y: 30, s: 2, d: 17, l: 7 },
  { x: 93, y: 70, s: 3, d: 21, l: 15 },
  { x: 79, y: 88, s: 2, d: 15, l: 10 },
  { x: 4, y: 18, s: 2, d: 18, l: 4 },
  { x: 33, y: 92, s: 3, d: 16, l: 12 },
  { x: 62, y: 84, s: 2, d: 20, l: 6 },
  { x: 97, y: 46, s: 2, d: 14, l: 3 },
  { x: 48, y: 6, s: 2, d: 17, l: 8 },
];

/* Átomos, moléculas e células em traço fino: tamanho em vmin, posição em %, ritmos diferentes
   para nunca andarem juntos. "wide" some no celular em pé, onde o espaço livre é menor. */
type Kind = "atom" | "molecule" | "cell";
const PARTICLES: { kind: Kind; x: number; y: number; size: number; drift: number; spin: number; lag: number; hue: "gold" | "ice"; wide?: boolean }[] = [
  { kind: "atom", x: 4, y: 13, size: 12, drift: 19, spin: 24, lag: -3, hue: "gold" },
  { kind: "molecule", x: 27, y: 7, size: 15, drift: 26, spin: 46, lag: -8, hue: "ice", wide: true },
  { kind: "cell", x: 43, y: 22, size: 13, drift: 23, spin: 60, lag: -14, hue: "gold", wide: true },
  { kind: "atom", x: 79, y: 8, size: 10, drift: 23, spin: 31, lag: -9, hue: "ice" },
  { kind: "molecule", x: 87, y: 34, size: 15, drift: 21, spin: 52, lag: -5, hue: "gold" },
  { kind: "cell", x: 88, y: 70, size: 17, drift: 27, spin: 70, lag: -11, hue: "ice" },
  { kind: "atom", x: 60, y: 82, size: 9, drift: 18, spin: 19, lag: -7, hue: "gold", wide: true },
];

const GOLD = "#c6a667", GOLD_LIGHT = "#e4d1a5", ICE = "#79b9e4";
const ORBIT = "M-40,0 a40,13 0 1,0 80,0 a40,13 0 1,0 -80,0";

function Atom({ hue }: { hue: "gold" | "ice" }) {
  const ring = hue === "gold" ? GOLD : ICE;
  const electron = hue === "gold" ? ICE : GOLD_LIGHT;
  return (
    <svg viewBox="-50 -50 100 100">
      <circle r="10" fill={GOLD} opacity=".22" />
      <circle r="4.2" fill={GOLD_LIGHT} />
      {[0, 60, 120].map((deg, i) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse rx="40" ry="13" fill="none" stroke={ring} strokeWidth="1" opacity=".7" />
          <circle r="3" fill={electron}>
            <animateMotion dur={`${2.6 + i * 0.7}s`} repeatCount="indefinite" path={ORBIT} begin={`-${i * 0.9}s`} />
          </circle>
        </g>
      ))}
    </svg>
  );
}

/* Molécula em anel com dois ramos: bastões finos e esferas pequenas que pulsam devagar */
const NODES = [
  [0, -22], [19, -11], [19, 11], [0, 22], [-19, 11], [-19, -11], [36, -21], [-36, 21], [0, -42],
] as const;
const BONDS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [4, 7], [0, 8]] as const;

function Molecule({ hue }: { hue: "gold" | "ice" }) {
  const line = hue === "gold" ? GOLD : ICE;
  const dot = hue === "gold" ? GOLD_LIGHT : ICE;
  return (
    <svg viewBox="-50 -50 100 100">
      {BONDS.map(([a, b], i) => (
        <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke={line} strokeWidth="1" opacity=".6" />
      ))}
      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i > 5 ? 3.4 : 2.6} fill={i % 3 === 0 ? GOLD_LIGHT : dot}>
          <animate attributeName="opacity" values=".55;1;.55" dur={`${3 + (i % 4) * 0.8}s`} repeatCount="indefinite" begin={`-${i * 0.5}s`} />
        </circle>
      ))}
    </svg>
  );
}

/* Célula: membrana dupla, núcleo e poucas organelas; o conjunto respira */
function Cell({ hue }: { hue: "gold" | "ice" }) {
  const line = hue === "gold" ? GOLD : ICE;
  return (
    <svg viewBox="-50 -50 100 100">
      <circle r="40" fill={line} opacity=".05" />
      <circle r="40" fill="none" stroke={line} strokeWidth="1" opacity=".7">
        <animate attributeName="r" values="39;42;39" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle r="35" fill="none" stroke={line} strokeWidth=".6" strokeDasharray="2 4" opacity=".45" />
      <circle cx="6" cy="-4" r="12" fill={GOLD} opacity=".14" stroke={GOLD_LIGHT} strokeWidth=".8">
        <animate attributeName="r" values="11;13;11" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="6" cy="-4" r="3.5" fill={GOLD_LIGHT} opacity=".8" />
      {[[-20, 10, 2.4], [-14, -18, 1.8], [18, 20, 2.2], [24, -14, 1.6], [-4, 26, 1.8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={ICE} opacity=".7">
          <animate attributeName="opacity" values=".35;.85;.35" dur={`${4 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

const SHAPES = { atom: Atom, molecule: Molecule, cell: Cell };

/**
 * Fundo celular da abertura. A imagem fornecida ondula devagar, com parallax de câmera,
 * luz ambiente, partículas, átomos, moléculas e células em movimento. Com movimento reduzido, fica apenas a imagem parada.
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
      {PARTICLES.map((a, i) => {
        const Shape = SHAPES[a.kind];
        return (
          <div
            key={i}
            className={`atom opacity-70 ${a.wide ? "portrait:hidden" : ""}`}
            style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.size}vmin`, height: `${a.size}vmin`, ["--drift" as string]: `${a.drift}s`, ["--spin" as string]: `${a.spin}s`, ["--lag" as string]: `${a.lag}s` }}
          >
            <Shape hue={a.hue} />
          </div>
        );
      })}
    </div>
  );
}

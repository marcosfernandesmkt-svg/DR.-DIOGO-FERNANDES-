"use client";

import { useId, useRef } from "react";
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
const PARTICLES: { kind: Kind; x: number; y: number; size: number; drift: number; spin: number; lag: number; hue: Hue; wide?: boolean }[] = [
  { kind: "atom", x: 4, y: 13, size: 12, drift: 19, spin: 24, lag: -3, hue: "gold" },
  { kind: "molecule", x: 27, y: 7, size: 15, drift: 26, spin: 46, lag: -8, hue: "ice", wide: true },
  { kind: "cell", x: 43, y: 22, size: 13, drift: 23, spin: 60, lag: -14, hue: "gold", wide: true },
  { kind: "atom", x: 79, y: 8, size: 10, drift: 23, spin: 31, lag: -9, hue: "ice" },
  { kind: "molecule", x: 87, y: 34, size: 15, drift: 21, spin: 52, lag: -5, hue: "gold" },
  { kind: "cell", x: 88, y: 70, size: 17, drift: 27, spin: 70, lag: -11, hue: "ice" },
  { kind: "atom", x: 60, y: 82, size: 9, drift: 18, spin: 19, lag: -7, hue: "gold", wide: true },
];

type Hue = "gold" | "ice";
const ORBIT = "M-40,0 a40,13 0 1,0 80,0 a40,13 0 1,0 -80,0";

/* Esferas com luz vinda do alto à esquerda: é o volume que faz as formas parecerem reais */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}g`} cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#fff8e6" />
        <stop offset=".28" stopColor="#e4d1a5" />
        <stop offset=".62" stopColor="#c6a667" />
        <stop offset="1" stopColor="#4a3818" />
      </radialGradient>
      <radialGradient id={`${id}i`} cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#eef8ff" />
        <stop offset=".3" stopColor="#79b9e4" />
        <stop offset=".68" stopColor="#347cb5" />
        <stop offset="1" stopColor="#0b2038" />
      </radialGradient>
      <radialGradient id={`${id}h`}>
        <stop offset="0" stopColor="#e4d1a5" stopOpacity=".45" />
        <stop offset="1" stopColor="#e4d1a5" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}m`} cx="50%" cy="50%" r="50%">
        <stop offset=".55" stopColor="#79b9e4" stopOpacity=".02" />
        <stop offset=".86" stopColor="#79b9e4" stopOpacity=".16" />
        <stop offset="1" stopColor="#c6e3f7" stopOpacity=".42" />
      </radialGradient>
      <linearGradient id={`${id}b`} x1="0" x2="1">
        <stop offset="0" stopColor="#8a7344" />
        <stop offset=".5" stopColor="#e4d1a5" />
        <stop offset="1" stopColor="#8a7344" />
      </linearGradient>
      <filter id={`${id}f`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function Atom({ hue }: { hue: Hue }) {
  const id = useId().replace(/:/g, "");
  const ring = hue === "gold" ? "#c6a667" : "#79b9e4";
  // Núcleo: prótons e nêutrons agrupados
  const nucleons = [[0, 0, "g"], [-3.6, -2, "i"], [3.4, -2.4, "g"], [-1.6, 3.6, "g"], [3, 2.6, "i"], [-4, 2, "g"], [0.6, -4.4, "i"]] as const;
  return (
    <svg viewBox="-50 -50 100 100">
      <Defs id={id} />
      <circle r="16" fill={`url(#${id}h)`} />
      {[0, 60, 120].map((deg, i) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse rx="40" ry="13" fill="none" stroke={ring} strokeWidth=".9" opacity=".5" />
          <circle r="2.8" fill={`url(#${id}i)`} filter={`url(#${id}f)`}>
            <animateMotion dur={`${2.6 + i * 0.7}s`} repeatCount="indefinite" path={ORBIT} begin={`-${i * 0.9}s`} />
          </circle>
        </g>
      ))}
      {nucleons.map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="3.3" fill={`url(#${id}${c})`} />
      ))}
    </svg>
  );
}

/* Molécula em bolas e bastões: anel com ramos, esferas de dois tamanhos */
const NODES = [
  [0, -20], [17, -10], [17, 10], [0, 20], [-17, 10], [-17, -10], [33, -19], [-33, 19], [0, -38],
] as const;
const BONDS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [4, 7], [0, 8]] as const;

function Molecule({ hue }: { hue: Hue }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="-50 -50 100 100">
      <Defs id={id} />
      {BONDS.map(([a, b], i) => (
        <g key={i}>
          <line x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="#5f4d2a" strokeWidth="3.4" strokeLinecap="round" opacity=".85" />
          <line x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke={`url(#${id}b)`} strokeWidth="1.3" strokeLinecap="round" opacity=".9" />
        </g>
      ))}
      {NODES.map(([x, y], i) => {
        const big = i < 6 ? i % 2 === 0 : false;
        const c = hue === "gold" ? (i % 3 === 0 ? "i" : "g") : i % 3 === 0 ? "g" : "i";
        return <circle key={i} cx={x} cy={y} r={i > 5 ? 3.6 : big ? 6.2 : 5} fill={`url(#${id}${c})`} />;
      })}
    </svg>
  );
}

/* Célula translúcida: membrana com borda iluminada, núcleo com volume e mitocôndrias */
function Cell({ hue }: { hue: Hue }) {
  const id = useId().replace(/:/g, "");
  const n = hue === "gold" ? "g" : "i";
  return (
    <svg viewBox="-50 -50 100 100">
      <Defs id={id} />
      <g>
        <animateTransform attributeName="transform" type="scale" values="1;1.04;1" dur="7s" repeatCount="indefinite" />
        <circle r="41" fill={`url(#${id}m)`} />
        <circle r="41" fill="none" stroke="#c6e3f7" strokeWidth=".7" opacity=".45" />
        <circle r="37" fill="none" stroke="#79b9e4" strokeWidth=".5" strokeDasharray="1.5 3.5" opacity=".35" />
        {[[-21, 12, 25], [-12, -21, -40], [21, 19, 70], [24, -15, 10]].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse rx="6" ry="2.6" fill={`url(#${id}${i % 2 ? "g" : "i"})`} opacity=".75" />
            <path d="M-4,0 q1,-1.6 2,0 t2,0 t2,0" stroke="#fff8e6" strokeWidth=".4" fill="none" opacity=".5" />
          </g>
        ))}
        <circle cx="5" cy="-3" r="13" fill={`url(#${id}${n})`} opacity=".85">
          <animate attributeName="r" values="12.5;13.6;12.5" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="-1" r="3.6" fill="#fff8e6" opacity=".35" />
        <ellipse cx="-16" cy="-22" rx="11" ry="5" transform="rotate(-35 -16 -22)" fill="#ffffff" opacity=".07" />
      </g>
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
      {/* Célula da esquerda: a mesma célula da imagem, espelhada, para equilibrar a composição */}
      <div className="cell-left absolute left-[-2vw] top-[12svh] h-[76svh] portrait:left-[-18vw] portrait:top-[4svh] portrait:h-[38svh]" style={{ aspectRatio: "532 / 771" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- recorte espelhado da imagem fornecida */}
        <img src="/media/celula-esquerda.webp" alt="" width={532} height={771} decoding="async" className="size-full object-cover" />
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
            className={`atom ${a.size < 11 ? "opacity-55 blur-[.6px]" : "opacity-85"} ${a.wide ? "portrait:hidden" : ""}`}
            style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.size}vmin`, height: `${a.size}vmin`, ["--drift" as string]: `${a.drift}s`, ["--spin" as string]: `${a.spin}s`, ["--lag" as string]: `${a.lag}s` }}
          >
            <Shape hue={a.hue} />
          </div>
        );
      })}
    </div>
  );
}

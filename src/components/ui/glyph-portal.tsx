"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { GLYPH } from "@/lib/glyph";

type Props = {
  /** Texto do link que pula o efeito. */
  enterLabel: string;
  /** Âncora do fim da travessia. */
  targetId: string;
  /** Cenário revelado atrás da palavra. */
  background: ReactNode;
  /** Composição final, dentro da cena. */
  children: ReactNode;
  /** Conteúdo que continua abaixo da cena em telas estreitas. */
  after?: ReactNode;
};

const FAR = 30000;
/* Retângulo enorme com a palavra vazada: "evenodd" transforma as letras em buracos. */
const HOLE = `M${-FAR} ${-FAR}H${FAR * 2}V${FAR * 2}H${-FAR}Z ${GLYPH.d}`;

/**
 * A câmera atravessa a haste do D de SAÚDE, conduzida pela rolagem.
 *
 * O furo é um path vetorial, não uma máscara CSS: funciona igual no Safari, e cada
 * quadro redesenha só uma forma. A rolagem continua nativa (trilha + sticky).
 */
export function GlyphPortal({ enterLabel, targetId, background, children, after }: Props) {
  const scope = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const layer = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const g = layer.current;
        if (!g) return;
        const view = { p: 0 };

        /* Zoom exponencial: a velocidade percebida fica constante durante a aproximação. */
        const draw = () => {
          const { innerWidth: w, innerHeight: h } = window;
          const base = (w * (w > h ? 0.82 : 0.94)) / GLYPH.width;
          const startX = w / 2 + (GLYPH.portal.x - GLYPH.width / 2) * base;
          const startY = h / 2 + (GLYPH.portal.y - GLYPH.height / 2) * base;
          const reach = (Math.hypot(w, h) * 1.3) / (GLYPH.portal.stem * base);
          const scale = base * Math.pow(reach, view.p);
          const drift = Math.min(1, view.p * 2.6);
          const x = startX + (w / 2 - startX) * drift;
          const y = startY + (h / 2 - startY) * drift;
          g.setAttribute("transform", `translate(${x - GLYPH.portal.x * scale} ${y - GLYPH.portal.y * scale}) scale(${scale})`);
        };
        draw();

        /* A palavra nasce enquanto a seção sobe: o palco nunca entra vazio. */
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: track.current, start: "top 92%", end: "top 30%", scrub: 0.2 } })
          .fromTo(".gp-word", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
          .fromTo(".gp-line", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, 0.1)
          .fromTo(".gp-skip", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.6);

        gsap
          .timeline({
            defaults: { ease: "none" },
            // A trilha, não a seção: em telas estreitas a seção inclui a lista de etapas abaixo.
            scrollTrigger: { trigger: track.current, start: "top top", end: "bottom bottom", scrub: 0.2, onRefresh: draw },
          })
          .to(".gp-line", { opacity: 0, duration: 0.05 }, 0)
          .to(".gp-skip", { opacity: 0, duration: 0.06 }, 0.02)
          // O azul só existe atrás das letras depois que o dourado já as cobriu.
          .fromTo(".gp-scene", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0)
          .fromTo(".gp-scene", { scale: 1.1 }, { scale: 1, duration: 0.6, ease: "power1.out" }, 0)
          .to(".gp-gold", { opacity: 0, duration: 0.2, ease: "power1.in" }, 0.04)
          .to(view, { p: 1, duration: 0.6, ease: "power1.in", onUpdate: draw }, 0)
          .set(".gp-front", { autoAlpha: 0 }, 0.61)
          .fromTo(".gp-rise", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out", stagger: 0.024 }, 0.5);
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} aria-label="Cuidado em cada etapa" className="relative">
      <div ref={track} className="glyph-track relative">
        <div className="glyph-stage relative bg-ink">
          <div aria-hidden className="gp-scene absolute inset-0">
            {background}
          </div>

          <div className="gp-content relative flex min-h-svh flex-col justify-center">{children}</div>

          {/* Frente: preto com a palavra vazada; o dourado cobre as letras no início */}
          <div aria-hidden className="gp-front hero-hidden-rm pointer-events-none absolute inset-0 z-10">
            <svg className="absolute inset-0 size-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gp-gold-fill" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#E4D1A5" />
                  <stop offset=".55" stopColor="#C6A667" />
                  <stop offset="1" stopColor="#E4D1A5" />
                </linearGradient>
              </defs>
              <g ref={layer}>
                <path d={HOLE} fill="#080808" fillRule="evenodd" />
                <g className="gp-word">
                  <path className="gp-gold" d={GLYPH.d} fill="url(#gp-gold-fill)" fillRule="evenodd" />
                </g>
              </g>
            </svg>
            <span className="gp-line absolute inset-x-[34vw] top-[25%] h-px origin-center bg-gold" style={{ transform: "scaleX(0)" }} />
          </div>

          <a href={`#${targetId}`} className="gp-skip hero-hidden-rm eyebrow absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 inline-flex min-h-11 -translate-x-1/2 items-center text-gold-light underline-offset-4 hover:underline focus-visible:opacity-100">
            {enterLabel}
          </a>
        </div>
        <div id={targetId} tabIndex={-1} className="absolute bottom-[100svh] h-0 outline-none" />
      </div>
      {after}
    </section>
  );
}

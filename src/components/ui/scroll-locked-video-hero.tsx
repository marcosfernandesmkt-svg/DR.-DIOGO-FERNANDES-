"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { PHOTOS, SITE } from "@/lib/site";
import { Monogram } from "../monogram";
import { Magnetic } from "../magnetic";
import { HeroCells } from "./hero-cells";
import { ClinicEntry } from "../clinic-entry";

type Props = {
  /** Vídeo vertical real do médico. Opcional: sem ele (ou se falhar), a sequência usa a fotografia. */
  videoSrc?: string;
  /** Destino de quem quer pular a abertura. */
  skipTo: string;
};

const STATEMENT = "Medicina com ciência, atenção e individualidade.";

/* Caixa-alta-e-baixa de propósito: é a única voz do site fora das maiúsculas. */
const STATEMENT_LINES = [
  { text: "Medicina com", tone: "text-bone" },
  { text: "ciência,", tone: "italic text-gold-light" },
  { text: "atenção e", tone: "text-bone" },
  { text: "individualidade.", tone: "text-bone" },
];

function Chars({ text }: { text: string }) {
  return (
    <span className="block overflow-hidden py-[.04em]">
      {(text.match(/nd|\. |./gi) ?? []).map((c, i) => (
        <span key={i} className="ch inline-block whitespace-pre">
          {c}
        </span>
      ))}
    </span>
  );
}

function Name({ outline = false }: { outline?: boolean }) {
  return (
    <>
      <span className={`block text-[clamp(1.6rem,min(5.4vw,11svh),5.5rem)] leading-none portrait:text-[12vw] ${outline ? "name-outline" : ""}`}>
        <Chars text="Dr. Diogo" />
      </span>
      <span className={`block text-[min(15.6vw,30svh)] leading-[.92] whitespace-nowrap portrait:text-[15.2vw] ${outline ? "name-outline" : ""}`}>
        <Chars text="Fernandes" />
      </span>
    </>
  );
}

/**
 * Abertura controlada pela rolagem.
 *
 * Em vez de travar a página, a trilha alta (.hero-track) cria o espaço de rolagem
 * e o palco fica em `position: sticky`. Não há overflow no body, listeners de
 * wheel/touch nem preventDefault: rolagem, retorno e toque são sempre nativos.
 *
 * Coreografia: o nome sai, o fundo esfria em névoa azul e o retrato, sem moldura,
 * recua para a direita e se dissolve nela. A frase ocupa o espaço que ele deixou.
 */
export function ScrollLockedVideoHero({ videoSrc, skipTo }: Props) {
  const scope = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const useVideo = Boolean(videoSrc) && !videoFailed;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add({ desktop: `${MOTION_OK} and (orientation: landscape)`, mobile: `${MOTION_OK} and (orientation: portrait)` }, (ctx) => {
        const desktop = Boolean(ctx.conditions?.desktop);
        const root = scope.current!;
        let replay = false;
        try {
          replay = sessionStorage.getItem("df-intro") === "1";
          sessionStorage.setItem("df-intro", "1");
        } catch {}

        /* ---------- Entrada cinematográfica (atua nos elementos internos) ---------- */
        const intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1, onComplete: () => gsap.set(".figure-inner", { clearProps: "filter" }) });
        gsap.set(".intro-veil", { autoAlpha: 1 });
        document.documentElement.classList.add("ready");
        intro
          .fromTo(".intro-mono", { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.8 })
          .fromTo(".intro-line", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "expo.inOut" }, 0.3)
          .to(".intro-mono", { autoAlpha: 0, y: -12, duration: 0.4, ease: "power2.in" }, 0.9)
          .to(".intro-line", { autoAlpha: 0, duration: 0.4 }, 1.1)
          .to(".intro-veil", { autoAlpha: 0, duration: 0.3 }, 1.05)
          .fromTo(
            ".figure-inner",
            { clipPath: "inset(46% 0% 46% 0%)", scale: 1.1, filter: desktop ? "blur(12px)" : "none" },
            { clipPath: "inset(0% 0% 0% 0%)", scale: 1, filter: "blur(0px)", duration: 1.6 },
            0.9,
          )
          .from(".bg-glow", { opacity: 0, duration: 1.4 }, 1)
          .from(".ch", { yPercent: 112, duration: 1, stagger: 0.016 }, 1.3)
          .from(".hero-meta > *", { y: 12, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, 1.85);
        intro.timeScale(replay ? 2.4 : 1.25);

        /* ---------- Sequência de rolagem (atua nos invólucros externos) ---------- */
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            // Termina junto com o início do retrato, que se dissolve por cima deste palco.
            end: () => `+=${window.innerHeight * (desktop ? 0.8 : 0.7)}`,
            scrub: desktop ? true : 0.3,
            onUpdate: (self) => {
              const v = video.current;
              if (v?.duration) v.currentTime = self.progress * v.duration;
            },
          },
        });

        const recede = desktop
          ? { scale: 0.8, xPercent: 13, yPercent: 11 }
          : { scale: 0.84, xPercent: 9, yPercent: -5 };

        const at = (t: number) => t;
        tl.set(".figure-scrub", { transformOrigin: desktop ? "62% 21%" : "50% 23%" }, 0)
          .to(".name-a", { yPercent: -18, autoAlpha: 0, duration: at(0.18) }, 0)
          .to(".name-b", { yPercent: -22, autoAlpha: 0, duration: at(0.16) }, 0)
          .to(".hero-meta", { y: 16, autoAlpha: 0, duration: at(0.1) }, 0)
          .to(".bg-glow", { opacity: 0, duration: at(0.42) }, at(0.06))
          .to(".hero-cells", { opacity: 0.62, duration: at(0.42) }, at(0.06))
          .to(".cells-front", { autoAlpha: 0, duration: at(0.2) }, 0)
          .fromTo(".st-bg", { opacity: 0 }, { opacity: 1, duration: at(0.44) }, at(0.06))
          .fromTo(".st-fog", { opacity: 0 }, { opacity: 1, duration: at(0.34) }, at(0.16))
          .to(".figure-scrub", { ...recede, duration: at(0.5), ease: "power2.inOut" }, at(0.06))
          // A frase fica só com tipografia: a próxima seção já traz o médico em outro enquadramento.
          .to(".figure-scrub", { autoAlpha: 0, duration: at(0.2), ease: "power1.in" }, at(0.2))
          .fromTo(".st-block", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at(0.34))
          .fromTo(".st-rule", { scaleX: 0 }, { scaleX: 1, duration: at(0.16), ease: "power2.out" }, at(0.35))
          .fromTo(".st-line", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: at(0.17), ease: "power2.out", stagger: at(0.05) }, at(0.38));
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="topo" tabIndex={-1} aria-label="Apresentação" className="hero-track outline-none">
      <div className="hero-stage bg-ink">
        <div className="stage-depth absolute inset-0 will-change-transform">
        {/* Primeira dobra: luz dourada quente atrás do médico */}
        <div aria-hidden className="bg-glow absolute inset-0 bg-[radial-gradient(60vmax_60vmax_at_66%_30%,rgb(198_166_103/.13),transparent_70%),radial-gradient(70vmax_50vmax_at_6%_100%,rgb(52_124_181/.09),transparent_70%)]" />

        {/* Frase: o fundo esfria numa névoa azul que abraça a figura, sem moldura */}
        <div aria-hidden className="st-bg absolute inset-0 opacity-0">
          <div className="absolute inset-0 bg-[linear-gradient(100deg,#080808_18%,#090f16_52%,#0b1622_100%)] portrait:bg-[linear-gradient(180deg,#0b1622_0%,#090f16_40%,#080808_72%)]" />
          <div className="absolute right-[-10vw] top-[14svh] h-[84svh] w-[62vw] rounded-full bg-azure/11 blur-[110px] portrait:left-[-8vw] portrait:right-[-8vw] portrait:top-[8svh] portrait:h-[48svh] portrait:w-auto" />
          <div className="absolute bottom-[-14svh] left-[26vw] h-[44svh] w-[70vw] rounded-full bg-deep/70 blur-[70px] portrait:hidden" />
          <div className="grain absolute inset-0" />
        </div>

        {/* Células e moléculas: atrás do nome e da fotografia */}
        <HeroCells />

        {/* Nome atrás da figura */}
        <h1 aria-label={`${SITE.name}, ${SITE.role}, ${SITE.crm}`} className="hero-name rm-raise brand gutter absolute inset-x-0 bottom-[calc(max(17svh,6.75rem)+5rem)] text-bone portrait:opacity-0">
          <span aria-hidden className="block">
            <span className="name-a block"><Name /></span>
          </span>
        </h1>

        {/* Figura: GSAP move o invólucro, a entrada anima o elemento interno */}
        <div className="absolute inset-0">
          <div className="figure-scrub absolute inset-0 will-change-transform">
            <div className="figure-follow absolute inset-0">
            <div className="figure-inner absolute left-[62%] top-[-5svh] h-[132svh] w-auto -translate-x-1/2 portrait:left-1/2 portrait:top-[7svh] portrait:h-auto portrait:w-[118vw]" data-intro style={{ aspectRatio: "2 / 3" }}>
              {useVideo ? (
                <video ref={video} src={videoSrc} muted playsInline preload="auto" onError={() => setVideoFailed(true)} className="size-full object-cover" aria-hidden />
              ) : (
                <Image src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} fill priority quality={90} sizes="(orientation: portrait) 118vw, 88svh" className="object-contain object-top" />
              )}
            </div>
            </div>
          </div>
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[20svh] bg-linear-to-t from-ink via-ink/60 to-transparent portrait:h-[62svh] portrait:via-ink/70" />
          {/* Névoa que dissolve a base do retrato no fundo */}
          <div aria-hidden className="st-fog absolute inset-x-0 bottom-0 h-[52svh] bg-linear-to-t from-ink via-[#0a121b]/85 to-transparent opacity-0 portrait:h-[60svh] portrait:from-ink portrait:from-50% portrait:via-[#0a121b]/90 portrait:via-72%" />
        </div>

        {/* Célula desfocada em primeiro plano: coloca o doutor dentro da cena, nunca sobre o rosto */}
        <div aria-hidden className="cells-front hero-hidden-rm pointer-events-none absolute -bottom-[32svh] -right-[12vw] aspect-[16/9] w-[62vw] opacity-80 portrait:hidden" style={{ maskImage: "radial-gradient(closest-side, #000 30%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 30%, transparent 100%)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a mesma imagem fornecida, só desfocada no primeiro plano */}
          <img src="/media/celulas-fundo.webp" alt="" className="size-full object-cover object-[100%_60%] blur-[14px]" />
        </div>

        {/* Contorno à frente da figura: profundidade sem perder a leitura do nome */}
        <div aria-hidden className="rm-raise brand gutter pointer-events-none absolute inset-x-0 bottom-[calc(max(17svh,6.75rem)+5rem)] portrait:bottom-[calc(20rem+1svh)] [@media(orientation:portrait)_and_(max-height:700px)]:bottom-[15.5rem]">
          <span className="name-b block"><Name outline /></span>
        </div>

        {/* Frase: composição central, emoldurada por dois fios dourados */}
        <div data-intro className="st-block gutter hero-hidden-rm invisible absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          <span aria-hidden className="st-rule mx-auto mb-9 block h-px w-20 origin-center bg-gold portrait:mb-7" />
          <h2 className="font-display text-[clamp(2.75rem,min(5.8vw,11svh),6.75rem)] font-normal leading-[1.12] tracking-[-.012em] [font-optical-sizing:none] [font-variation-settings:'opsz'_40] portrait:text-[min(11.8vw,6.6svh)]">
            {STATEMENT_LINES.map((l, i) => (
              <span key={l.text}>
                <span className={`st-line block ${l.tone}`}>{l.text}</span>
                {i < STATEMENT_LINES.length - 1 ? " " : null}
              </span>
            ))}
          </h2>
          <span aria-hidden className="st-rule mx-auto mt-9 block h-px w-20 origin-center bg-gold portrait:mt-7" />
        </div>

        {/* Informações fixas da primeira dobra */}
        <div className="hero-meta gutter absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex items-end justify-between gap-6 portrait:flex-col portrait:items-stretch portrait:gap-3">
          <div className="min-w-0">
            <p className="rm-only eyebrow mb-1.5 max-w-[46ch] text-gold-light">{STATEMENT}</p>
            <p className="eyebrow text-gold portrait:text-[.6875rem]">Saúde hormonal e metabólica</p>
            <p className="mt-2 max-w-[44ch] text-[.9375rem] leading-[1.5] text-bone/75 portrait:text-sm [@media(max-height:700px)]:hidden">Cuidado médico individualizado, com atenção à sua saúde como um todo.</p>
            <p className="mt-2 text-xs uppercase tracking-[.16em] text-ash">{SITE.role} | {SITE.crm}</p>
            <ClinicEntry />
          </div>
          <div className="cue flex items-center gap-4 portrait:justify-between">
            <a href={skipTo} className="eyebrow inline-flex min-h-11 items-center text-bone/80 underline-offset-4 transition-colors hover:text-gold-light hover:underline landscape:hidden">
              Pular abertura
              <ArrowDown className="ml-2 size-3.5" aria-hidden />
            </a>
            <Magnetic className="hero-hidden-rm portrait:hidden">
              <a href={skipTo} aria-label="Role para explorar ou avance para o conteúdo" className="group relative grid size-24 place-items-center rounded-full border border-gold/45 text-center transition-colors hover:border-gold portrait:size-[4.75rem]">
                <span className="max-w-[4.5rem] text-[.5625rem] font-medium uppercase leading-[1.4] tracking-[.1em] text-bone/85">Role para explorar</span>
                <span aria-hidden className="absolute -bottom-3.5 left-1/2 h-6 w-px -translate-x-1/2 overflow-hidden bg-gold/25">
                  <span className="cue-dot block h-3 w-px bg-gold" />
                </span>
              </a>
            </Magnetic>
          </div>
        </div>

        </div>

        {/* Véu inicial */}
        <div aria-hidden className="intro-veil invisible absolute inset-0 z-10 grid place-items-center bg-ink">
          <Monogram className="intro-mono h-20 w-auto text-gold" />
          <span className="intro-line absolute inset-x-0 top-1/2 mt-16 h-px origin-left bg-gold" />
        </div>
      </div>
    </section>
  );
}

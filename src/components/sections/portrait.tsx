"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { PHOTOS, SITE } from "@/lib/site";

const BODY = "Presencial e on-line, quando aplicável, com acompanhamento individualizado e atenção à atualização científica.";

/* Base e laterais se dissolvem: o terno nunca termina numa borda reta. */
const PHOTO_MASK = "linear-gradient(to bottom, #000 72%, transparent 99%), linear-gradient(to right, transparent 0, #000 12%, #000 90%, transparent 100%)";

function Details({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="max-w-[40ch] text-[1.0625rem] leading-[1.6] text-bone">
        O <span className="brand brand-inline">{SITE.name}</span> atua com foco na saúde hormonal e metabólica, buscando compreender as necessidades individuais de cada paciente.
      </p>
      <p className="mt-4 max-w-[46ch] text-[.9375rem] leading-[1.7] text-bone/65">{BODY}</p>
      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[.16em] text-ash">Registro</dt>
          <dd className="mt-1 text-bone">{SITE.crm}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Retrato cinematográfico: apresenta o médico logo após a abertura. */
export function Portrait() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const previous = document.querySelector(".stage-depth");

        /* Dissolução: a frase sai enquanto o retrato já está entrando, sem preto no meio. */
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: scope.current, start: "top top", end: "bottom bottom", scrub: 0.2 } })
          .to(previous, { opacity: 0, scale: 0.98, duration: 0.09, ease: "power1.in" }, 0.01)
          .fromTo(".pt-base", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0)
          .fromTo(".pt-sweep", { xPercent: -120, opacity: 0.9 }, { xPercent: 120, opacity: 0.25, duration: 0.3, ease: "power1.inOut" }, 0)
          .fromTo(".pt-bg", { xPercent: 4 }, { xPercent: -4, duration: 0.6 }, 0)

          /* Portrait Depth Reveal */
          .fromTo(".pt-line", { scaleY: 0 }, { scaleY: 1, duration: 0.08, ease: "power2.out" }, 0.02)
          .fromTo(".pt-frame", { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.17, ease: "power2.inOut" }, 0.06)
          .fromTo(".pt-img", { scale: 1.1 }, { scale: 1, duration: 0.3, ease: "power1.out" }, 0.02)
          .to(".pt-line", { opacity: 0, duration: 0.06 }, 0.2)
          .fromTo(".pt-eyebrow", { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.08)
          .fromTo(".pt-name", { yPercent: 104 }, { yPercent: 0, duration: 0.11, ease: "power3.out", stagger: 0.03 }, 0.08)
          .fromTo(".pt-text", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.08 }, 0.15)

          /* Editorial Layer: o retrato recua e a cobertura sobe trazendo a Filosofia. */
          .to(".pt-frame", { scale: 0.94, duration: 0.2, ease: "power1.inOut" }, 0.6)
          .fromTo(".pt-cover", { yPercent: 100, autoAlpha: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.2, ease: "power2.inOut" }, 0.62)
          .fromTo(".pt-band", { scaleX: 0 }, { scaleX: 1, duration: 0.16, ease: "power2.out" }, 0.64);
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} aria-label="O Dr. Diogo Fernandes" className="portrait-track relative z-[1]">
      {/* Destino de quem pula a abertura: o ponto em que o retrato já está revelado */}
      <div id="retrato" tabIndex={-1} className="absolute top-[36svh] h-0 outline-none" />
      <div className="portrait-stage relative">
        {/* Uma única luz, lateral e direcional */}
        <div aria-hidden className="pt-base absolute inset-0 overflow-hidden bg-[linear-gradient(260deg,#080808_18%,#090f16_52%,#0b1622_100%)]">
          <div className="pt-bg absolute -inset-x-[8%] inset-y-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem fornecida, sem recompressão */}
            <img src="/media/celulas-fundo.webp" alt="" loading="lazy" className="size-full object-cover object-[100%_50%] opacity-70 [transform:scaleX(-1)]" />
            {/* Escurece só o lado do texto; do lado do doutor as células ficam vivas */}
            <div className="absolute inset-0 bg-[linear-gradient(258deg,#080808_30%,rgb(8_8_8/.72)_52%,rgb(8_8_8/.1)_82%)] portrait:bg-[linear-gradient(0deg,#080808_30%,rgb(8_8_8/.5)_62%,rgb(8_8_8/.1)_100%)]" />
          </div>
        </div>

        <span aria-hidden className="pt-line hero-hidden-rm absolute left-[9vw] top-[10svh] h-[80svh] w-px origin-top bg-linear-to-b from-transparent via-ice/70 to-transparent portrait:left-[11vw] portrait:top-[9svh] portrait:h-[52svh]" />

        {/* Luz azul que atravessa o fundo durante a passagem */}
        <div aria-hidden className="pt-sweep hero-hidden-rm absolute inset-y-0 left-0 w-[70vw] bg-[linear-gradient(100deg,transparent,rgb(52_124_181/.16)_50%,transparent)]" />

        {/* Retrato */}
        <div className="pt-frame absolute bottom-0 left-[7vw] top-[10svh] aspect-[4/5] max-w-[46vw] portrait:left-[11vw] portrait:right-[11vw] portrait:top-[9svh] portrait:bottom-auto portrait:h-[52svh] portrait:aspect-auto portrait:max-w-none">
          <div className="pt-img relative size-full" style={{ maskImage: PHOTO_MASK, WebkitMaskImage: PHOTO_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}>
            <Image src={PHOTOS.portrait.src} alt={PHOTOS.portrait.alt} fill loading="lazy" quality={90} sizes="(orientation: portrait) 78vw, 46vw" className="object-cover object-[50%_12%]" />
          </div>
        </div>

        {/* Nome */}
        <div className="gutter absolute bottom-[12svh] right-0 w-[44vw] portrait:bottom-[max(2rem,5svh)] portrait:left-0 portrait:w-full">
          <p className="pt-eyebrow eyebrow mb-5 text-gold portrait:mb-3">01 / O médico</p>
          <h2 className="brand text-[clamp(2.5rem,min(5.6vw,12svh),6.5rem)] leading-[1.04] text-bone portrait:text-[min(13vw,8svh)]">
            <span className="block overflow-hidden pb-[.04em]"><span className="pt-name block">Dr. Diogo</span></span>
            <span className="block overflow-hidden pb-[.04em]"><span className="pt-name block">Fernandes</span></span>
          </h2>
          <Details className="pt-text mt-8 portrait:hidden" />
        </div>

        {/* Camada que cobre o retrato e já tem o preto da seção seguinte */}
        <div className="pt-cover hero-hidden-rm invisible absolute inset-0 z-10 flex items-center bg-ink">
          <span aria-hidden className="pt-band absolute inset-x-0 top-0 h-px origin-left bg-linear-to-r from-gold via-gold-light to-transparent" />
          {/* No celular, as informações chegam na própria cobertura: nada de tela vazia */}
          <Details className="gutter landscape:hidden" />
        </div>
      </div>

      {/* Sem animação, as informações do celular ficam em fluxo normal */}
      <div className="rm-portrait gutter bg-ink py-14">
        <Details />
      </div>
    </section>
  );
}

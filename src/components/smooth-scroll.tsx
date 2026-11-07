"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Suaviza só a roda do mouse/trackpad em ponteiro preciso. Toque e movimento
 * reduzido ficam 100% nativos: nada aqui intercepta ou trava a rolagem.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const curtain = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = !reduce && matchMedia("(pointer: fine)").matches ? new Lenis({ lerp: 0.15, wheelMultiplier: 1 }) : null;
    const raf = (t: number) => lenis?.raf(t * 1000);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const onClick = (e: MouseEvent) => {
      // Um link que já tratou o próprio clique (o "Agendar" do topo abre a clínica) não rola a página
      if (e.defaultPrevented) return;
      const link = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      e.preventDefault();
      const finish = () => target.focus({ preventScroll: true });

      /* Cortina dourada: duas folhas fecham, a linha cruza o centro, a página salta
         por trás e as folhas se abrem. Mesma linguagem da chegada por rolagem. */
      if (hash === "#agendar" && !reduce && curtain.current) {
        const c = curtain.current;
        const [top, bottom, line] = Array.from(c.children);
        if (gsap.isTweening(top)) return;
        gsap
          .timeline({ onComplete: finish })
          .set(c, { autoAlpha: 1 })
          .set(top, { yPercent: -100 })
          .set(bottom, { yPercent: 100 })
          .set(line, { scaleX: 0, opacity: 1 })
          .to([top, bottom], { yPercent: 0, duration: 0.42, ease: "expo.inOut" })
          .to(line, { scaleX: 1, duration: 0.34, ease: "power2.inOut" }, 0.14)
          .call(() => {
            if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
            else target.scrollIntoView({ behavior: "auto" });
            ScrollTrigger.update();
          })
          .to(line, { opacity: 0, duration: 0.18 }, 0.56)
          .to(top, { yPercent: -100, duration: 0.5, ease: "expo.inOut" }, 0.56)
          .to(bottom, { yPercent: 100, duration: 0.5, ease: "expo.inOut" }, 0.56)
          .set(c, { autoAlpha: 0 });
        return;
      }

      if (lenis) lenis.scrollTo(target, { duration: 1.5, onComplete: finish });
      else {
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        finish();
      }
    };
    document.addEventListener("click", onClick);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <div ref={curtain} aria-hidden className="curtain">
        <span className="absolute inset-x-0 top-0 h-1/2 bg-ink" />
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
        <span className="absolute inset-x-0 top-1/2 h-px origin-left bg-linear-to-r from-gold via-gold-light to-gold/40" />
      </div>
    </MotionConfig>
  );
}

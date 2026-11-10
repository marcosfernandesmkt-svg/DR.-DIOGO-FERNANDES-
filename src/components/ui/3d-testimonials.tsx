"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import clsx from "clsx";

/**
 * Marquee do componente "3d-testimonials", adaptado.
 *
 * Mantém as propriedades do original (vertical, reverse, pauseOnHover, repeat, className).
 * Correções: só a primeira cópia é lida por leitores de tela e percorrida pelo teclado; as
 * demais são decorativas (aria-hidden, sem tabulação) mas continuam clicáveis, porque metade
 * do tempo são elas que estão na tela. A pausa vale também para o foco, e a duração vem de
 * --duration, configurável por CSS.
 */
export function Marquee({
  children,
  vertical = false,
  reverse = false,
  pauseOnHover = false,
  repeat = 2,
  className,
  style,
}: {
  children: ReactNode;
  vertical?: boolean;
  reverse?: boolean;
  pauseOnHover?: boolean;
  repeat?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    root.current
      ?.querySelectorAll<HTMLElement>('[data-copy] :is(a[href], button, [tabindex]:not([tabindex="-1"]))')
      .forEach((el) => el.setAttribute("tabindex", "-1"));
  });

  return (
    <div
      ref={root}
      className={clsx("marquee flex overflow-hidden [gap:var(--gap)]", vertical ? "flex-col" : "flex-row", pauseOnHover && "marquee-pausable", className)}
      style={style}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          data-copy={i > 0 || undefined}
          className={clsx("marquee-track flex shrink-0 [gap:var(--gap)]", vertical ? "marquee-y flex-col" : "marquee-x flex-row", reverse && "marquee-reverse")}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

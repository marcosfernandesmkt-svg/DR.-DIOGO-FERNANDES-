"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/gsap";

const view = { once: true, margin: "0px 0px -12% 0px" } as const;

/** Entrada discreta: curta distância e curva de desaceleração. */
export function Fade({ children, className, delay = 0, y = 14 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={view} transition={{ duration: 0.8, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Fio dourado que nasce da esquerda. */
export function Rule({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left bg-gold/45 ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={view}
      transition={{ duration: 1.1, ease: EASE, delay }}
    />
  );
}

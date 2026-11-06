import { MONOGRAM } from "@/lib/monogram";

/** Monograma DF oficial, vetorizado do logotipo aprovado. */
export function Monogram({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox={`0 0 ${MONOGRAM.width} ${MONOGRAM.height}`} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={MONOGRAM.d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

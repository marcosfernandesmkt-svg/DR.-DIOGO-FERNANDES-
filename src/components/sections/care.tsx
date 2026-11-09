"use client";

import { GlyphPortal } from "../ui/glyph-portal";
import { STEPS } from "@/lib/site";

function Heading() {
  return (
    <div className="gutter">
      <p className="gp-rise eyebrow text-gold">03 / Como funciona</p>
      <h2 className="gp-rise display mt-6 text-balance text-[clamp(2.25rem,5vw,5.25rem)] leading-[1.08] text-bone">Cuidado em cada etapa.</h2>
      <p className="gp-rise mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.6] text-bone/78">Da primeira conversa ao acompanhamento, escuta e atenção para construir com você o caminho para uma vida com mais saúde e longevidade.</p>
    </div>
  );
}

function Steps({ row }: { row: boolean }) {
  return (
    <ol className={row ? "grid grid-cols-4 gap-x-[clamp(1.5rem,3vw,3.5rem)]" : "space-y-0"}>
      {STEPS.map((s) => (
        <li key={s.n} className={`border-t border-gold/40 ${row ? "gp-rise pt-6" : "py-7"}`}>
          <p aria-hidden className="text-sm tabular-nums tracking-[.14em] text-gold">{s.n}</p>
          <h3 className="display mt-3 text-[clamp(1.25rem,2vw,1.875rem)] leading-[1.15] text-bone">{s.title}</h3>
          <p className="mt-3 max-w-[30ch] leading-[1.6] text-bone/72">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** O grande efeito do site: a travessia de SAÚDE revela as etapas do acompanhamento. */
export function Care() {
  return (
    <GlyphPortal
      enterLabel="Explorar o cuidado"
      targetId="cuidado"
      background={
        <div className="absolute -inset-[4%] bg-[linear-gradient(180deg,#102943_0%,#0d2036_46%,#09111a_100%)]">
          {/* Luz azul atrás do portal: é o que se vê pela haste da letra durante a travessia */}
          <div className="absolute inset-0 bg-[radial-gradient(60%_58%_at_50%_46%,rgb(52_124_181/.62),transparent_100%)]" />
        </div>
      }
      after={
        <div className="steps-flow gutter bg-[#09111a] pb-6">
          <Steps row={false} />
        </div>
      }
    >
      <Heading />
      <div className="steps-stage gutter mt-[clamp(2.5rem,7svh,5rem)]">
        <Steps row />
      </div>
    </GlyphPortal>
  );
}

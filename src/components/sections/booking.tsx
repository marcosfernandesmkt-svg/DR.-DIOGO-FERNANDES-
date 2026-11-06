"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { CLINICS, type Clinic } from "@/lib/site";
import { FAREWELL_MS, MESSAGE, NOTE, openDestination } from "@/lib/clinic-link";
import { Monogram } from "../monogram";
import { Fade } from "../reveal";

const subscribe = () => () => {};

export function Booking() {
  // A passagem vai para o <body>: dentro do <main> ela ficaria abaixo do cabeçalho.
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const [chosen, setChosen] = useState<Clinic | null>(null);
  const timers = useRef<number[]>([]);
  const wrap = useRef<HTMLDivElement>(null);

  /* Golden Curtain Reveal: a seção anterior desliza, a linha cruza e a cortina se abre. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const head = wrap.current?.querySelector(".bk-head");
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: head, start: "top 82%", end: "top 12%", scrub: 0.2 } })
          .fromTo(".bk-line", { scaleX: 0 }, { scaleX: 1, duration: 0.42, ease: "power2.inOut" }, 0)
          .to(".bk-a", { yPercent: -101, duration: 0.56, ease: "power2.inOut" }, 0.4)
          .to(".bk-b", { yPercent: 101, duration: 0.56, ease: "power2.inOut" }, 0.4)
          .to(".bk-line", { opacity: 0, duration: 0.2 }, 0.8)
          .to(document.querySelector("#atuacao > div"), { y: -56, duration: 1 }, 0);
      });
      return () => mm.revert();
    },
    { scope: wrap },
  );

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  /* Ao voltar do WhatsApp (ou pelo botão Voltar, com bfcache), a página está limpa. */
  useEffect(() => {
    const reset = () => setChosen(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const onChoose = (e: MouseEvent<HTMLAnchorElement>, clinic: Clinic) => {
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
    if (modified || matchMedia("(prefers-reduced-motion: reduce)").matches) return; // link nativo, direto
    e.preventDefault();
    clear();
    const finish = openDestination(clinic); // precisa acontecer aqui, dentro do clique
    setChosen(clinic);
    timers.current.push(
      window.setTimeout(() => finish?.(), FAREWELL_MS),
      window.setTimeout(() => setChosen(null), FAREWELL_MS + 700),
    );
  };

  return (
    <div ref={wrap}>
      <section id="agendar" tabIndex={-1} className="section relative overflow-clip bg-ink outline-none" style={{ paddingTop: 0 }}>
      <div className="bk-head relative overflow-clip">
        <div className="gutter grid gap-8 py-[clamp(5rem,11vw,9rem)] lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow text-gold">05 / Agendamento</p>
            <h2 className="display mt-7 max-w-[14ch] text-balance text-[clamp(2.25rem,5vw,5.25rem)] leading-[1.08] text-bone">
              Seu cuidado começa <span className="italic text-gold-light">aqui.</span>
            </h2>
          </div>
          <Fade delay={0.1} className="lg:col-span-4">
            <div className="max-w-[40ch] lg:ml-auto">
              <p className="eyebrow text-gold-light">Atendimento presencial e on-line</p>
              <p className="mt-3 leading-[1.7] text-bone/68">Escolha o local de atendimento de sua preferência e entre em contato para agendar sua consulta.</p>
              <p className="mt-3 text-sm leading-[1.6] text-ash">Quando aplicável e adequado ao caso, o atendimento on-line poderá ocorrer conforme as normas vigentes.</p>
            </div>
          </Fade>
        </div>
        {/* Cortina: duas folhas com a cor da seção anterior e a linha no centro */}
        <span aria-hidden className="bk-a hero-hidden-rm absolute inset-x-0 top-0 h-1/2 bg-[#09111a]" />
        <span aria-hidden className="bk-b hero-hidden-rm absolute inset-x-0 bottom-0 h-1/2 bg-[#09111a]" />
        <span aria-hidden className="bk-line hero-hidden-rm absolute inset-x-0 top-1/2 h-px origin-left bg-linear-to-r from-gold via-gold-light to-gold/40" style={{ transform: "scaleX(0)" }} />
      </div>

      <div className="gutter relative">
        <ul>
          {CLINICS.map((c, i) => (
            <motion.li
              key={c.href}
              className={i === CLINICS.length - 1 ? "mt-8 md:mt-10" : undefined}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -6% 0px" }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.05 }}
            >
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Agendar em ${c.name}, ${c.city}, pelo WhatsApp (abre em nova guia)`}
                onClick={(e) => onChoose(e, c)}
                className="row relative isolate grid min-h-[5.25rem] cursor-pointer grid-cols-[1fr_auto] items-center gap-x-5 border-t border-gold/20 py-5 md:min-h-[6.5rem] md:grid-cols-[3.5rem_1fr_minmax(11rem,16rem)_auto] md:gap-x-6 md:py-6"
              >
                <span aria-hidden className="band -z-10" />
                <span aria-hidden className="sweep" />
                <span aria-hidden className="slide hidden text-sm tabular-nums tracking-[.14em] text-gold md:block">{String(i + 1).padStart(2, "0")}</span>
                <span className="slide min-w-0 md:contents">
                  <span className="display tint block text-[clamp(1.3125rem,2.6vw,2.625rem)] leading-[1.14] text-bone transition-colors">{c.name}</span>
                  <span className="mt-1.5 block text-xs uppercase tracking-[.16em] text-ash md:mt-0 md:text-right">{c.city}</span>
                </span>
                <span aria-hidden className="ring relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/35 text-gold-light">
                  <span className="relative block size-[1.125rem] overflow-hidden">
                    <ArrowUpRight className="arrow-a size-full" strokeWidth={1.25} />
                    <ArrowUpRight className="arrow-b size-full" strokeWidth={1.25} />
                  </span>
                </span>
              </a>
            </motion.li>
          ))}
          <li aria-hidden className="border-t border-gold/20" />
        </ul>
      </div>

      {isClient &&
        createPortal(
      <AnimatePresence>
        {chosen && (
          <motion.div
            role="status"
            aria-live="assertive"
            className="fixed inset-0 z-50 grid place-items-center bg-ink px-6 text-center"
            initial={{ clipPath: "inset(50% 0% 50% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: 0.14 }} className="flex flex-col items-center">
              <Monogram className="h-9 w-auto text-gold" />
              <p className="eyebrow mt-7 text-gold-light">{chosen.name} — {chosen.city}</p>
              <p className="display mt-5 max-w-[16ch] text-balance text-[clamp(1.875rem,4.4vw,3.75rem)] leading-[1.12] text-bone">{MESSAGE}</p>
              <p className="mt-4 text-bone/75">{NOTE}</p>
              <span aria-hidden className="mt-7 block h-px w-40 overflow-hidden bg-gold/20">
                <motion.span className="block h-full origin-left bg-gold" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: FAREWELL_MS / 1000, ease: "linear" }} />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}
      </section>
    </div>
  );
}

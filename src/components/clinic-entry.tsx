"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import type { ClinicScene } from "@/lib/three/clinic-scene";
import { FAREWELL_MS, MESSAGE, openDestination } from "@/lib/clinic-link";
import { EASE } from "@/lib/gsap";
import { CLINICS, PHOTOS, type Clinic } from "@/lib/site";
import { Magnetic } from "./magnetic";
import { LivingCells } from "./ui/living-cells";
import { Monogram } from "./monogram";

type Stage = "welcome" | "doors" | "inside";

/** Botão da abertura e a experiência opcional da clínica virtual. */
export function ClinicEntry() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="mt-5 flex flex-col items-start portrait:mt-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <Magnetic strength={0.14}>
        <motion.button
          ref={trigger}
          type="button"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.985 }}
          className="group relative isolate flex h-[46px] w-fit items-center gap-2.5 overflow-hidden rounded-[3px] border border-gold/45 bg-ink/55 px-5 text-xs font-medium uppercase tracking-[.15em] text-gold-light transition-[border-color,background-color,color] duration-500 ease-cine hover:border-gold hover:bg-[#15130f] hover:text-gold-light"
        >
          <span aria-hidden className="absolute inset-y-0 left-0 -z-10 w-1/2 -translate-x-full bg-linear-to-r from-transparent via-gold/14 to-transparent transition-transform duration-[900ms] ease-cine group-hover:translate-x-[220%]" />
          Marque seu atendimento
          <ArrowRight className="size-3.5 transition-transform duration-500 ease-cine group-hover:translate-x-[3px]" strokeWidth={1.5} aria-hidden />
        </motion.button>
      </Magnetic>
      <a href="#agendar" className="inline-flex min-h-11 items-center text-xs text-gold-light/85 underline-offset-4 hover:underline">
        Ver lista de clínicas
      </a>
      </div>
      <p className="mt-2 text-[.8125rem] leading-snug text-bone/70 portrait:text-xs [@media(max-height:700px)]:hidden">Entre e escolha onde deseja realizar seu atendimento.</p>
      {open && createPortal(<Experience onClose={close} />, document.body)}
    </div>
  );
}

function Experience({ onClose }: { onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<ClinicScene | null>(null);
  const labels = useRef<(HTMLAnchorElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const arrived = useRef(false);
  const [stage, setStage] = useState<Stage>("welcome");
  /* Lista direta: sem WebGL, com movimento reduzido ou em telas estreitas. */
  const [flat, setFlat] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [narrow] = useState(() => matchMedia("(pointer: coarse), (max-width: 899px)").matches);
  const [hover, setHover] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [field, setField] = useState(false);
  const [chosen, setChosen] = useState<Clinic | null>(null);

  /* O salão se dissolve e as esculturas reaparecem sobre o campo celular. Nunca há preto:
     a imagem está atrás do canvas o tempo todo. */
  const goInside = useCallback(() => {
    timers.current.forEach(clearTimeout);
    arrived.current = true;
    setStage("inside");
    setField(false);
    setReady(false);
    timers.current.push(
      window.setTimeout(() => {
        scene.current?.isolate();
        setField(true);
        setReady(true);
      }, 520),
    );
  }, []);

  /* Cena 3D carregada só agora: quem não abre a experiência não baixa nada disso. */
  useEffect(() => {
    if (flat) {
      return;
    }
    let cancelled = false;
    const el = canvas.current;
    /* Montar a cena trava a tela por um instante: isso acontece depois que a fotografia
       terminou de entrar, para o primeiro gesto do visitante nunca engasgar. */
    const settled = new Promise((resolve) => window.setTimeout(resolve, 950));
    Promise.all([import("@/lib/three/clinic-scene"), settled])
      .then(([{ createClinicScene }]) => {
        if (cancelled || !el) return;
        const s = createClinicScene(el, {
          mobile: narrow,
          count: CLINICS.length,
          onHover: setHover,
          onPick: (i) => labels.current[i]?.click(),
          onLabels: narrow
            ? undefined
            : (points) =>
                points.forEach((p, i) => {
                  const label = labels.current[i];
                  if (label) label.style.transform = `translate3d(${p.x}px, ${p.y + 62}px, 0) translateX(-50%)`;
                }),
        });
        if (!s) {
          setFlat(true);
          return;
        }
        scene.current = s;
        // "Pular" antes de a cena carregar: não há entrada para tocar
        if (arrived.current) {
          s.skip();
          s.isolate();
          setField(true);
          setReady(true);
          return;
        }
        setReady(true);
        timers.current.push(
          window.setTimeout(() => {
            setStage("doors");
            s.enter(goInside);
          }, 1300),
        );
      })
      .catch(() => setFlat(true)); // falha de rede: a lista continua funcionando

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      scene.current?.dispose();
      scene.current = null;
    };
  }, [flat, narrow, goInside]);

  /* Uma animação de fundo por vez: a da abertura pausa enquanto a clínica estiver aberta. */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("clinic-toggle", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("clinic-toggle", { detail: false }));
    };
  }, []);

  /* Modal de verdade: Esc fecha e o foco fica preso aqui até sair. */
  useEffect(() => {
    root.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>("a[href], button")].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const skip = () => {
    scene.current?.skip();
    goInside();
  };

  const choose = (e: MouseEvent<HTMLAnchorElement>, clinic: Clinic, i: number) => {
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
    if (modified || flat) return; // link nativo, direto
    e.preventDefault();
    const finish = openDestination(clinic); // precisa acontecer dentro do clique
    scene.current?.select(i);
    setChosen(clinic);
    timers.current.push(
      window.setTimeout(() => finish?.(), FAREWELL_MS),
      window.setTimeout(() => {
        setChosen(null);
        scene.current?.select(null);
      }, FAREWELL_MS + 1100),
    );
  };

  const showList = flat || stage === "inside";

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Clínica virtual: escolha onde deseja ser atendido"
      tabIndex={-1}
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={`fixed inset-0 z-[80] overscroll-contain bg-ink text-bone outline-none ${flat || narrow ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {/* Imagem original, sem filtro: em cover, com a mesma câmera lenta da abertura */}
      <div aria-hidden className="fixed inset-0 overflow-hidden">
        <LivingCells />
      </div>
      {!flat && <canvas ref={canvas} aria-hidden className={`fixed inset-0 size-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`} />}

      {/* Boas-vindas: fotografia real, animada apenas por câmera */}
      <AnimatePresence>
        {!flat && stage === "welcome" && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-10 flex items-end justify-center gap-[5vw] bg-[linear-gradient(90deg,rgb(8_8_8/.2),rgb(8_8_8/.86)_70%)] portrait:bg-[linear-gradient(0deg,rgb(8_8_8/.92),rgb(8_8_8/.62))] px-6 portrait:flex-col-reverse portrait:items-center portrait:justify-end portrait:gap-5 portrait:pt-20 landscape:items-center">
            <motion.div initial={{ opacity: 0, x: -30, scale: 1.05 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 1.3, ease: EASE }} className="relative aspect-[4/5] h-[74svh] max-w-[46vw] portrait:h-[42svh] portrait:max-w-none">
              <Image src={PHOTOS.portrait.src} alt={PHOTOS.portrait.alt} fill sizes="(orientation: portrait) 70vw, 46vw" className="object-cover object-top" style={{ maskImage: "linear-gradient(to bottom, #000 74%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, #000 74%, transparent 100%)" }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.3 }} className="max-w-[34rem] text-center landscape:text-left">
              <Monogram className="mb-6 h-8 w-auto text-gold portrait:mx-auto portrait:mb-3" />
              <p className="display text-balance text-[clamp(1.75rem,3.4vw,3.25rem)] leading-[1.14]">Seja bem-vindo.</p>
              <p className="display mt-2 text-balance text-[clamp(1.5rem,2.8vw,2.75rem)] leading-[1.14] text-gold-light">{MESSAGE}</p>
              <p className="mt-5 leading-[1.6] text-bone/80">Escolha o local mais conveniente para seu atendimento.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!flat && !field && <p className="pointer-events-none fixed bottom-2 right-3 z-20 text-[.625rem] tracking-[.08em] text-bone/45 portrait:hidden">Ambiente ilustrativo</p>}

      {/* Controles sempre disponíveis */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={skip} aria-label="Pular animação de entrada" className={`eyebrow inline-flex min-h-11 items-center rounded-full border border-gold/40 bg-ink/60 px-5 text-gold-light backdrop-blur-sm transition-colors hover:border-gold ${showList ? "invisible" : ""}`}>
          Pular
        </button>
        <button type="button" onClick={onClose} aria-label="Fechar e voltar ao site" className="eyebrow inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-ink/60 px-5 text-gold-light backdrop-blur-sm transition-colors hover:border-gold">
          Voltar ao site
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Salão: cada molécula tem um link real, mesmo sem 3D */}
      {showList && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: flat ? 0 : 0.1 }} className="relative z-20 flex min-h-svh flex-col">
          <header className="pointer-events-none px-6 pt-24 text-center">
            {flat && <p className="display text-balance text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.14]">Seja bem-vindo. <span className="text-gold-light">{MESSAGE}</span></p>}
            <p className="mt-2 leading-[1.5] text-bone/85 [text-shadow:0_1px_12px_#000]">Escolha o local mais conveniente para seu atendimento.</p>
          </header>
          <ul className={flat ? "mx-auto mt-8 grid w-full max-w-3xl gap-2.5 px-5 pb-10 sm:grid-cols-2" : narrow ? "mx-auto mt-auto grid w-full max-w-3xl grid-cols-2 gap-2 px-3 pb-[max(.875rem,env(safe-area-inset-bottom))]" : "contents"}>
            {CLINICS.map((c, i) => {
              const active = hover === i;
              const float = !flat && !narrow;
              return (
                <li key={c.href} className={float ? "contents" : undefined}>
                  <a
                    ref={(el) => {
                      labels.current[i] = el;
                    }}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Agendar em ${c.name}, ${c.city}, pelo WhatsApp (abre em nova guia)`}
                    onClick={(e) => choose(e, c, i)}
                    onPointerEnter={() => {
                      setHover(i);
                      scene.current?.hover(i);
                    }}
                    onPointerLeave={() => {
                      setHover(null);
                      scene.current?.hover(null);
                    }}
                    onFocus={() => scene.current?.hover(i)}
                    onBlur={() => scene.current?.hover(null)}
                    className={`group block border-t bg-ink/72 px-4 py-3 text-center transition-[border-color,opacity,background-color] duration-300 ${float ? "fixed left-0 top-0 w-56" : `flex min-h-[4.25rem] items-center justify-between gap-2 text-left ${flat ? "" : "h-full px-3"}`} ${active ? "border-gold bg-ink/90" : "border-gold/35"} ${chosen && chosen !== c ? "opacity-20" : ""}`}
                  >
                    <span className="block">
                      <span className={`display block leading-[1.18] text-bone ${flat || float ? "text-[1.0625rem]" : "text-[.9375rem]"}`}>{c.name}</span>
                      <span className="mt-1 block text-[.6875rem] uppercase tracking-[.16em] text-ash">{c.city}</span>
                      {float && <span className={`eyebrow mt-2 block overflow-hidden text-[.625rem] text-gold-light transition-all duration-300 ${active ? "max-h-5 opacity-100" : "max-h-0 opacity-0"}`}>Agendar consulta</span>}
                    </span>
                    {!float && (
                      <span aria-hidden className="flex shrink-0 items-center gap-1.5 text-[.625rem] uppercase tracking-[.12em] text-gold-light">
                        {flat && "Agendar"}
                        <ArrowUpRight className="size-4" />
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      {/* Confirmação breve; o WhatsApp já foi aberto no clique */}
      <AnimatePresence>
        {chosen && (
          <motion.div role="status" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="pointer-events-none fixed inset-x-0 bottom-[8svh] z-40 px-6 text-center">
            <p className="eyebrow text-gold-light [text-shadow:0_1px_10px_#000]">{chosen.name} — {chosen.city}</p>
            <p className="display mt-3 text-[clamp(1.625rem,3.4vw,3rem)] leading-[1.14] text-bone [text-shadow:0_2px_18px_#000]">{MESSAGE}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

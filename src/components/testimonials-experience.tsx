"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { SITE } from "@/lib/site";
import { TESTIMONIALS_MODE, VISIBLE_TESTIMONIALS, type Testimonial } from "@/lib/testimonials";

/** O item "Depoimentos" do menu pede a experiência por este evento. */
export const OPEN_TESTIMONIALS = "open-testimonials";

const TITLE = "A experiência de quem foi atendido.";
const SUBTITLE = "Relatos sobre a atenção, o acolhimento e a experiência de atendimento.";
const LONG = 170; // a partir daqui o card mostra "Ler depoimento completo"
const SPEED = { fine: 26, coarse: 18 }; // px por segundo: tranquilo, nunca apressado

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fica montado na página e só abre o painel quando pedido. */
export function TestimonialsExperience() {
  const [open, setOpen] = useState(false);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      returnTo.current = (e as CustomEvent<HTMLElement | null>).detail ?? null;
      setOpen(true);
    };
    window.addEventListener(OPEN_TESTIMONIALS, onOpen);
    return () => window.removeEventListener(OPEN_TESTIMONIALS, onOpen);
  }, []);

  const closed = useCallback(() => {
    setOpen(false);
    returnTo.current?.focus({ preventScroll: true });
    returnTo.current = null;
  }, []);

  return open ? createPortal(<Panel onClosed={closed} />, document.body) : null;
}

function Panel({ onClosed }: { onClosed: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState<Testimonial | null>(null);
  const [paused, setPaused] = useState(false);
  const [still] = useState(reduced);
  const motion = useRef({ x: 0, speed: 0, target: 0, started: false, hover: false, focus: false, drag: false, closing: false });
  const closingRef = useRef(false);
  const readerTrigger = useRef<HTMLElement | null>(null);
  // O carrossel lê o estado da pausa a cada quadro, sem renderizar de novo
  const pausedRef = useRef(paused);
  const readingRef = useRef<Testimonial | null>(reading);
  useEffect(() => {
    pausedRef.current = paused;
    readingRef.current = reading;
  }, [paused, reading]);

  /* ---------- Abertura: Cinematic Split Reveal ---------- */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    window.dispatchEvent(new CustomEvent("clinic-toggle", { detail: true })); // pausa o fundo da abertura
    el.focus({ preventScroll: true });
    if (still) {
      motion.current.started = true;
      return;
    }
    const q = gsap.utils.selector(el);
    const firstCards = q(".tp-card").slice(0, 8);
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "expo.inOut" }, onComplete: () => void (motion.current.started = true) })
        .set(q(".tp-bg"), { clipPath: "inset(50% 0% 50% 0%)" })
        .set(q(".tp-content"), { autoAlpha: 1 })
        .fromTo(q(".tp-line"), { scaleX: 0, opacity: 1 }, { scaleX: 0.16, duration: 0.35, ease: "power2.out" })
        .to(q(".tp-line"), { scaleX: 1, duration: 0.55 })
        .to(q(".tp-bg"), { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85 }, 0.62)
        .to(q(".tp-line"), { opacity: 0, duration: 0.4, ease: "power1.out" }, 1.05)
        .fromTo(q(".tp-sweep"), { xPercent: -120, opacity: 0.9 }, { xPercent: 720, opacity: 0, duration: 1.2, ease: "power2.inOut" }, 0.92)
        .fromTo(q(".tp-ch"), { yPercent: 115 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.016 }, 1.02)
        .fromTo(q(".tp-fade"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.07 }, 1.3)
        .fromTo(firstCards, { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.07 }, 1.3);
    }, el);
    return () => {
      ctx.revert();
      window.dispatchEvent(new CustomEvent("clinic-toggle", { detail: false }));
    };
  }, [still]);

  /* ---------- Carrossel infinito: rAF próprio, sem saltos, com pausa e arraste ---------- */
  useEffect(() => {
    if (still) return;
    const m = motion.current;
    const base = matchMedia("(pointer: coarse)").matches ? SPEED.coarse : SPEED.fine;
    let raf = 0;
    let last = performance.now();
    const half = () => (track.current ? track.current.scrollWidth / 2 : 1);
    const wrap = () => {
      const h = half();
      if (m.x <= -h) m.x += h;
      if (m.x > 0) m.x -= h;
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      m.target = m.started && !m.hover && !m.focus && !m.drag && !m.closing && !pausedRef.current && !readingRef.current ? base : 0;
      m.speed += (m.target - m.speed) * Math.min(1, dt * (m.closing ? 5 : 2.4)); // acelera e desacelera devagar
      if (!m.drag) m.x -= m.speed * dt;
      wrap();
      if (track.current) track.current.style.transform = `translate3d(${m.x}px,0,0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Arraste manual (toque e mouse): o carrossel acompanha o dedo e segue sozinho depois
    const vp = viewport.current;
    let startX = 0, originX = 0, moved = false, pointer = -1;
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("button")) return;
      pointer = e.pointerId;
      startX = e.clientX;
      originX = m.x;
      moved = false;
      m.drag = true;
    };
    const move = (e: PointerEvent) => {
      if (!m.drag || e.pointerId !== pointer) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6 && !moved) {
        moved = true;
        vp?.setPointerCapture(pointer);
      }
      m.x = originX + dx;
      wrap();
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      m.drag = false;
      pointer = -1;
      // O clique que encerra um arraste é ignorado; depois disso, toques voltam a valer
      setTimeout(() => (moved = false), 0);
    };
    const blockClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    vp?.addEventListener("pointerdown", down);
    vp?.addEventListener("pointermove", move);
    vp?.addEventListener("pointerup", up);
    vp?.addEventListener("pointercancel", up);
    vp?.addEventListener("click", blockClick, true);
    return () => {
      cancelAnimationFrame(raf);
      vp?.removeEventListener("pointerdown", down);
      vp?.removeEventListener("pointermove", move);
      vp?.removeEventListener("pointerup", up);
      vp?.removeEventListener("pointercancel", up);
      vp?.removeEventListener("click", blockClick, true);
    };
  }, [still]);

  /* ---------- Fechamento: cortina arquitetônica ---------- */
  const runClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const el = root.current;
    if (!el || still) {
      onClosed();
      return;
    }
    motion.current.closing = true; // 1. o carrossel desacelera
    const q = gsap.utils.selector(el);
    const mid = innerWidth / 2;
    const cards = q(".tp-card").filter((c) => {
      const r = c.getBoundingClientRect();
      return r.right > 0 && r.left < innerWidth;
    });
    gsap
      .timeline({ defaults: { ease: "expo.inOut" }, onComplete: onClosed })
      .to(cards, { x: (_i: number, c: Element) => (c.getBoundingClientRect().left + c.getBoundingClientRect().width / 2 < mid ? -180 : 180), opacity: 0, duration: 0.7, ease: "power3.in", stagger: 0.03 }, 0.25) // 2. cards às laterais
      .to(q(".tp-ch"), { yPercent: -115, duration: 0.5, ease: "power3.in", stagger: { each: 0.01, from: "end" } }, 0.35) // 3. o título se recolhe
      .to(q(".tp-fade"), { opacity: 0, duration: 0.35 }, 0.35)
      .fromTo(q(".tp-line"), { scaleX: 0, opacity: 1, transformOrigin: "left center" }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 0.75) // 4. a linha dourada percorre
      .to(q(".tp-bg"), { clipPath: "inset(0% 50% 0% 50%)", duration: 0.75 }, 1.15) // 5. a cortina fecha para o centro
      .to(q(".tp-line"), { scaleX: 0, transformOrigin: "center center", duration: 0.55 }, 1.25);
  }, [onClosed, still]);

  /* Botão voltar do navegador fecha o painel sem recarregar nada */
  useEffect(() => {
    // Estado próprio do painel: o Next.js completa com o dele, e o voltar não recarrega a página
    history.pushState({ depoimentos: true }, "");
    const onPop = () => runClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [runClose]);

  const requestClose = useCallback(() => {
    if (history.state?.depoimentos) history.back(); // o popstate chama a animação
    else runClose();
  }, [runClose]);

  const openReader = (t: Testimonial, from: HTMLElement) => {
    readerTrigger.current = from;
    setReading(t);
  };
  const closeReader = () => {
    setReading(null);
    requestAnimationFrame(() => readerTrigger.current?.focus({ preventScroll: true }));
  };

  /* Teclado: Esc fecha o depoimento aberto ou o painel; o foco fica preso aqui */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (readingRef.current) closeReader();
        else requestClose();
        return;
      }
      if (e.key !== "Tab" || !root.current) return;
      const scope = root.current.querySelector<HTMLElement>(".tp-reader") ?? root.current;
      const items = [...scope.querySelectorAll<HTMLElement>("button, a[href]")].filter((x) => x.offsetParent !== null && !x.closest("[inert]"));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !scope.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  /* A página por trás não rola: só as áreas que precisam (lista, depoimento aberto) */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const scrollable = (t: EventTarget | null) => {
      const box = (t as Element | null)?.closest?.<HTMLElement>("[data-scroll]");
      return box && box.scrollHeight > box.clientHeight + 1 ? box : null;
    };
    const wheel = (e: WheelEvent) => {
      const box = scrollable(e.target);
      if (!box) return e.preventDefault();
      const atTop = box.scrollTop <= 0 && e.deltaY < 0;
      const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atEnd) e.preventDefault();
    };
    const touch = (e: TouchEvent) => {
      if (!scrollable(e.target)) e.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchmove", touch, { passive: false });
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchmove", touch);
    };
  }, []);

  const items = VISIBLE_TESTIMONIALS;
  const review = TESTIMONIALS_MODE === "revisao";

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tp-title"
      tabIndex={-1}
      data-lenis-prevent
      className="fixed inset-0 z-[85] overflow-hidden text-bone outline-none"
    >
      {/* Fundo que se abre do centro */}
      <div className="tp-bg absolute inset-0 bg-ink [clip-path:inset(0%)]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_70%_at_80%_0%,rgb(16_41_67/.55),transparent_60%),radial-gradient(90%_60%_at_0%_100%,rgb(16_41_67/.35),transparent_65%)]" />
        <div aria-hidden className="grain absolute inset-0" />
        <span aria-hidden className="tp-sweep absolute inset-y-0 left-0 w-[16%] bg-linear-to-r from-transparent via-ice/12 to-transparent opacity-0" />
      </div>
      <span aria-hidden className="tp-line pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-gold to-transparent" />

      <div data-scroll className="tp-content relative z-[1] flex h-full flex-col overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] [visibility:visible]">
        {/* Topo: identificação e saída sempre visíveis */}
        <div className="tp-fade gutter flex items-center justify-between gap-4">
          <p className="eyebrow text-gold">Depoimentos <span className="text-bone/40">· Seleção editorial</span></p>
          <button
            type="button"
            onClick={requestClose}
            className="group flex min-h-11 items-center gap-3 rounded-full border border-gold/45 bg-ink/50 pl-4 pr-1.5 text-[.6875rem] uppercase tracking-[.18em] text-gold-light transition-colors hover:border-gold"
          >
            <span className="hidden sm:inline">Voltar ao site</span>
            <span className="grid size-8 place-items-center rounded-full bg-gold/12 transition-transform duration-500 ease-cine group-hover:rotate-90">
              <X className="size-4" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="sr-only sm:hidden">Voltar ao site</span>
          </button>
        </div>

        {/* Título com letras reveladas */}
        <div className="gutter mt-[clamp(2rem,7svh,5rem)]">
          <h2 id="tp-title" aria-label={TITLE} className="display max-w-[18ch] text-[clamp(2.1rem,5.4vw,5.75rem)] leading-[1.06]">
            {TITLE.split(" ").map((w, wi) => (
              <span key={wi} aria-hidden className="-mt-[.2em] inline-block overflow-hidden pb-[.06em] pt-[.2em] align-bottom">
                {w.split("").map((c, ci) => (
                  <span key={ci} className="tp-ch inline-block">{c}</span>
                ))}
                {" "}
              </span>
            ))}
          </h2>
          <p className="tp-fade mt-5 max-w-[46ch] text-[clamp(1rem,1.25vw,1.125rem)] leading-[1.6] text-bone/72">{SUBTITLE}</p>
        </div>

        {/* Carrossel (ou lista, com movimento reduzido) */}
        {still ? (
          <ul className="gutter mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <li key={t.n}><Card t={t} review={review} onRead={openReader} /></li>
            ))}
          </ul>
        ) : (
          <div className="mt-[clamp(2rem,6svh,4rem)]">
            <div
              ref={viewport}
              className="relative cursor-grab touch-pan-y select-none overflow-hidden py-3 active:cursor-grabbing [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
              onPointerEnter={(e) => e.pointerType === "mouse" && (motion.current.hover = true)}
              onPointerLeave={() => (motion.current.hover = false)}
              onFocus={() => (motion.current.focus = true)}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && (motion.current.focus = false)}
              role="region"
              aria-roledescription="carrossel"
              aria-label="Depoimentos em movimento lento. Passe o mouse, toque ou use o botão para pausar."
            >
              <div ref={track} className="flex w-max will-change-transform">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 || undefined} inert={copy === 1 || undefined} className="flex gap-4 pr-4 md:gap-6 md:pr-6">
                    {items.map((t) => (
                      <li key={t.n} className="w-[min(80vw,22rem)] shrink-0 md:w-[24rem]">
                        <Card t={t} review={review} onRead={openReader} />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
            <div className="tp-fade gutter mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-pressed={paused}
                className="flex min-h-11 items-center gap-2.5 text-[.6875rem] uppercase tracking-[.18em] text-gold-light/90 hover:text-gold-light"
              >
                <span className="grid size-8 place-items-center rounded-full border border-gold/40">
                  {paused ? <Play className="size-3.5" strokeWidth={1.5} aria-hidden /> : <Pause className="size-3.5" strokeWidth={1.5} aria-hidden />}
                </span>
                {paused ? "Retomar movimento" : "Pausar movimento"}
              </button>
              <p className="text-xs text-bone/45 [@media(pointer:fine)]:hidden">Deslize para os lados para ver mais.</p>
            </div>
          </div>
        )}

        {/* Rodapé: identificação e transparência da seleção */}
        <div className="tp-fade gutter mt-auto grid gap-2 pt-10 text-xs leading-relaxed text-bone/50 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <p className="max-w-[60ch]">Seleção editorial de relatos de pacientes, publicados com autorização. Não representa todas as avaliações recebidas.</p>
          <p className="shrink-0 uppercase tracking-[.16em] text-ash">
            <span className="brand text-[1.15em] tracking-normal text-bone/80">{SITE.name}</span> — {SITE.role}, {SITE.crm}
          </p>
        </div>
      </div>

      {/* Depoimento completo */}
      {reading ? (
        <div className="tp-reader absolute inset-0 z-20 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && closeReader()}>
          <div role="dialog" aria-modal="true" aria-labelledby="tp-reader-name" data-scroll className="relative max-h-[85svh] w-full max-w-[40rem] overflow-y-auto overscroll-contain rounded-[3px] border border-gold/35 bg-[linear-gradient(160deg,#111_0%,#0b1622_100%)] p-7 shadow-[0_30px_80px_-30px_rgb(0_0_0/.9)] md:p-10">
            <button type="button" onClick={closeReader} autoFocus className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-gold-light hover:bg-gold/10" aria-label="Fechar depoimento">
              <X className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <QuoteMark className="h-8 text-gold/50" />
            <p className="mt-5 font-display text-[clamp(1.15rem,2vw,1.4rem)] leading-[1.6] text-bone">{reading.text}</p>
            <div className="mt-7 flex items-baseline justify-between gap-4 border-t border-gold/20 pt-4">
              <p id="tp-reader-name" className="text-xs uppercase tracking-[.2em] text-gold-light">{reading.name}</p>
              <p className="text-xs tabular-nums text-ash">{reading.date}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuoteMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 36" aria-hidden className={className} fill="currentColor">
      <path d="M0 36V22.5C0 9.9 6.6 2.4 19.8 0l2.1 4.2C14.4 6.3 10.8 10.5 10.5 17.1H20.4V36H0Zm27.6 0V22.5C27.6 9.9 34.2 2.4 47.4 0l.6 4.2c-7.5 2.1-11.1 6.3-11.4 12.9H48V36H27.6Z" />
    </svg>
  );
}

function Card({ t, review, onRead }: { t: Testimonial; review: boolean; onRead: (t: Testimonial, from: HTMLElement) => void }) {
  const long = t.text.length > LONG;
  const [glow, setGlow] = useState<CSSProperties>({});
  return (
    <article
      className="tp-card group relative flex h-full min-h-[17.5rem] flex-col overflow-hidden rounded-[3px] border border-gold/15 bg-[linear-gradient(165deg,rgb(17_17_17/.92),rgb(11_22_34/.88))] p-6 transition-[transform,border-color] duration-700 ease-cine hover:-translate-y-1 hover:border-gold/55 focus-within:border-gold/55 md:p-7"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setGlow({ ["--mx" as string]: `${e.clientX - r.left}px`, ["--my" as string]: `${e.clientY - r.top}px` });
      }}
      style={glow}
    >
      {/* Luz azul discreta que acompanha o cursor */}
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(220px_circle_at_var(--mx,50%)_var(--my,30%),rgb(52_124_181/.16),transparent_70%)]" />
      <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-gold/60 via-gold/20 to-transparent md:inset-x-7" />
      <div className="relative flex items-start justify-between gap-3">
        <QuoteMark className="h-6 text-gold/45 transition-colors duration-500 group-hover:text-gold/80" />
        {review && !t.authorized ? (
          <span className="rounded-full border border-ice/35 px-2 py-0.5 text-[.625rem] uppercase tracking-[.14em] text-ice/90">
            {t.review === "adjetivo" ? "Revisar adjetivo" : "Aguarda aprovação"}
          </span>
        ) : null}
      </div>
      <blockquote className="relative mt-4 flex-1">
        <p className={`font-display text-[1.0625rem] leading-[1.6] text-bone/80 transition-colors duration-500 group-hover:text-bone md:text-[1.125rem] ${long ? "line-clamp-6" : ""}`}>{t.text}</p>
      </blockquote>
      {long ? (
        <button
          type="button"
          onClick={(e) => onRead(t, e.currentTarget)}
          className="relative mt-4 self-start text-[.6875rem] uppercase tracking-[.18em] text-gold-light underline-offset-4 hover:underline"
        >
          Ler depoimento completo
        </button>
      ) : null}
      <footer className="relative mt-5 flex items-baseline justify-between gap-4 border-t border-gold/15 pt-4">
        <cite className="not-italic text-xs uppercase tracking-[.2em] text-gold-light">{t.name}</cite>
        <time className="text-xs tabular-nums text-ash">{t.date}</time>
      </footer>
    </article>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, X } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { TESTIMONIALS_MODE, VISIBLE_TESTIMONIALS, type Testimonial } from "@/lib/testimonials";
import { Marquee } from "../ui/3d-testimonials";

const TITLE = ["A experiência de", "quem foi atendido."];
const SUBTITLE = "Relatos sobre a experiência de atendimento, a escuta e o acompanhamento.";
const LONG = 140; // acima disso o card mostra uma prévia e "Ler completo"
const subscribe = () => () => {};

/** Distribui os relatos em colunas, na ordem, sem repetir nenhum na fonte de dados. */
function columns(items: Testimonial[], n: number) {
  const cols: Testimonial[][] = Array.from({ length: n }, () => []);
  items.forEach((t, i) => cols[i % n].push(t));
  return cols;
}

/** Ciclo lento, proporcional ao tamanho real da coluna: entre 55 e 75 segundos. */
function duration(col: Testimonial[]) {
  const chars = col.reduce((s, t) => s + t.text.length + 90, 0); // 90 ≈ nome, data e respiro do card
  return `${Math.round(Math.min(75, Math.max(55, 40 + chars / 40)))}s`;
}

export function Testimonials() {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const scope = useRef<HTMLElement>(null);
  const [reading, setReading] = useState<Testimonial | null>(null);
  const [paused, setPaused] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const items = VISIBLE_TESTIMONIALS;
  const review = TESTIMONIALS_MODE === "revisao";

  /* Entrada (Gold Cinematic Reveal) e saída (Editorial Curtain Exit) */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = scope.current!;
        const cols = gsap.utils.toArray<HTMLElement>(".t3d-col", el);
        el.dataset.live = "false"; // as colunas esperam a entrada para começar a subir e descer
        gsap.set(".t3d-mask", { clipPath: "inset(50% 0% 50% 0%)" });
        gsap.set(".t3d-ln", { yPercent: 110 });
        gsap.set(".t3d-sub", { opacity: 0, y: 14 });
        gsap.set(cols, { opacity: 0, y: (i: number) => (i % 2 ? -70 : 70), z: (i: number) => [-110, 50, -50, 110][i % 4] });

        gsap
          .timeline({
            defaults: { ease: "expo.out" },
            scrollTrigger: { trigger: el, start: "top 72%", once: true },
            onComplete: () => void (el.dataset.live = "true"),
          })
          .fromTo(".t3d-in", { scaleX: 0, opacity: 1 }, { scaleX: 0.18, duration: 0.22, ease: "power2.out" }) // 2. o fio nasce no centro
          .to(".t3d-in", { scaleX: 1, duration: 0.42, ease: "power3.inOut" }) // 3. e se expande
          .to(".t3d-mask", { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.inOut" }, 0.38) // 4. a máscara revela o fundo
          .to(".t3d-in", { opacity: 0, duration: 0.35 }, 0.78)
          .to(".t3d-ln", { yPercent: 0, duration: 0.7, stagger: 0.09 }, 0.5) // 5-6. título por linhas
          .to(".t3d-sub", { opacity: 1, y: 0, duration: 0.6 }, 0.72)
          .fromTo(".t3d-sheen", { xPercent: -120, opacity: 1 }, { xPercent: 720, opacity: 1, duration: 0.95, ease: "power2.inOut" }, 0.6) // 7. reflexo dourado
          .to(cols, { opacity: 1, y: 0, z: 0, duration: 0.85, stagger: 0.06, clearProps: "transform" }, 0.7); // 8. colunas de várias profundidades

        // Saída: termina quando o fim da página chega ao pé da tela, onde o Curtain Reveal do rodapé começa
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: el, start: "bottom 135%", end: "bottom bottom", scrub: 0.3 } })
          .to(".t3d-plane", { rotationX: 0, rotationY: 0, rotationZ: 0, z: 0, xPercent: 0, duration: 1 }, 0)
          .fromTo(".t3d-fade", { opacity: 1 }, { opacity: 0.45, duration: 1, immediateRender: false }, 0)
          .fromTo(".t3d-edges", { "--edge-x": matchMedia("(max-width: 767px)").matches ? "3%" : "9%", "--edge-top": "20%", "--edge-bot": "76%" }, { "--edge-x": "24%", "--edge-top": "36%", "--edge-bot": "58%", duration: 1 }, 0) // o escuro fecha as extremidades
          .fromTo(".t3d-out", { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.55, ease: "power2.inOut" }, 0.2)
          .to(".t3d-out", { opacity: 0, duration: 0.25 }, 0.75);

        return () => {
          delete el.dataset.live;
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  const openReader = useCallback((t: Testimonial, from: HTMLElement) => {
    trigger.current = from;
    setReading(t);
  }, []);
  const closeReader = useCallback(() => {
    setReading(null);
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  }, []);

  if (!items.length) return null;
  const desktop = columns(items, 4);
  const mobile = columns(items, 2);
  const card = (t: Testimonial) => <Card key={t.n} t={t} review={review} onRead={openReader} />;

  return (
    <section
      ref={scope}
      id="depoimentos"
      aria-labelledby="t3d-title"
      data-paused={paused || reading ? "true" : undefined}
      className="t3d relative isolate -mt-[clamp(3rem,7vw,7rem)] overflow-clip bg-ink pb-[clamp(4rem,8vw,7rem)]"
    >
      {/* Fundo azul-marinho e preto revelado pela máscara */}
      <div aria-hidden className="t3d-mask absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(110%_60%_at_78%_8%,rgb(16_41_67/.75),transparent_62%),radial-gradient(80%_55%_at_8%_92%,rgb(16_41_67/.5),transparent_66%)]" />
        <div className="grain absolute inset-0" />
      </div>
      <span aria-hidden className="t3d-in hero-hidden-rm pointer-events-none absolute inset-x-0 top-[clamp(1.5rem,4vw,3rem)] z-10 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-gold to-transparent opacity-0" />

      <div className="gutter relative grid gap-6 pt-[clamp(4.5rem,9vw,8rem)] lg:grid-cols-12 lg:items-end">
        <div className="relative overflow-hidden lg:col-span-8">
          <p className="eyebrow text-gold">06 / Depoimentos</p>
          <h2 id="t3d-title" className="display mt-7 text-[clamp(2.1rem,4.8vw,5rem)] leading-[1.08] text-bone">
            {TITLE.map((l, i) => (
              <span key={l} className="-mt-[.2em] block overflow-hidden pb-[.04em] pt-[.2em]">
                <span className={`t3d-ln block ${i ? "italic text-gold-light" : ""}`}>{l}</span>
              </span>
            ))}
          </h2>
          <span aria-hidden className="t3d-sheen hero-hidden-rm pointer-events-none absolute inset-y-0 left-0 w-[18%] -skew-x-12 bg-linear-to-r from-transparent via-gold-light/25 to-transparent opacity-0" />
        </div>
        <div className="t3d-sub lg:col-span-4">
          <p className="max-w-[40ch] leading-[1.7] text-bone/70 lg:ml-auto">{SUBTITLE}</p>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="t3d-motion mt-4 flex min-h-11 items-center gap-2.5 text-[.6875rem] uppercase tracking-[.18em] text-gold-light/90 hover:text-gold-light lg:ml-auto"
          >
            <span className="grid size-8 place-items-center rounded-full border border-gold/40">
              {paused ? <Play className="size-3.5" strokeWidth={1.5} aria-hidden /> : <Pause className="size-3.5" strokeWidth={1.5} aria-hidden />}
            </span>
            {paused ? "Retomar movimento" : "Pausar movimento"}
          </button>
        </div>
      </div>

      {review ? (
        <p className="gutter mt-6 text-xs uppercase tracking-[.16em] text-ice/90">Pré-visualização administrativa · relatos aguardando revisão ética e autorização · não publicados</p>
      ) : null}

      {/* Painel 3D: quatro colunas no computador, duas no celular */}
      <div className="t3d-motion t3d-stage relative mt-[clamp(2rem,5vw,3.5rem)] h-[clamp(32rem,78svh,50rem)] overflow-hidden">
        <div className="t3d-fade t3d-edges t3d-persp absolute inset-0">
          <div className="t3d-plane absolute inset-x-[-1%] inset-y-[-14%] md:inset-x-[-2%]">
            <div className="hidden h-full grid-cols-4 gap-5 px-6 [transform-style:preserve-3d] md:grid">
              {desktop.map((col, i) => (
                <Marquee key={i} vertical pauseOnHover reverse={i % 2 === 1} className="t3d-col h-full" style={{ ["--duration" as string]: duration(col) }}>
                  {col.map(card)}
                </Marquee>
              ))}
            </div>
            <div className="grid h-full grid-cols-2 gap-3 px-3 [transform-style:preserve-3d] md:hidden">
              {mobile.map((col, i) => (
                <Marquee key={i} vertical pauseOnHover reverse={i % 2 === 1} className="t3d-col h-full" style={{ ["--duration" as string]: duration(col) }}>
                  {col.map(card)}
                </Marquee>
              ))}
            </div>
          </div>
        </div>
        <span aria-hidden className="t3d-out hero-hidden-rm pointer-events-none absolute inset-x-[8%] bottom-[12%] h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-gold to-transparent" />
      </div>

      {/* Movimento reduzido: leitura estática, cada relato uma vez */}
      <ul className="t3d-static gutter mt-10 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <li key={t.n}>
            <Card t={t} review={review} onRead={openReader} />
          </li>
        ))}
      </ul>

      <p className="gutter mt-8 max-w-[70ch] text-xs leading-relaxed text-bone/45">
        Seleção de relatos de pacientes, reproduzidos sem edição, com nome e data. Não representa todas as avaliações recebidas.
      </p>

      {isClient && reading ? createPortal(<Reader t={reading} onClose={closeReader} />, document.body) : null}
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
  return (
    <article className="group relative overflow-hidden rounded-[5px] border border-gold/22 bg-[linear-gradient(162deg,#10253a_0%,#0b1828_52%,#080f18_100%)] p-4 shadow-[0_18px_40px_-26px_rgb(0_0_0/.95),inset_0_1px_0_rgb(228_209_165/.08)] transition-colors duration-500 hover:border-gold/55 focus-within:border-gold/55 md:p-6">
      {/* Detalhes metálicos: fio no topo e canto */}
      <span aria-hidden className="absolute inset-x-4 top-0 h-px bg-linear-to-r from-gold/70 via-gold-light/30 to-transparent md:inset-x-6" />
      <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 border-r border-t border-gold/45" />
      <div className="flex items-start justify-between gap-2">
        <QuoteMark className="h-4 text-gold/70 md:h-5" />
        {review && !t.authorized ? (
          <span className="rounded-full border border-ice/35 px-2 py-0.5 text-[.5625rem] uppercase tracking-[.12em] text-ice/90">{t.review === "adjetivo" ? "Revisar adjetivo" : "Aguarda aprovação"}</span>
        ) : null}
      </div>
      <blockquote className="mt-3">
        <p className={`font-display text-[.9375rem] leading-[1.55] text-bone/88 md:text-[1.0625rem] ${long ? "line-clamp-5" : ""}`}>{t.text}</p>
      </blockquote>
      {long ? (
        <button
          type="button"
          onClick={(e) => onRead(t, e.currentTarget)}
          aria-label={`Ler completo o relato de ${t.name}, ${t.date}`}
          className="mt-3 min-h-8 text-[.625rem] uppercase tracking-[.18em] text-gold-light underline-offset-4 hover:underline md:text-[.6875rem]"
        >
          Ler completo
        </button>
      ) : null}
      <footer className="mt-4 flex items-center gap-3 border-t border-gold/15 pt-3.5">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-gold/45 bg-[radial-gradient(circle_at_30%_25%,rgb(228_209_165/.22),transparent_70%)] text-[.625rem] tracking-[.08em] text-gold-light md:size-9">
          {initials(t.name)}
        </span>
        <div className="min-w-0">
          <cite className="block truncate text-[.6875rem] not-italic uppercase tracking-[.2em] text-gold-light">{t.name}</cite>
          <time className="block text-[.6875rem] tabular-nums text-ash">{t.date}</time>
        </div>
      </footer>
    </article>
  );
}

/** Relato completo. Fecha pelo botão, pelo fundo ou com Esc; a página não rola por trás. */
function Reader({ t, onClose }: { t: Testimonial; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        e.preventDefault(); // só há um controle: o foco fica nele
        el.querySelector<HTMLElement>("button")?.focus();
      }
    };
    const box = el.querySelector<HTMLElement>("[data-scroll]");
    const block = (e: Event) => {
      if (!box || !box.contains(e.target as Node) || box.scrollHeight <= box.clientHeight + 1) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    el.addEventListener("wheel", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.removeEventListener("keydown", onKey);
      el.removeEventListener("wheel", block);
      el.removeEventListener("touchmove", block);
    };
  }, [onClose]);

  return (
    <div ref={root} data-lenis-prevent className="fixed inset-0 z-[85] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="t3d-reader-name"
        data-scroll
        className="relative max-h-[85svh] w-full max-w-[40rem] overflow-y-auto overscroll-contain rounded-[5px] border border-gold/35 bg-[linear-gradient(160deg,#10253a_0%,#0a1624_60%,#080808_100%)] p-7 shadow-[0_30px_80px_-30px_rgb(0_0_0/.9)] md:p-10"
      >
        <span aria-hidden className="absolute inset-x-7 top-0 h-px bg-linear-to-r from-gold/80 via-gold-light/30 to-transparent md:inset-x-10" />
        <button type="button" onClick={onClose} autoFocus className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-gold-light hover:bg-gold/10" aria-label="Fechar relato">
          <X className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
        <QuoteMark className="h-7 text-gold/60" />
        <p className="mt-5 font-display text-[clamp(1.1rem,2vw,1.35rem)] leading-[1.6] text-bone">{t.text}</p>
        <div className="mt-7 flex items-center gap-3 border-t border-gold/20 pt-4">
          <span aria-hidden className="grid size-9 place-items-center rounded-full border border-gold/45 text-[.6875rem] text-gold-light">{initials(t.name)}</span>
          <div>
            <p id="t3d-reader-name" className="text-xs uppercase tracking-[.2em] text-gold-light">{t.name}</p>
            <p className="text-xs tabular-nums text-ash">{t.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

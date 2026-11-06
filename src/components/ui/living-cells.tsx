"use client";

import { useEffect, useRef, useState } from "react";
import { createCellsFlow } from "@/lib/cells-flow";

const SRC = "/media/celulas-fundo.webp";

/**
 * A imagem de células, viva. A <img> fica sempre por baixo: sem WebGL, ou com movimento
 * reduzido, o fundo continua intacto, apenas parado.
 *
 * `hero` pausa a animação fora da primeira dobra e com a clínica virtual aberta.
 */
export function LivingCells({ hero = false }: { hero?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [alive, setAlive] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let flow: ReturnType<typeof createCellsFlow> = null;
    let clinicOpen = false;
    let cancelled = false;

    const sync = () => {
      if (!flow) return;
      const busy = document.hidden || (hero && (clinicOpen || window.scrollY > window.innerHeight * 1.9));
      if (busy) flow.stop();
      else flow.start();
    };
    const onClinic = (e: Event) => {
      clinicOpen = (e as CustomEvent<boolean>).detail;
      sync();
    };
    const onPointer = (e: PointerEvent) => {
      const r = canvas.current?.getBoundingClientRect();
      if (r?.width) flow?.touch((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const boot = () => {
      if (cancelled || !canvas.current || !image.current) return;
      flow = createCellsFlow(canvas.current, image.current);
      if (!flow) return;
      setAlive(true);
      sync();
    };

    const img = image.current;
    if (img?.complete && img.naturalWidth) boot();
    else img?.addEventListener("load", boot, { once: true });
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("clinic-toggle", onClinic);
    window.addEventListener("pointermove", onPointer, { passive: true });
    if (hero) window.addEventListener("scroll", sync, { passive: true });

    return () => {
      cancelled = true;
      img?.removeEventListener("load", boot);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("clinic-toggle", onClinic);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", sync);
      flow?.dispose();
    };
  }, [hero]);

  return (
    <div className="cells-camera absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem fornecida, preservada sem recompressão */}
      <img ref={image} src={SRC} alt="" width={1672} height={941} decoding="async" className="size-full object-cover object-[72%_50%]" />
      <canvas ref={canvas} className={`absolute inset-0 size-full transition-opacity duration-700 ${alive ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}

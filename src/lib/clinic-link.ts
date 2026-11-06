import type { Clinic } from "@/lib/site";
import { MONOGRAM } from "@/lib/monogram";

export const FAREWELL_MS = 900;
export const MESSAGE = "Será um prazer receber você.";
export const NOTE = "Você está sendo direcionado para o agendamento.";

/** Despedida exibida dentro da própria guia nova enquanto o destino não carrega. */
function farewellPage(clinic: Clinic) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${clinic.name}</title><style>
  html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#080808;color:#f7f5f0;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:0 1.5rem;box-sizing:border-box}
  svg{height:32px;color:#c6a667}small{display:block;margin-top:24px;letter-spacing:.24em;text-transform:uppercase;font-size:12px;color:#e4d1a5}
  h1{font:500 clamp(30px,4.4vw,58px)/1.12 Didot,"Bodoni 72",Georgia,serif;text-transform:uppercase;margin:20px 0 14px}p{margin:0;color:#f7f5f0bf}
  </style><body><main><svg viewBox="0 0 ${MONOGRAM.width} ${MONOGRAM.height}"><path fill="currentColor" fill-rule="evenodd" d="${MONOGRAM.d}"/></svg><small>${clinic.name} — ${clinic.city}</small><h1>${MESSAGE}</h1><p>${NOTE}</p></main></body></html>`;
}

/**
 * A nova guia nasce dentro do próprio clique, então nenhum bloqueador interfere.
 * - Celular: abre o destino direto, o único jeito confiável de saltar para o app.
 * - Computador: abre com a despedida e troca para o destino ao fim da transição.
 * Sem guia (navegador interno do Instagram), segue na mesma aba.
 */
export function openDestination(clinic: Clinic) {
  const direct = matchMedia("(pointer: coarse)").matches;
  const tab = window.open(direct ? clinic.href : "", "_blank");
  if (!tab) {
    window.location.assign(clinic.href);
    return null;
  }
  tab.opener = null;
  if (direct) return null;
  tab.document.write(farewellPage(clinic));
  tab.document.close();
  return () => tab.location.replace(clinic.href);
}

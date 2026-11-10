/**
 * Base editável de depoimentos. Texto, nome e data exatamente como fornecidos: não corrigir,
 * não resumir, não misturar falas. O comentário de Elaine (14/05/2026) fica fora por escolha
 * editorial e continua intacto na plataforma original.
 *
 * Publicação (Resolução CFM 2.336/2023): depoimentos são permitidos de forma sóbria, sem
 * adjetivos que denotem superioridade, sem promessa de resultado e sem repetição insistente.
 * Por isso nada vai ao ar sozinho:
 * - `authorized`: só vira true depois da revisão ética e da autorização do paciente.
 * - `review`: "sobrio" = texto descritivo; "adjetivo" = traz elogio forte ("excelente",
 *   "ótimo", "competente"...) e precisa de análise antes de publicar.
 * - Visibilidade geral: NEXT_PUBLIC_DEPOIMENTOS (ausente = só os autorizados;
 *   "revisao" mostra todos, marcados, para análise; "off" = seção desligada).
 */
export type Testimonial = {
  n: string;
  name: string;
  date: string;
  text: string;
  review: "sobrio" | "adjetivo";
  authorized: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  { n: "01", name: "Amanda", date: "17/08/2026", review: "sobrio", authorized: true, text: "Gostaria de registrar meu elogio ao Dr. Diogo pelo atendimento. Foi muito atencioso, cuidadoso e demonstrou bastante profissionalismo durante a consulta. Ouviu minhas dúvidas com atenção, explicou tudo de forma clara e me passou segurança em relação ao acompanhamento e aos exames solicitados.É muito bom encontrar um profissional que conduz a consulta com respeito, acolhimento e atenção às necessidades do paciente. Saí muito satisfeita com o atendimento e com a forma como fui recebida. Recomendo!" },
  { n: "02", name: "Marisa", date: "15/04/2026", review: "adjetivo", authorized: true, text: "Um excelente profissional, atencioso, tem uma abordagem focada na empatia, escuta ativa e personalizada, trata o paciente como um indivíduo único, e não apenas um numero." },
  { n: "03", name: "Amaury", date: "21/06/2026", review: "adjetivo", authorized: true, text: "Tive uma consulta excelente com o Dr Diogo, que pode me auxiliar a entender meu estado atual, encontrando a melhor forma de tratar minha situação. Tirou todas as minhas dúvidas e foi muito atencioso." },
  { n: "04", name: "Hévila", date: "14/09/2026", review: "sobrio", authorized: true, text: "Dr. me atendeu de forma a compreender meu caso e procurar a melhor solução a curto, médio e longo prazo. De forma a fazermos um tratamento e acompanhamento." },
  { n: "05", name: "Carine", date: "27/08/2026", review: "sobrio", authorized: true, text: "Atencioso e tira todas as dúvidas. Saí super tranquila da consulta." },
  { n: "06", name: "Jakeline", date: "22/06/2026", review: "sobrio", authorized: true, text: "Dr. Diogo é atencioso, profissional empatico, comunicação de fácil compreensão e objetivo." },
  { n: "07", name: "Viviane", date: "09/09/2026", review: "sobrio", authorized: true, text: "Gostei do Dr., fui bem atendida, entendeu o que eu preciso" },
  { n: "08", name: "Raquel", date: "18/08/2026", review: "adjetivo", authorized: true, text: "Médico excelente! Muito atencioso e competente!Recomendo!" },
  { n: "09", name: "Priscila", date: "25/06/2026", review: "adjetivo", authorized: true, text: "Excelente profissional, muito educado e atencioso! Recomendo!" },
  { n: "10", name: "Michelle", date: "12/05/2026", review: "sobrio", authorized: true, text: "Muito atencioso e explicou tudo direitinho." },
  { n: "11", name: "Mariana", date: "01/06/2026", review: "adjetivo", authorized: true, text: "Simpático, Educado e um ótimo profissional." },
  { n: "12", name: "Victor", date: "06/07/2026", review: "sobrio", authorized: true, text: "Médico super educado e empático." },
  { n: "13", name: "Thaina", date: "20/04/2026", review: "sobrio", authorized: true, text: "Eu adorei o atendimento, o doutor com uma força de vontade de realmente ajudar seus pacientes" },
  { n: "14", name: "Rhoselly", date: "18/07/2026", review: "adjetivo", authorized: true, text: "Dr. Diogo é bastante atencioso e objetivo Excelente profissional!" },
  { n: "15", name: "Milaine", date: "13/04/2026", review: "adjetivo", authorized: true, text: "Solícito, educado, ótimo profissional!" },
  { n: "16", name: "Karen", date: "24/08/2026", review: "adjetivo", authorized: true, text: "Gostei muito do atendimento, medico excelente!" },
  { n: "17", name: "Maria", date: "07/09/2026", review: "adjetivo", authorized: true, text: "Ótimo profissional muito atencioso" },
  { n: "18", name: "Gladson", date: "01/06/2026", review: "sobrio", authorized: true, text: "Profissional atencioso, direto e objetivo." },
  { n: "19", name: "Priscila", date: "04/06/2026", review: "adjetivo", authorized: true, text: "Ótimo atendimento, atencioso e educado!" },
  { n: "20", name: "Joelma", date: "10/08/2026", review: "adjetivo", authorized: true, text: "Ótimo atendimento" },
  { n: "21", name: "Joyce", date: "02/11/2026", review: "adjetivo", authorized: true, text: "Excelente profissional" },
  { n: "22", name: "Nilda", date: "08/08/2026", review: "sobrio", authorized: true, text: "Doutor bem atencioso" },
  { n: "23", name: "Cristiane", date: "22/06/2026", review: "sobrio", authorized: true, text: "Pontual e objetivo" },
  { n: "24", name: "Andreia", date: "18/05/2026", review: "sobrio", authorized: true, text: "Atencioso e objetivo" },
  { n: "25", name: "Kathleen", date: "21/04/2026", review: "sobrio", authorized: true, text: "Objetivo e eficiente." },
  { n: "26", name: "Rodrigo", date: "23/06/2026", review: "adjetivo", authorized: true, text: "Excelente trabalho" },
  { n: "27", name: "Alessio", date: "12/05/2026", review: "sobrio", authorized: true, text: "Pratico e objetivo" },
  { n: "28", name: "Erika", date: "05/10/2026", review: "adjetivo", authorized: true, text: "Dr extremamente atencioso!" },
  { n: "29", name: "Margarete", date: "01/07/2026", review: "sobrio", authorized: true, text: "Muito atencioso" },
  { n: "30", name: "Julio", date: "18/08/2026", review: "sobrio", authorized: true, text: "Médico prático para resolver as questões." },
];

/* Em 10/11/2026 a responsável pelo site confirmou a autorização dos 30 relatos e escolheu publicá-los.
   Padrão "publico"; NEXT_PUBLIC_DEPOIMENTOS=revisao volta à pré-visualização marcada, =off esconde a seção. */
export const TESTIMONIALS_MODE = process.env.NEXT_PUBLIC_DEPOIMENTOS === "revisao" ? "revisao" : process.env.NEXT_PUBLIC_DEPOIMENTOS === "off" ? "off" : "publico";

/** O que aparece no carrossel: em revisão, todos; em público, só os autorizados. */
export const VISIBLE_TESTIMONIALS = TESTIMONIALS_MODE === "revisao" ? TESTIMONIALS : TESTIMONIALS.filter((t) => t.authorized);

/** A experiência só existe no menu quando há o que mostrar. */
export const TESTIMONIALS_ON = TESTIMONIALS_MODE !== "off" && VISIBLE_TESTIMONIALS.length > 0;

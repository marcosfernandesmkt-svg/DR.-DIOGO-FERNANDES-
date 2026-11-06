/** Fonte única de conteúdo. Destinos dos links: não alterar sem revisão. */
export const SITE = {
  name: "Dr. Diogo Fernandes",
  fullName: "Dr. Diogo Fernandes Ignácio",
  crm: "CRM-ES 23.787",
  role: "Médico",
  tagline: "Medicina com ciência, atenção e individualidade.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3140",
  instagram: { handle: "@drdiogofernandes", href: "https://www.instagram.com/drdiogofernandes/" },
};

/**
 * Fotografias. Para trocar pela versão profissional, gere o arquivo com
 * `npm run media` e mantenha estes caminhos, ou aponte para os novos aqui.
 */
export const PHOTOS = {
  hero: { src: "/media/hero-figure.webp", width: 1024, height: 1536, alt: "Dr. Diogo Fernandes de terno azul-marinho, sorrindo, com as mãos entrelaçadas" },
  portrait: { src: "/media/portrait.webp", width: 1174, height: 1468, alt: "Retrato do Dr. Diogo Fernandes de terno azul-marinho, com luz lateral" },
} as const;

export const AREAS = [
  { n: "01", title: "Controle de peso e obesidade", text: "Avaliação dos fatores relacionados ao peso e à saúde metabólica." },
  { n: "02", title: "Resistência à insulina", text: "Investigação e acompanhamento do metabolismo da glicose e da insulina." },
  { n: "03", title: "Diabetes", text: "Acompanhamento médico direcionado à saúde metabólica individual." },
  { n: "04", title: "Tireoide", text: "Avaliação e acompanhamento de alterações do funcionamento da tireoide." },
] as const;

export const STEPS = [
  { n: "01", title: "Consulta", text: "Histórico, sintomas, rotina e necessidades do paciente." },
  { n: "02", title: "Avaliação", text: "Análise clínica e exames quando necessários." },
  { n: "03", title: "Planejamento", text: "Definição da estratégia médica individual." },
  { n: "04", title: "Acompanhamento", text: "Reavaliações e ajustes conforme a necessidade." },
] as const;

export const CLINICS = [
  { name: "Clínica Amanda Fernandes", city: "Marataízes", href: "https://wa.me/5528999013592?text=Quero+agendar+minha+consulta+com+Dr.+Diogo+Fernandes" },
  { name: "Clínica MedMais", city: "Bom Jesus do Norte", href: "https://api.whatsapp.com/send/?phone=5522998485333&text=" },
  { name: "Clínica iMeds", city: "Marataízes", href: "https://wa.me/5528999321307?text=Quero+agendar+minha+consulta+com+Dr.+Diogo+Fernandes" },
  { name: "Clínica Unifisio", city: "Piúma", href: "https://wa.me/5528999183137?text=Ol%C3%A1%21+Gostaria+de+agendar+uma+consulta+na+Endocrinologia+com+Dr+Diogo+Fernandes." },
  { name: "Clínica Ultra Imagem", city: "Marataízes", href: "https://wa.link/vus96f" },
  { name: "Consulta on-line", city: "De onde você estiver", href: "https://wa.me/5528999013592?text=Quero+agendar+minha+consulta+on-line+com+Dr.+Diogo+Fernandes" },
] as const;

export type Clinic = (typeof CLINICS)[number];

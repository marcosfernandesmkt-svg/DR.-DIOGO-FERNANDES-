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
  hero: { src: "/media/hero-figure-4.webp", width: 1024, height: 1536, alt: "Dr. Diogo Fernandes de terno azul-marinho, sorrindo, com as mãos entrelaçadas" },
  portrait: { src: "/media/portrait-4.webp", width: 1174, height: 1468, alt: "Retrato do Dr. Diogo Fernandes de terno azul-marinho" },
} as const;

export const AREAS = [
  { n: "01", title: "Saúde hormonal e metabólica", text: "Avaliação individualizada das alterações hormonais e de seus impactos na saúde e no bem-estar." },
  { n: "02", title: "Emagrecimento e tratamento da obesidade", text: "Acompanhamento médico para perda de peso sustentável, preservação muscular e manutenção dos resultados." },
  { n: "03", title: "Diabetes e resistência à insulina", text: "Prevenção, diagnóstico e tratamento das alterações da glicose, com foco na saúde a longo prazo." },
  { n: "04", title: "Tireoide: funcionamento e nódulos", text: "Investigação e acompanhamento de hipotireoidismo, hipertireoidismo, tireoidites e nódulos." },
  { n: "05", title: "Menopausa e saúde da mulher", text: "Cuidado com os sintomas da menopausa, alterações menstruais e síndrome dos ovários policísticos." },
  { n: "06", title: "Saúde hormonal masculina e libido", text: "Investigação de baixa testosterona, alterações da libido e sintomas relacionados à deficiência hormonal." },
  { n: "07", title: "Nutrição, vitaminas e disposição", text: "Avaliação de deficiências nutricionais e de fatores associados ao cansaço, com suplementação quando indicada." },
  { n: "08", title: "Composição corporal e saúde muscular", text: "Avaliação de gordura corporal e massa muscular, com foco em força, funcionalidade e envelhecimento saudável." },
  { n: "09", title: "Colesterol, triglicerídeos e gordura no fígado", text: "Cuidado das alterações metabólicas que afetam a saúde cardiovascular e hepática." },
  { n: "10", title: "Osteoporose e saúde óssea", text: "Prevenção e acompanhamento da perda óssea, com avaliação do metabolismo do cálcio e da vitamina D." },
] as const;

/**
 * Formação informada pela cliente. Pós-graduação não confere título de especialista:
 * sem RQE, cada pós-graduação vem com "NÃO ESPECIALISTA" (Resolução CFM 2.336/2023, art. 13).
 */
export const FORMATION = [
  { label: "Graduação", title: "Medicina", place: "Universidade São Carlos / Famesc", status: "done" },
  { label: "Pós-graduação", title: "Endocrinologia", place: "Academia Brasileira de Medicina Funcional Integrativa (ABMFI)", status: "done", notSpecialist: true },
  { label: "Formação em andamento", title: "Pós-graduando em Nutrologia", place: "Afya Educação Médica", status: "ongoing", notSpecialist: true },
  { label: "Membro", title: "Academia Brasileira de Medicina Funcional Integrativa (ABMFI)", status: "member" },
] as const;

export const CARE_TOPICS = [
  "Obesidade e controle de peso",
  "Sarcopenia",
  "Doenças da tireoide",
  "Lipedema",
  "Diabetes",
  "Resistência à insulina",
  "Demais doenças endócrinas e metabólicas",
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

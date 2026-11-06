# Dr. Diogo Fernandes — site pessoal

Next.js 16, Tailwind 4, GSAP + ScrollTrigger, Motion e Lenis.

```bash
npm run dev        # http://localhost:3140
npm run build && npm start
node tools/qa/behavior.mjs   # testes de comportamento (com npm start ativo)
node tools/qa/shots.mjs      # capturas em desktop, tablet e celular
```

## Onde mudar

| O quê | Arquivo |
| --- | --- |
| Textos, áreas, clínicas e links | `src/lib/site.ts` |
| Fotografias usadas | `PHOTOS` em `src/lib/site.ts` |
| Abertura e sequência de rolagem | `src/components/ui/scroll-locked-video-hero.tsx` |
| Tempo da transição de saída | `FAREWELL_MS` em `src/components/sections/booking.tsx` (manter abaixo de 1000 ms) |
| Tratamento das fotos | `tools/media/build.mjs` (`npm run media`) |

## Trocar a foto da abertura

1. Coloque a original em `tools/media/source/terno.png`.
2. Gere a máscara com `tools/media/matte.swift` (saída: `terno-mask.png`, na mesma pasta).
3. Rode `npm run media`.

Vídeo real na abertura: passe `videoSrc` para `ScrollLockedVideoHero` em `src/app/page.tsx`.

## Decisões de direção

- Paleta do briefing. A sugestão automática da UI UX Pro Max (teal e Brutalism) foi descartada.
- Bodoni Moda nos títulos e Geist nos textos. O eixo óptico fica baixo em tamanhos médios.
- Azul (`deep`, `azure`, `ice`) é só cor de apoio: reflexos, fios de luz e hover, nunca superfície.
- Passagens: linha dourada, Portrait Depth Reveal, Editorial Layer, Glyph Portal (efeito principal), Golden Curtain e rodapé com Curtain Reveal. Não repetir efeito nem usar círculos.
- `glyph-portal.tsx` e `motion-footer.tsx` foram escritos do zero: os originais citados no briefing nunca foram recebidos.
- A palavra do portal é um vetor (`tools/media/glyph.mjs`): o furo é um path, sem máscara CSS, para funcionar no Safari.
- Luz: uma só fonte lateral por cena (referência: Terminal Industries), sem glows redondos decorativos.
- Em GSAP com `useGSAP({ scope })`, gatilhos fora do componente precisam ser passados como elemento, nunca como seletor em texto.
- GSAP atua nos invólucros e Motion nos elementos internos; nunca os dois no mesmo elemento.
- A abertura usa `position: sticky`: não existe bloqueio de rolagem.
- Monograma vetorizado do logotipo aprovado.

## Clínica virtual e células

O botão "Marque seu atendimento" abre `src/components/clinic-entry.tsx`. A cena (`src/lib/three/clinic-scene.ts`) é um ambiente ilustrativo em geometria própria, carregado só no clique. Os links são âncoras reais sobre o 3D: sem WebGL ou com movimento reduzido, aparece a lista.

O fundo celular é a imagem fornecida pela cliente, intacta, em `public/media/celulas-fundo.webp`. Só a câmera, a luz e as partículas se movem, por CSS e GSAP.

Cópia de segurança anterior ao refinamento V5: `../dr-diogo-fernandes-backups/antes-v5.tgz`. Comparações em `tools/qa/antes`.

## Letra do nome

O nome usa `.brand`, com a fonte `src/app/fonts/diogo-fernandes-marca.woff2`, vetorizada do logotipo aprovado por `tools/media/brand-font.mjs` (a tipografia do logotipo é desenhada sob medida). Ela só contém as letras do nome. A ligadura ND depende de `letter-spacing: 0`.

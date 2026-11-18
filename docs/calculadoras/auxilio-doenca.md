# Calculadora: auxílio-doença 2026 (`/calculadoras/auxilio-doenca`)

Criada e publicada em 18/11/2026, a pedido do Renato ("Pode criar próximos 2 artigos"), a partir
da pauta: candidato 4 de "Candidatos vindos das buscas que ficaram de fora (16/11/2026, 2ª
rodada)" ("calculadora auxílio doença 2026", em "Outras pessoas pesquisaram" da revisão do
auxílio-doença).

## Por que existe

Nas buscas de valor do auxílio-doença, os primeiros resultados são calculadoras de escritórios e
sites de ferramentas. O artigo `/artigos/auxilio-doenca` já tinha a regra e um exemplo; a
calculadora faz a conta com os números da pessoa, e os dois se linkam.

## Prints recebidos (SerpApi, 18/11/2026)

2 buscas, celular, São Paulo. JSON em `prints/auxilio-doenca/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `calculadora auxílio doença 2026`, autocompletar | 2022, 2023 (online), 2024 (online) | o ano no título e na descrição; a página diz que os valores de 2027 entram quando publicados |
| idem, PAA | **Qual o valor do auxílio por incapacidade em 2026?** · quem ganha R$ 3.500 paga quanto de INSS · 57 anos e 20 de contribuição · **como fazer o cálculo?** | FAQ do valor em 2026; H2 "Como calcular?". INSS de quem ganha R$ 3.500: calculadora de salário líquido (outro assunto); aposentadoria: artigo próprio |
| idem, outras pesquisas | Meu INSS · calculadora de aposentadoria R7 | CNIS do Meu INSS no passo a passo; R7: fora (marca) |
| idem, visão de IA | 91%; limite dos 12 últimos (art. 29, § 10); piso R$ 1.621; teto "entre R$ 8.097,46 e R$ 8.475,55" (**impreciso**: a portaria de 2026 fixa R$ 8.475,55); carência; 15 dias da empresa. Cita 3 calculadoras de escritórios e sites | não é fonte. Teto conferido na portaria; formato da resposta (regras em lista com valores) seguido no lead |
| `como calcular auxílio doença`, autocompletar | INSS · 2025 · **atrasado** · **acidentário** · **MEI** · valor · salário · **RMI** · carência · previdenciário · **retroativo** | FAQ do acidentário (art. 61); "o que a calculadora não faz" (atrasados e retroativos); RMI = o valor calculado; carência: link para o artigo. MEI: fora (sem fonte da base de contribuição lida) |
| idem, PAA | INSS de quem ganha R$ 4.500 · **valor máximo em 2026** · **o salário diminui quando se afasta?** · **deve contribuir durante o auxílio?** | H2 do valor máximo (R$ 7.712,75); H2 "o salário diminui?"; contribuição durante o benefício: link para o artigo (tempo de contribuição) |
| idem, outras pesquisas | 2 anos de auxílio aposenta · quanto tempo para receber · conta para aposentadoria por idade e especial · quanto tempo de contribuição · conta como carência | cobertos no artigo do auxílio-doença (linkado); fora da calculadora |
| idem, visão de IA | 100% dos salários desde 07/1994; 91%; limite dos 12; menor dos dois; piso e teto; 15 dias; carência. Fontes: escritórios, gov.br, Migalhas | não é fonte; bate com a lei e a EC 103 |
| orgânicos | calculadoras de sites e apps (INSS Descomplicado, i24, Previrb), portal de notícia | o site não aparece. **Formato: a busca pede ferramenta**, e a página é ferramenta |

## Fontes confirmadas (18/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Média de 100% dos salários desde julho de 1994, corrigidos | EC 103/2019, art. 26 (Câmara, publicação original; achada pelo LexML) | oficial |
| Salário de benefício entre o mínimo e o teto; 13º fora da média | Lei 8.213/1991, art. 29, §§ 2º e 3º (Câmara) | oficial |
| Limite da média dos 12 últimos (ou dos existentes) | Lei 8.213, art. 29, § 10 | oficial |
| Renda não inferior ao mínimo | Lei 8.213, art. 33 | oficial |
| 16º dia para o empregado; início da incapacidade para os demais | Lei 8.213, art. 60 | oficial |
| 91%, inclusive acidentário | Lei 8.213, art. 61 | oficial |
| Mínimo R$ 1.621 e teto R$ 8.475,55 (máximo R$ 7.712,75) | Portaria Interministerial MPS/MF 13/2026; `src/lib/tributos/parametros-2026.ts` | oficial |

## Motor e testes

- `src/lib/auxilio-doenca/valor.ts`: lê o mínimo e o teto de `parametros-2026.ts`; 91% arredondado
  ao centavo; avisos de piso, limite dos 12 e teto.
- `tests/auxilio-doenca.test.mjs`: 8 testes (exemplos do artigo, piso, teto, limite abaixo do piso).
- Componente `src/components/calculadora-auxilio-doenca.tsx`, registrado em `src/lib/ferramentas.ts`
  e em `src/components/pagina-do-artigo.tsx` como `calculadora-auxilio-doenca`.

## Pendente

- Base de contribuição do MEI (para dizer que o auxílio é de um mínimo): ler a LC 123 ou a Lei 8.212.
- Correção dos salários antigos: a calculadora não corrige; a pessoa informa a média.

## Para medir

A partir de ~2/12/2026: "calculadora auxílio doença 2026", "como calcular auxílio doença",
"valor máximo auxílio doença 2026", "auxílio doença 91%".

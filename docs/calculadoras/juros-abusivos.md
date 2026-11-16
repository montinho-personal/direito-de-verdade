# Calculadora: juros abusivos 2026 (`/calculadoras/juros-abusivos`)

Publicada em 27/10/2026, a pedido do Renato ("Prompt mestre — Calculadora de juros
abusivos 2026"), sem os prints do Google. Ferramenta `calculadora-juros-abusivos`
(`src/components/calculadora-juros-abusivos.tsx` e `src/components/juros/textos.tsx`);
motor em `src/lib/juros/` (`financeiro.ts`, `modalidades.ts`, `analise.ts`); médias do
BC em `src/lib/juros/series-bcb.ts`, geradas por `scripts/atualizar-taxas-bcb.mjs`;
testes em `tests/juros.test.mjs` com referência em `tests/referencia/juros.py`.

## Por que existe

Busca principal: `calculadora de juros abusivos`. Secundárias do prompt: `como saber se
juros são abusivos`, `juros abusivos financiamento veículo`, `calculadora de juros
financiamento`, `taxa média Banco Central financiamento`, `juros abusivos empréstimo
pessoal`, `como calcular juros de empréstimo`, `revisão de contrato bancário`, `comparar
taxa de juros com Banco Central`. Sem volume confirmado. O site não tinha nada sobre juros
bancários: sem risco de canibalização. URL no padrão `/calculadoras/...`, não
`/calculadora-juros-abusivos` na raiz.

## Prints recebidos

Arquivos em `prints/juros-abusivos/` (16/11/2026). Revisão no mesmo dia.

| print | conteúdo | onde entrou |
|---|---|---|
| `calculadora de juros abusivos`, autocompletar (1) | gratuito · consignado · financiamento · financiamento de veículos · banco central · online grátis · empréstimo clt · online | `tituloSeo` "Calculadora de juros abusivos grátis: compare com o BC"; `descricao` com empréstimo, consignado e financiamento; consignado CLT na tabela de médias |
| visão geral de IA (2) | Calculadora do Cidadão do BCB; calculadoras de escritórios e da Defensoria; "não há teto único"; limites do rotativo, cheque especial e consignado INSS | não é fonte; confirma o método e os limites que a página já tinha |
| PAA (3) | Como calcular se o juros está abusivo? · Quanto fica 30 mil financiado em 48 vezes? · Quanto vou pagar de juros em um empréstimo de R$ 20 mil? · Juros de 15% ao mês são abusivos? | H2 "Quanto fica 30 mil financiado em 48 vezes?" e "Quanto vou pagar de juros em um empréstimo de R$ 20 mil?" (exemplos de conta, Price, às médias de ago/2026); 15% no H2 da taxa abusiva |
| "Outras pessoas pesquisaram" (4, 5) | banco central · online grátis · financiamento de veículos · revisional · consignado · empréstimo pessoal · defensoria · Calculadora do Cidadão · juros compostos | já cobertos (modalidades, médias); revisional e Defensoria no "Como reclamar" |
| `como saber se juros são abusivos`, autocompletar (6) | meus juros · juros cobrados · do financiamento · do empréstimo · do banco · online | H2 "O que são juros abusivos?" virou "Como saber se os juros são abusivos?" |
| visão geral de IA (7) | comparar taxa e CET com a média; "1,5x, 2x ou mais"; tetos; venda casada | o múltiplo **não entrou**: o STJ não fixou múltiplo (Teses 48); o texto diz isso |
| PAA (8) | Qual taxa de juros é considerada abusiva? · É legal cobrar juros de 2% ao mês? · 10% ao mês é abusiva? · 15% ao mês? | H2 "Qual taxa de juros é considerada abusiva? (2%, 10% ou 15% ao mês)", comparando cada uma com as médias de ago/2026 e os limites legais |
| "Outras pessoas pesquisaram" (9, 10) | consultar banco central · estou pagando juros abusivos no financiamento/empréstimo · quanto é considerado abusivo · como tirar juros abusivos · consignado · Procon resolve juros abusivos? | FAQ "O Procon resolve juros abusivos?" |
| `taxa média banco central financiamento`, autocompletar (11) | veículo · de juros · imobiliário · 2023 · 2022 | H2 "Qual a taxa média de juros do Banco Central hoje?" com a tabela; anos antigos: a calculadora usa o mês da contratação, desde 2011 |
| visão geral de IA (12) | veículos ~1,96% a.m.; imobiliário 10,26% a 15% + TR (MySide); 0,87% a.m. | não é fonte; a tabela usa as séries do SGS (veículos 1,97% em ago/2026); faixas da MySide fora |
| PAA (13) | Qual a média de taxa de financiamento? · imóveis no Banco Central? · veículo? · taxa média hoje? | mesma tabela, com imobiliário de mercado e regulado e nota do indexador |
| "Outras pessoas pesquisaram" (14, 15) | tabela de taxas dos bancos · financiamento de veículos 2026 · moto · consulta taxa média · histórico · aquisição de veículo pessoa física | tabela + link ao portal de dados abertos. Taxa por banco e moto: fora (a página compara com a média da modalidade, não ranqueia bancos) |

Contas dos exemplos (Price, parcela = V·i/(1−(1+i)^−n), sem IOF): 30.000 × 1,97% × 48 =
R$ 972,09 (total 46.660,51); 20.000 × 6,39% × 24 = R$ 1.651,47 (juros 19.635,16);
20.000 × 1,82% × 24 = R$ 1.035,98 (juros 4.863,60). Taxas anuais efetivas = (1+i)^12 − 1
sobre os valores de `series-bcb.ts`.

## Dados do Banco Central

Séries do SGS, taxa média mensal (% a.m.) das novas operações de pessoas físicas,
ponderada pelas concessões. Nomes e páginas conferidos no catálogo de dados abertos do BC
em 27/10/2026; valores baixados de api.bcb.gov.br; dados até ago/2026.

| modalidade | série |
|---|---|
| Empréstimo pessoal | 25464, crédito pessoal não consignado |
| Consignado INSS / privado / público / não sei | 25468 / 25466 / 25467 / 25469 (total) |
| Veículo | 25471, aquisição de veículos |
| Imobiliário: taxa regulada / de mercado | 25498 / 25497 (recursos direcionados); "não sei" não compara |
| Cartão rotativo | 25477 |
| Parcelamento de fatura | 25478, cartão parcelado |
| Cheque especial | 25463 |
| Outro | sem comparação |

- Recorte em mar/2011 (início da metodologia atual) para todas; antes disso, "referência
  indisponível". Mês do contrato ainda sem média: usa a última divulgada por até 3 meses,
  com aviso; depois, não compara. Nunca troca de modalidade.
- **Atualização:** `node scripts/atualizar-taxas-bcb.mjs` depois de cada divulgação mensal do
  BC (o script confere formato, buracos e início; se algo falhar, não reescreve). O
  `npm test` confere pontos da série. Sem consulta ao BC em tempo de execução (o site é
  estático e o CORS da API não é garantido): o "cache" é o arquivo versionado.

## Fontes confirmadas

| fato | fonte | tipo |
|---|---|---|
| Juros acima de 12% a.a., por si só, não indicam abusividade | STJ, Súmula 382; JT 48, tese 4 (Tema 25) | oficial |
| Taxa acima da média, por si só, não configura abusividade | STJ, JT 48, tese 8 | oficial |
| Revisão em situações excepcionais, abusividade cabalmente demonstrada | STJ, JT 48, tese 12 (Tema 27); REsp 1.061.530 | oficial |
| Sem prova da taxa: média do BC, salvo se a cobrada for mais vantajosa | Súmula 530 (Tema 233) | oficial |
| Juiz não reconhece de ofício abusividade de cláusula bancária | Súmula 381 (Tema 36) | oficial |
| Anual > 12× mensal basta para a taxa efetiva anual | Súmula 541 (Temas 246/247) | oficial |
| Capitalização inferior à anual desde 31/03/2000, se pactuada | Súmula 539 | oficial |
| Instituições financeiras fora da Lei de Usura; administradoras de cartão são IF | JT 48, teses 15 e 17; Súmula 283 | oficial |
| Taxa diária na capitalização diária: Tema 1.474 afetado, processos suspensos | STJ, notícia 19/10/2026 | oficial |
| CET: definição, fórmula, taxa anual, informar antes e no contrato | Res. CMN 4.881/2020, arts. 1º a 8º | oficial |
| Cheque especial: até 8% a.m., desde 06/01/2020 | Res. CMN 4.765/2019, art. 3º | oficial |
| Rotativo e parcelamento da fatura: encargos até 100% do valor original, dívidas desde 03/01/2024 | Secom/Presidência 03/01/2024 (Lei 14.690/2023) | oficial |
| Proibida tarifa de liquidação antecipada | Res. CMN 3.516/2007, art. 1º | oficial |
| Redução proporcional dos juros na quitação antecipada | CDC, art. 52, § 2º | oficial |
| Relatório de empréstimos (Registrato/SCR), gratuito, gov.br prata/ouro | gov.br, serviço do BC | oficial |
| Reclamação no BC: banco responde em até 10 dias úteis | gov.br, serviço do BC | oficial |

## Pendente (revisão humana)

- **Res. CMN 5.004/2022 (liquidação antecipada):** revogou os arts. 2º e 3º da 3.516 e a
  4.320 a partir de 02/05/2022. O texto final não abriu no portal do BC; li a minuta do Voto
  33/2022 (taxa pactuada para o valor presente em prefixados). A calculadora usa a taxa do
  contrato e diz que é estimativa, sem citar a 5.004.
- **Lei 14.690/2023:** o Planalto estava fora do ar; o teto do rotativo está citado pela nota
  da Secom. Conferir o artigo da lei.
- **Teto do consignado INSS:** muda com o CNPS; não achei fonte oficial de 2026. A
  calculadora não embute número e manda ao Meu INSS.
- **Tema 1.474 (taxa diária):** acompanhar.
- **Imobiliário:** séries de recursos direcionados; o indexador (TR, IPCA) não entra na
  conta.

## Decisões

- Nenhuma classificação automática ("abusivo", "ilegal"); a palavra só aparece nas
  explicações jurídicas. Teste garante que memória e hipóteses não dizem "ilegal",
  "abusivo", "devolver" nem "tem direito".
- Cenário B rotulado como comparação matemática, nunca "valor a devolver".
- Diferença relativa (% maior que a média) mostrada com nome claro, junto com os pontos
  percentuais.
- Taxa: informada > anual convertida > calculada sobre o financiado > calculada sobre o
  recebido. A calculada sobre o recebido fica perto do CET (sem IOF por datas).
- Saldo devedor com parcelas pagas = valor presente das restantes à taxa do contrato.
- Rotativo e cheque especial: sem parcelas; compara a taxa e mostra juros de um mês.
- Sem SoftwareApplication (sem avaliações reais); Article, FAQPage e BreadcrumbList já
  existem. AdSense só automático, sem bloco manual reservado (mesma limitação das outras).
- PDF pelo "Imprimir ou salvar em PDF" do navegador, com a memória aberta na impressão.

## Analytics

`juros_simulador_visualizado`, `juros_simulador_iniciado`, `juros_modalidade_selecionada`
(modalidade), `juros_taxa_calculada` (modalidade, origem da taxa),
`juros_comparacao_exibida` (modalidade, acima/abaixo/sem referência), `juros_pdf_gerado`,
`juros_compartilhamento` (canal), `juros_artigo_clicado` (destino). Nunca valores ou taxas.

## Testes

17 testes: Price e SAC contra referência em Decimal (inclusive 360 meses e taxa zero),
exemplos de livro (R$ 10.000 a 2% em 12x = R$ 945,60; SAC R$ 12.000 a 1% = R$ 780 de
juros; 8% a.m. = 151,8% a.a.), tabelas fecham em zero, taxa implícita com parcelas iguais
e variáveis (bisseção x Newton), conversões, liquidação, séries sem buracos e pontos
conferidos na API, referência indisponível, CET x taxa, tarifas, taxas que não batem,
SAC, dados incompletos, valores extremos, regras por modalidade. Playwright a 320 px com
axe em todas as etapas.

## Para medir

A partir de 10/11/2026: `calculadora de juros abusivos`, `taxa média banco central
financiamento`, `juros abusivos financiamento veículo`. No GA4: modalidade mais usada e
quantas comparações ficam acima da média.

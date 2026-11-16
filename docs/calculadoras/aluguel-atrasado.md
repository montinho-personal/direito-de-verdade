# Calculadora: aluguel atrasado (`/calculadoras/aluguel-atrasado`)

Criada e publicada em 16/11/2026, pedido do Renato ("Pode criar esses 4 artigos"), 1º dos
quatro candidatos vindos das buscas que ficaram de fora (pauta de 16/11). Ferramenta
`calculadora-aluguel-atrasado` (`src/components/calculadora-aluguel-atrasado.tsx`), motor em
`src/lib/aluguel/atraso.ts`, IGP-M em `src/lib/aluguel/igpm.ts` (SGS 189), IPCA reaproveitado de
`src/lib/cobranca-indevida/ipca.ts`; testes em `tests/aluguel-atrasado.test.mjs` (9).

## Por que existe

"Calculadora de juros de aluguel atrasado" apareceu em "Outras pessoas pesquisaram" do despejo.
Completa a calculadora de multa por quebra de contrato (outra multa) e o artigo de despejo.

## Prints recebidos (SerpApi, 16/11/2026)

JSON em `prints/aluguel-atrasado/`. Celular, São Paulo.

| busca | conteúdo | onde entrou |
|---|---|---|
| `calculadora de aluguel atrasado`, autocompletar | **pelo igpm** · de juros · de multa · de atualização · de multa e juros · guide/quinto andar (marcas) | `titulo` e `tituloSeo` com multa, juros e IGP-M; índice IGP-M e IPCA na calculadora. Marcas: fora |
| idem, PAA | Quanto cobrar de juros por dia de atraso? · 2 meses atrasado? · **Pode cobrar multa de 20%?** · planilha para calcular | H2 dos juros por dia; H3 "Pode cobrar multa de 20%?"; FAQ do despejo; a calculadora no lugar da planilha |
| idem, outras pesquisas | pelo igpm · multa por atraso por dia · juros de aluguel atrasado · juros aluguel atrasado lei | H2 dos juros e da correção |
| `juros de aluguel atrasado`, autocompletar | por dia · de mora · lei · como cobrar · pode cobrar · taxa · multa e juros · **sem contrato** · por dia como calcular | H2 dos juros por dia; H2 "Como cobrar aluguel atrasado sem contrato?" |
| idem, PAA | O proprietário pode cobrar juros? · **É legal cobrar juros de 2% ao mês?** · Atrasei, posso ser despejado? · Como fazer o cálculo de dias de aluguel? | juros pelo contrato (aviso na calculadora acima de 1% ao mês, sem afirmar ilegalidade); despejo na FAQ e no H2 final |
| idem, outras pesquisas | multa por atraso lei do inquilinato · como cobrar educadamente / pelo WhatsApp · multa 20% · valor da multa residencial | multa no H2 próprio. Cobrança "educada"/WhatsApp: fora (não é questão de direito) |
| idem, visão de IA | multa até 10% "pela Lei de Usura/CC"; juros "máximo 1% ao mês, mesmo com contrato omisso"; correção pelo índice do contrato. Fontes: 99Contratos, BRCondos, Asaas, Neofin, QuintoAndar, Serasa, Locapay | não é fonte. O "1% ao mês com contrato omisso" está **desatualizado**: desde a Lei 14.905/2024 vale a taxa legal (CC 406), e o texto diz isso. Teto de 10%: Lei de Usura não conferida (Planalto e Câmara fora), então não entrou |
| `multa por atraso de aluguel`, autocompletar | por dia · residencial · lei do inquilinato · comercial · qual a porcentagem · stj · valor · tributável · limite · 20 · abusiva | H2 do valor da multa (lei do inquilinato não fixa limite; CC 412 e 413). "Tributável" e "comercial": fora |
| idem, PAA | Como processar inquilino devedor? · **Pode cobrar 3 aluguéis de multa?** · Como calcular o valor exato? · É legal cobrar 10%? | FAQ dos 3 aluguéis (é a multa por quebra de contrato, link para a outra calculadora); despejo no H2 final |
| idem, visão de IA | só com código, sem texto nesta busca | — |
| orgânicos | calculadoras de 99Contratos, Neofin, Cálculo Exato, Imóvel Guide, Pilota, CashGo; artigos de Jusfy, Jusbrasil, imobiliárias | o site não aparece. Diferencial na `descricao`: IGP-M ou IPCA oficial e regras do Código Civil |

## Fontes confirmadas (16/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Mora no vencimento (397); correção pelo índice convencionado ou IPCA (389, par. único); juros pela taxa legal quando não convencionados (406; Selic − IPCA; negativa = 0); perdas, juros e correção na mora (395) | Código Civil, texto atualizado (Câmara) | oficial |
| Cláusula penal combinada (408, 409, 411); não excede a obrigação principal (412); redução da multa excessiva (413) | idem | oficial |
| Lei de Usura não se aplica a PJ x PJ, títulos, instituições financeiras e mercado (art. 3º); BC disponibiliza simulador da taxa legal (art. 4º); efeitos 60 dias após 01/07/2024 (art. 5º) | Lei 14.905/2024 (Câmara) | oficial |
| Metodologia da taxa legal | Resolução CMN 5.171/2024 (bcb.gov.br) | oficial |
| Vencimento até o 6º dia útil (23, I); purga em 15 dias com custas e honorários (62) | Lei 8.245/1991 (Câmara) | oficial |
| Lei do Inquilinato sem limite para multa moratória (multas citadas: art. 4º, 43, 54-A, 62) | idem, busca no texto | oficial |
| Multa de mora de 2% nas compras com crédito ou financiamento | CDC, art. 52, § 1º (Câmara) | oficial |
| IGP-M mensal jan/2015 a out/2026 | Banco Central, SGS 189 | oficial |

## Como a conta é feita

- Multa: percentual × valor em atraso (sem correção), uma vez.
- Correção: produto das variações mensais dos meses completos de atraso, a partir do mês do vencimento; meses sem índice divulgado ficam de fora, com aviso; fator menor que 1 vira 1, com aviso.
- Juros: simples, taxa ao mês × dias ÷ 30, sobre o valor corrigido. Contrato sem taxa: juros não calculados, aviso com a Calculadora do Cidadão.
- Centavos, meio centavo para cima, a cada parcela.
- Avisos: multa acima de 10% (CC 413) e juros acima de 1% ao mês (conferir a cláusula), sem afirmar ilegalidade.

## Pendente

- Lei de Usura (Decreto 22.626/1933), arts. 1º e 9º: não lida (Planalto e Câmara fora do ar). Se confirmada e aplicável a aluguel entre pessoas físicas, pode limitar juros e multa: rever o texto e os avisos.
- Aplicação do CDC (multa de 2%) ao aluguel: entendimento do STJ não conferido; o texto manda avaliar com advogado ou Defensoria.
- IPCA de out/2026 já saiu no BC (série 433), mas o número-índice da tabela compartilhada vai até set/2026: atualizar junto com a calculadora de cobrança indevida.

## Decisões

- Taxa legal não embutida (muda todo mês e a série do BC não foi conferida aqui).
- Sem SoftwareApplication; Article, FAQPage e BreadcrumbList como as outras.
- Data do pagamento em branco = hoje, calculado só no navegador.

## Para medir

A partir de ~30/11/2026: `calculadora de aluguel atrasado`, `juros de aluguel atrasado`, `multa por atraso de aluguel`, `calculadora de aluguel atrasado pelo igpm`.

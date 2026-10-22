# Calculadora: taxa de importação (`/calculadoras/taxa-de-importacao`)

Escrita e publicada em 21/10/2026, a partir dos prints do Renato. Usa a
ferramenta que já existia no artigo da taxa das blusinhas
(`calculadora-compra-internacional`, motor `src/lib/importacao.ts`), agora
com página própria na seção de calculadoras.

## Por que existe

"Calculadora de taxa de importação 2026" e "calcular imposto shein" são buscas
de quem está com o carrinho aberto. O pico é na Black Friday (27/11/2026) e
no Natal. O artigo `/artigos/taxa-compras-internacionais` responde se a taxa
acabou; esta página faz a conta e responde às dúvidas de quem já comprou:
foi taxado, quanto, quando paga, como pedir reembolso.

## Prints recebidos

Recebidos em 21/10/2026, 21h38–21h40 (celular). Prints em
`docs/calculadoras/prints/taxa-de-importacao/`.

| print | conteúdo | onde entrou |
|---|---|---|
| 01 Autocompletar `calculadora de taxa de importação` | 2026; 2025; de icms e taxa de importação; correios; brasil; e exportação; para china | "2026" no título; H2 do ICMS do estado; H3 dos Correios. Exportação e China: outra intenção, fora |
| 02 Visão geral de IA | PRC 0% até US$ 50 + 17% de ICMS; 60% com dedução de US$ 30 "(ou US$ 20, dependendo da regra)"; fora do PRC "até US$ 500 no Regime Simplificado"; despacho postal R$ 15; importação formal acima de US$ 3 mil | conferido: US$ 20 é a regra antiga; **US$ 500 está errado** (o RTS vai a US$ 3 mil; US$ 500 é a cota terrestre de viajante) → FAQ; R$ 15 sem fonte de 2026 → texto diz só "serviço pelo despacho, não é imposto" |
| 03 Outras pesquisas | simulador de taxas alfandegárias; calculadora imposto importação receita federal; simulador gratuito; importação de serviços; siscomex; importação simplificada | H2 "A calculadora da Receita é diferente desta?"; serviços e Siscomex: fora |
| 04 Autocompletar `calcular imposto shein` | 2050 cbseres (ruído); g1; calculadora; 2024; reembolso; calcular taxa de importação shein | "Shein" no título; H3 do reembolso |
| 05 Visão geral de IA | PRC até US$ 50: II zero, ICMS 17–20% por dentro; acima: 60% − US$ 30; exemplo "SP 17%, compra de R$ 200 já sai com os tributos no checkout" | conferido na Receita; H3 "Comprei 200 reais" |
| 06 Outras pesquisas | calculadora de impostos de compras internacionais; calculadora receita federal; simulador alfandegário; simulador gratuito; calculadora de compras internacionais; imposto shein vai acabar | H2 "O imposto da Shein vai acabar?"; H2 da Receita |
| 07 PAA | Qual o valor do imposto de importação na Shein?; Comprei 200 reais na Shein, posso ser taxado?; A Shein cobra impostos na alfândega?; Como saber se seu pacote da Shein foi taxado? | as quatro viraram H2/H3. Concorrente: "Simulador completo com IOF, taxa dos Correios" → nosso diferencial é o ICMS por estado e o passo a passo |

## Fontes confirmadas

Revalidação de 21/10/2026 (22/10 UTC), downloads em
`scratchpad/imp/` da sessão.

| fato | fonte | tipo |
|---|---|---|
| Tabela desde 12/05/2026 (PRC 0% até US$ 50; 60% − US$ 30 até US$ 3 mil; fora do PRC 60%); fórmula do ICMS por dentro; exemplos 1.1 a 2.2 | Receita, "Novas Regras" (texto idêntico ao de 20/10) e "Quanto vou pagar" (atualizada em 14/09/2026) | oficial |
| 60% com desconto de US$ 30 (texto integral) | Portaria MF 1.342/2026, DOU 12/05/2026, Ed. 87-A | oficial |
| Lei 15.502: ministro **pode** reduzir a zero até US$ 50 e a 30% até US$ 3 mil (30% é piso, não alíquota vigente); avaliação da Fazenda em 3 meses e depois a cada 6, no máximo; limites de quantidade e fracionamento | Planalto, L15502 | oficial |
| Nenhuma portaria nova de 10/09 a 22/10/2026 | busca no DOU (só ADEs da Coana) | oficial |
| PRC cobra II, ICMS e tarifas na compra; fora do PRC, pagamento nos Correios ou na transportadora em até 20 dias depois da autorização; sem imposto no checkout = cobrança na chegada sem benefício | Receita, "Em que momento vou pagar os impostos?" (atualizada em 12/12/2025) | oficial |
| Como saber se está no PRC (ICMS no checkout); acompanhar rastreamento; II cobrado até US$ 50 em site do PRC é indevido, ressarcimento pelo site; presente de pessoa física fica fora do PRC; prazo perdido: devolução ou abandono; cota de viajante US$ 1.000 / US$ 500 terrestre | Receita, Perguntas e Respostas, perguntas 13.1, 13.3, 13.4, 14.1, 14.3 (atualizada em 06/08/2026) | oficial |
| Minhas Importações: cadastro, pendência, boleto ou Pix, só no site oficial | Receita, "Como realizar pagamento pelo Minhas Importações" | oficial |
| RTS até US$ 3 mil; câmbio da data de registro da declaração; serviço de despacho dos Correios e couriers não é imposto | Receita, tópico Tributação (atualizado em 12/06/2026) | oficial |
| Calculadora da Receita atualizada em 19/05/2026, ICMS fixo de 17%; alguns estados com 18%, 19% ou 20%; tabela no Comsefaz | Receita, página da calculadora (e o JS dela, que bate com o nosso motor) | oficial |
| IOF de 3,5% em compras no exterior com cartão | Decreto 6.306, art. 15-B, VII (redação do Decreto 12.499/2025), Planalto | oficial |
| Valores dos exemplos e da tabela do ICMS por dentro | motor `src/lib/importacao.ts`, testado contra os exemplos da Receita (`tests/importacao.test.mjs`) | cálculo |

## Pendente

- **Tabela de ICMS por estado:** o Comsefaz não abre neste ambiente. A
  Agência Brasil (31/03/2025) lista 10 estados com 20%, incluindo MG, mas MG
  manteve 17% (Decreto 49.012/2025). Sem tabela oficial de 2026, a página
  não publica lista por estado.
- **Valor do despacho postal dos Correios em 2026:** só há R$ 15 em
  reportagens de 2018 e 2023; correios.com.br bloqueado aqui.
- **Câmbio do dia da compra:** a lei diz que mercadorias do PRC "poderão" usar
  o câmbio da compra (§ 2º-G); a Receita ainda fala em câmbio da data de
  registro. A página cita só a Receita.
- **Primeira avaliação da Fazenda:** prevista para cerca de 10/12/2026.
  Revisar a página quando sair.

## Decisões

- **Título** "Calculadora de Taxa de Importação 2026: Shein e ICMS" (52):
  busca principal + "2026" (1ª sugestão) + "Shein" (2ª busca) + "ICMS"
  ("calculadora de icms e taxa de importação" e o nosso diferencial: a
  calculadora da Receita só faz 17%).
- **Descrição** (150) com a resposta: até US$ 50 só ICMS, acima 60% − US$ 30.
- **Mesma ferramenta do artigo**, sem duplicar motor. O compartilhamento agora
  usa o endereço da página em que está (antes apontava sempre para o artigo).
  A nota da ferramenta passou a dizer que o serviço de despacho dos Correios
  não entra na conta.
- **Sem IOF na conta:** depende do câmbio do banco e só vale na cobrança em
  moeda estrangeira; explicado em FAQ.
- **Exemplos com dólar a R$ 5,00**, o valor fictício da Receita; a ferramenta
  pede a cotação do dia.
- **Fora:** exportação, China, Siscomex, importação de serviços (outras
  intenções); valor do despacho postal (sem fonte de 2026); tabela de ICMS por
  estado (sem fonte oficial acessível).
- **FAQ com 5:** outros sites; mito dos US$ 500; presente de parente; prazo
  perdido; IOF.
- **Links:** daqui para o artigo da taxa das blusinhas e para golpes de fim de
  ano; do artigo para cá (parágrafo do ICMS). Na mesma edição, o artigo passou
  a dizer que, no PRC, o reembolso do II cobrado indevidamente se pede ao site
  (pergunta 13.3 da Receita).
- **AdSense:** `site.adsense` vazio; quando entrar, nenhum anúncio dentro da
  ferramenta nem entre o lead e ela.

## Para medir

A partir de ~5/11/2026: "calculadora de taxa de importação", "calculadora de
taxa de importação 2026", "calcular imposto shein", "calculadora imposto
shein", "calculadora de icms e taxa de importação", "comprei 200 reais na
shein posso ser taxado", "a shein cobra impostos na alfândega". Revisar a cada
portaria da Fazenda sobre remessas e na avaliação de ~10/12/2026.

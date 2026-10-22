# Calculadora: FGTS 2026 (`/calculadoras/fgts`)

Publicada em 22/10/2026 (horário de Brasília), a pedido do Renato ("Prompt mestre —
Calculadora de FGTS 2026"). Ferramenta nova `calculadora-fgts`
(`src/components/calculadora-fgts.tsx` e `src/components/fgts/`), motor em
`src/lib/fgts/`. A multa usa os mesmos percentuais da calculadora de rescisão
(`src/lib/trabalhista/parametros.ts`).

## Por que existe

"Calculadora FGTS" é busca de todo mês, com pico nas demissões de dezembro e
janeiro e no saque-aniversário. O site tinha a multa só dentro da rescisão; faltava
o depósito mensal, o saldo, a conferência dos depósitos e o saque.

## Prints recebidos

Recebidos em 21/10/2026, 23h18–23h21 (celular), em `docs/calculadoras/prints/fgts/`.

| print | conteúdo | onde entrou |
|---|---|---|
| 01 autocompletar `calculadora fgts` | mensal; saque aniversário; g1; lucro; rescisão; atrasado; e multa; aniversário | as 5 modalidades; H2 da correção (lucro); conferência (atrasado) |
| 02 visão geral de IA | Serasa e Cálculo Jurídico; 8%; aprendiz 2%; **"11,2% para domésticos"**; TR + 3% + lucro com piso do IPCA; 40% e 20% | conferido; o "11,2%" está errado (8% de FGTS + 3,2% de indenização à parte): H3 do doméstico explica |
| 03 PAA | como simular; quanto é o FGTS de 2.500; quanto é 40% do saldo; lucro 2026 | H3 dos R$ 2.500; H3 "quanto é 40% do saldo"; H2 da correção |
| 04 outras pesquisas | mensal; calcular fgts 40; rescisão; saque aniversário; atrasado; e multa | modalidades e H2 da multa |
| 05 visão geral de IA `como calcular fgts` | salário × 0,08; exemplo de R$ 3.000 = R$ 240; base com HE, adicionais, 13º | tabela por salário; H3 do que entra |
| 06 PAA | como fazer o cálculo; quem ganha R$ 2.000 paga quanto; como simular; cálculo exato | FAQ dos R$ 2.000 (corrige: quem ganha não paga); "exato": a página diz que é estimativa e o exato está no extrato |
| 07 outras pesquisas (1) | multa de 40; rescisão; saque aniversário; com multa; **trabalhei 1 ano quanto vou receber**; mensal; exemplo da Caixa "R$ 1 mil → R$ 400" | H2 "Trabalhei 1 ano"; o exemplo da Caixa mostra só a alíquota: com a parcela adicional, a lei dá R$ 450 (texto e teste) |
| 08 outras pesquisas (2) | atrasado; em atraso online grátis; jovem aprendiz; sem carteira assinada; dias trabalhados; multa e rescisão | H3 do aprendiz; FAQ "sem carteira"; parágrafo dos dias trabalhados |
| 09 autocompletar `empresa não depositou fgts` | no dia 20; o que fazer; posso pedir rescisão indireta; do mês; a 1 ano; na rescisão; e agora | H2 do prazo; H2 "o que fazer"; H3 da rescisão indireta |
| 10 visão geral de IA | extrato no app; RH; denúncia (Fala.BR, 158, Superintendência); sindicato | passo a passo só com canais oficiais confirmados (denúncia no gov.br, SRTE); 158 e Fala.BR sem fonte lida: fora |
| 11 PAA | é crime; multa por não depositar; o que acontece; há 3 meses | H3 da multa da empresa (art. 22); "crime" respondido só com o que a lei diz (infração administrativa, art. 23) |
| 12 outras pesquisas (1) | como cobrar; o que acontece; fui demitida e não depositou; ação; indenização; ela paga multa | H2 "o que fazer" (prazo de 5 anos) |
| 13 outras pesquisas (2) | direito ao pis; rescisão indireta; pedi demissão e não depositou; indenização; na rescisão; quanto tempo pode atrasar após demissão | prazo de 10 dias na saída; PIS: outro assunto, fora |
| 14 autocompletar `multa de 40% do fgts` | cai junto com a rescisão; como calcular; depositada onde; como sacar; cai em qual conta; sobre qual valor; como funciona; quanto é | H2 da multa e H3 "cai junto com a rescisão?" |
| 15 visão geral de IA | 40% sem justa causa e experiência antecipada; 20% acordo, culpa recíproca, força maior; sem multa no pedido e justa causa | conferido na lei e no Decreto 99.684 (art. 14); tabela por tipo de saída |
| 16 PAA | como é paga; não recebi, o que fazer; valor 2026; quanto tempo para cair | H3 "cai junto com a rescisão?" (10 dias, conta do FGTS) |
| 17 outras pesquisas (1) | paga junto com a rescisão; como calcular; depositada onde; junto com o fgts; cai automaticamente; como saber se foi depositada | idem |
| 18 outras pesquisas (2) | sacar a multa com saque-aniversário; como sacar; devolução ao empregador; quantos dias demora; saque aniversário | FAQ do saque-aniversário; devolução: os 3,2% do doméstico |
| 19 autocompletar `saque aniversário fgts` | cai no dia do aniversário; liberado pelo governo 2026; 2026; como funciona; quando cai; calendário; nubank | H2 do saque-aniversário (janela); FAQ "liberado pelo governo"; banco: fora |
| 20 visão geral de IA | modalidade opcional; bloqueio na demissão; carência de 25 meses | conferido: "1º dia do 25º mês" (art. 20-C) |
| 21 PAA | como funciona; novas regras 2026; mês de aniversário; calendário 2026 | H2 do saque-aniversário; regras da antecipação de 01/11/2026 |
| 22 outras pesquisas (1) | calculadora; calendário; liberado pelo governo; porcentagem; como funciona; como sacar | tabela de alíquotas e simulador |
| 23 outras pesquisas (2) | calendário 2026; empréstimo; 2026; sacar retido; antecipação; valor | parágrafo "antecipação é empréstimo"; "retido": bloqueio e MPs encerradas |

## Fontes confirmadas

Pesquisa de 21–22/10/2026; downloads em `scratchpad/fgts/` da sessão (INDEX.txt).

| fato | fonte | tipo |
|---|---|---|
| 8%; base com arts. 457/458 da CLT e 13º; aprendiz 2%; afastamento por acidente e serviço militar com depósito; exclusões do art. 28, § 9º, da Lei 8.212 | Lei 8.036, art. 15, caput e §§ 5º a 7º (Planalto, consolidado) | oficial |
| Prazo dia 20 (antes, dia 7); vale para fatos geradores a partir do FGTS Digital | Lei 14.438/2022, art. 19; Lei 8.036, art. 15 | oficial |
| FGTS Digital desde a competência 03/2024; 02/2024 venceu em 07/03/2024; 03/2024 em 19/04/2024 (antecipado); rescisório em 10 dias | Ministério do Trabalho, FAQ do FGTS Digital | oficial |
| Doméstico: DAE com vencimento no dia 20 desde 03/2024 | eSocial, notícia de 19/03/2024 | oficial |
| Doméstico: 8% + 3,2% em conta separada; destino dos 3,2% por motivo; sem 40% | LC 150/2015, arts. 22 e 34 | oficial |
| Depósito continua: licença até 15 dias, acidente, gestante, paternidade, militar | Decreto 99.684, art. 28 | oficial |
| FGTS sobre aviso prévio | Súmula 305 do TST (Res. 121/2003) | oficial |
| Férias indenizadas, abono, VT, PLR, diárias fora | Lei 8.212, art. 28, § 9º | oficial |
| TR + 3% ao ano; crédito no dia 21; distribuição de resultados; distribuição fora da base da multa | Lei 8.036, art. 13, §§ 1º, 5º e 7º | oficial |
| Remuneração mínima pelo IPCA, sem efeito retroativo | STF, notícia oficial da ADI 5.090 (12/06/2024) e do Tema 1.444 (18/02/2026) | oficial (notícia do STF; tese literal da ADI não aberta) |
| 2026: R$ 13,04 bi distribuídos (89% do lucro de 2025), +1,87%, rentabilidade de 6,90% | Ministério do Trabalho, 28/07/2026 | oficial |
| Multa: 40% de todos os depósitos com correção e juros, sem deduzir saques; mês da rescisão e anterior; 20% na culpa recíproca e força maior | Lei 8.036, art. 18; Decreto 99.684, art. 9º; OJ 42 do TST (transcrita no JusLaboris) | oficial |
| Contrato a prazo antecipado sem justa causa = multa; art. 479 | Decreto 99.684, art. 14; CLT, art. 479 | oficial |
| Acordo: 20%, saque de 80%, sem seguro-desemprego | CLT, art. 484-A | oficial |
| Hipóteses de saque; saque-aniversário (tabela, bloqueio, multa sacável, volta no 25º mês, janela até o último dia útil do 2º mês) | Lei 8.036, arts. 20, 20-A a 20-D e Anexo (Lei 13.932/2019) | oficial |
| Antecipação: R$ 100 a R$ 500 por saque; 90 dias; até 5 saques até 31/10/2026, 3 a partir de 01/11/2026; regras desde 01/11/2025 | fgts.gov.br, página do saque-aniversário (Resolução CCFGTS 1.130/2025) | oficial (página do FGTS; texto da resolução no DOU não localizado) |
| MPs 1.290/2025 e 1.331/2025 (saldo bloqueado) encerradas; nada vigente em 10/2026 | Planalto ("vigência encerrada"); fgts.gov.br | oficial |
| Encargos do atraso: TR, juros de 0,5% ao mês, multa de 5%/10%; infrações | Lei 8.036, arts. 22 e 23 | oficial |
| Rescisão indireta por descumprimento do contrato, permanecendo ou não no serviço | CLT, art. 483, "d" e § 3º | oficial |
| Prazo de 5 anos (até 2 anos do fim do contrato) | STF, Tema 608; Súmula 362 do TST (transcrita em acórdão) | oficial |
| Denúncia trabalhista; SRTE ou Judiciário | gov.br (serviço); Ministério do Trabalho | oficial |
| App FGTS | fgts.gov.br | oficial |
| Feriados nacionais (para antecipar o vencimento) | Lei 662/1949 (já na fonte do artigo do feriado); 20/11 desde 2024 | oficial |

## Motor, fórmulas e testes

- `parametros.ts`: alíquotas, 3,2%, multas, prazo, juros mensais equivalentes a 3%
  ao ano (1,03^(1/12) − 1 = 0,0024662698), tabela do saque-aniversário.
- `competencias.ts`: vencimento (dia 7 até 02/2024; dia 20 depois, antecipado em fim
  de semana e feriado nacional fixo); último dia útil.
- `deposito.ts`: base × alíquota; doméstico com 3,2% à parte.
- `saldo.ts`: mês a mês; salário proporcional aos dias (até 30) na entrada e na saída;
  13º com avos de 15 dias em dezembro (ou no último mês, se encerrado); 1/3 de férias
  no mês em que cada período aquisitivo se completa; afastamento por doença sem
  depósito; saques; saldo = saldo anterior × (1 + juros) + depósito − saque; base da
  multa sem descontar saques e sem saldo anterior. **Sem TR e sem distribuição de
  lucros**, avisado na tela.
- `conferencia.ts`: esperado = remuneração × alíquota; "não sei" ≠ zero; mês não
  vencido fica de fora; tolerância de R$ 1,00; nunca afirma irregularidade.
- `multa.ts`: percentual por motivo; saque (tudo, 80%, só a multa, nada); doméstico com
  destino dos 3,2%; restrições.
- `saque.ts`: 13 hipóteses do art. 20, com o efeito do saque-aniversário; valor anual;
  janela; volta ao saque-rescisão.
- Testes: `tests/fgts.test.mjs` (25) contra `tests/referencia/fgts.py` (Python escrito à
  parte, com Decimal): 7 vencimentos (inclui os dois exemplos oficiais do FGTS
  Digital), 8 simulações de saldo mês a mês (ano inteiro, sem 13º/1/3, admissão no
  meio do mês, aprendiz, doméstica encerrada, reajustes + variáveis + afastamento +
  saque, saldo inicial, saque maior que o saldo), 8 multas, 13 valores do
  saque-aniversário (todas as faixas e limites), 4 janelas; mais depósito, conferência,
  doméstico, hipóteses e entradas inválidas.
- Interface (Playwright, 320 px): as 5 modalidades, vencimento de 10/2026 antecipado
  para 19/11 (feriado de 20/11), aprendiz e doméstico, saldo de 1 ano, gráfico, saque
  informado, multa estimada e informada, acordo, pedido, saque-aniversário, conferência
  com 12 meses (3 conferidos, 2 divergentes, 9 pendentes), axe sem violações em cada
  modalidade, sem rolagem lateral, resumo copiado e eventos do GA sem valores.

## Pendente

- **TR e distribuição de lucros no saldo:** precisam da série da TR (Banco Central) e
  dos índices anuais (2024: 0,02693258, oficial; 2025 e 2026 só em notícia). Pode virar
  uma "estimativa com TR" depois.
- **Importação do extrato (CSV/PDF):** não feita. O extrato da Caixa não tem formato
  público documentado e a leitura de PDF no navegador não é confiável; a conferência
  é manual, mês a mês. Rever se as buscas pedirem.
- **Tese literal da ADI 5.090**, índices de 2025/2026 da distribuição e Resolução CCFGTS
  1.130/2025 no DOU: não abertos neste ambiente (portais bloqueados).
- **Acordo no saque-aniversário e no doméstico:** a lei não diz expressamente se a
  multa de 20% é sacável no saque-aniversário nem o destino dos 3,2% no acordo do
  doméstico; a tela avisa.
- **Feriados estaduais e municipais** no vencimento: não conferidos.

## Decisões

- **Título** "Calculadora de FGTS 2026: Saldo, Depósitos e Multa" (50) e **H1** do
  prompt, em caixa de frase. **Descrição** (138) ajustada para começar pela busca, como
  manda o CLAUDE.md.
- **Cinco modalidades** num só formulário, com vínculo, salário e admissão em comum.
- **Saldo separado em "total de depósitos" e "saldo atualizado estimado"**, com o aviso
  "não é o seu saldo oficial".
- **Conferência por cartões** (um por mês), não tabela larga, para funcionar no
  celular; até 60 meses por vez (o prazo para cobrar é de 5 anos).
- **Sem antecipação "recomendada"**: a página explica que é empréstimo.
- **GA4**: `fgts_calculadora_view`, `fgts_deposito_calculado` (vínculo),
  `fgts_saldo_simulado` (detalhado), `fgts_conferencia_iniciada`,
  `fgts_conferencia_concluida`, `fgts_multa_calculada` (motivo),
  `fgts_saque_consultado` (situação, adesão), `fgts_resultado_compartilhado` (canal,
  modo) e `fgts_link_relacionado` (destino). Nenhum valor, data ou salário.
- **AdSense:** `site.adsense` vazio; quando entrar, nenhum anúncio dentro da ferramenta
  nem entre o lead e ela; espaço reservado só entre seções do texto.
- **Links:** daqui para rescisão, férias, 13º e horas extras; da calculadora de
  rescisão para cá (parágrafo da multa).

## Para medir

A partir de ~6/11/2026: "calculadora fgts", "calculadora fgts mensal", "calculadora fgts
rescisão", "calculadora fgts atrasado", "como calcular fgts", "quanto é o fgts de 2500
reais", "multa de 40% do fgts", "empresa não depositou fgts", "saque aniversário fgts".
Revisar na distribuição de lucros de 2027, a cada mudança na tabela do saque-aniversário
(até 30/06 de cada ano, para o ano seguinte) e na regra da antecipação.

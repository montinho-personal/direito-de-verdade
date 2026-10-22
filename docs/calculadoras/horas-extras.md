# Calculadora: horas extras 2026 (`/calculadoras/horas-extras`)

Publicada em 21/10/2026 (horário de Brasília), a pedido do Renato ("Prompt
mestre — Calculadora de horas extras 2026"). Ferramenta nova
`calculadora-horas-extras` (componente `src/components/calculadora-horas-extras.tsx`,
motor `src/lib/trabalhista/horas-extras.ts`). Liga com o artigo
[hora extra e banco de horas](../artigos/horas-extras-banco-de-horas.md).

## Por que existe

"Calculadora de horas extras" é busca de quem quer conferir o holerite ou
saber quanto vai ganhar. No fim do ano, o comércio estende o horário, e em
16/12/2026 o limite semanal cai para 42 horas (EC 141), o que muda o que conta
como hora extra.

## Prints recebidos

Recebidos em 21/10/2026, 21h30–21h49 (celular), em
`docs/calculadoras/prints/horas-extras/`.

| print | conteúdo | onde entrou |
|---|---|---|
| 01 autocompletar `calculadora de horas extras` | com minutos; com dsr; com adicional noturno; trabalhadas; online grátis; no décimo terceiro; online; no sábado | campo que aceita minutos; DSR; modo completo com noturnas; H2 dos reflexos (13º); FAQ do sábado. "Horas trabalhadas" (somar o ponto) é outra ferramenta: fora |
| 02 visão geral de IA | divisor 220; × 1,5 e × 2 | conferido (teses do TST, Súmula 431); tabela de divisores com a origem de cada um |
| 03 outras pesquisas | minutos; online grátis; horas trabalhadas; com dsr; 100%; 50 | H2 dos minutos; H3 "como calcular hora extra 100%" |
| 04 autocompletar `calcular hora extra com minutos` | 50 com minutos; minutos e segundos; online; de trabalho | campo "1h30 / 1:30 / 1,5"; segundos: fora (ponto marca minutos) |
| 05 visão geral de IA | minutos ÷ 60 (15 = 0,25; 30 = 0,50; 45 = 0,75; 47 = 0,78) | tabela de minutos (conta conferida) |
| 06 PAA | quanto vale 30 minutos; qual o valor de 1 hora; como calcular horas por minutos; quantos minutos contam | H3 de cada uma; tabela por salário |
| 07 outras pesquisas | calculadora; horas trabalhadas; dsr hora extra; 100 por cento; 50 | idem acima |
| 08 autocompletar `dsr sobre horas extras` | como calcular; o que é; o que significa; é obrigatório; como funciona; desconto; na rescisão; incide inss | H2 do DSR e H3 "é obrigatório", "falta desconta o DSR?"; FAQ da rescisão e do INSS |
| 09 visão geral de IA | Lei 605/1949; DSR = HE ÷ dias úteis × domingos e feriados; sábado útil | conferido na Lei 605 e no Decreto 10.854; a fórmula é prática (citada em acórdão do TST), e o texto diz isso |
| 10 PAA | o que é DSR sobre horas extras; é obrigatório; o que a CLT diz; como se calcula | H2 e H3 de cada uma |
| 11 outras pesquisas (1) | na rescisão; reflexo extras dsr como calcular; calculadora com minutos; 100%; 50%; como calcular dsr sem hora extra | FAQ da rescisão; FAQ "DSR sem hora extra" (já pago no salário mensal, Lei 605, art. 7º, § 2º) |
| 12 outras pesquisas (2) | como calcular; é obrigatório; na escala 12x36; 50% e 100; clt; excel | FAQ da 12x36 (CLT, art. 59-A); "excel": fora (a calculadora faz a conta) |

## Fontes confirmadas

Pesquisa de 21/10/2026 (22/10 UTC), downloads em `scratchpad/he/` e
`scratchpad/he2/` da sessão.

| fato | fonte | tipo |
|---|---|---|
| Adicional mínimo de 50%; prazo de 5 anos, até 2 anos do fim do contrato | Constituição, art. 7º, XVI e XXIX | oficial |
| Jornada de 8 h; tolerância de 5/10 minutos; até 2 HE por dia por acordo; força maior e serviço inadiável; divisor do art. 64; descanso de 24 h (art. 67); 12x36 com DSR e feriados no salário (art. 59-A); adicional noturno 20% e hora de 52min30s (art. 73); adicionais na base das férias (art. 142, § 5º); HE habituais no aviso indenizado (art. 487, § 5º) | CLT, texto da Câmara | oficial |
| DSR com as horas extras habituais; mensalista já tem o repouso no salário; falta injustificada tira o DSR; motivos justificados | Lei 605/1949, arts. 6º e 7º (Planalto) | oficial |
| Remuneração do repouso com as HE habituais; trabalho no repouso em dobro salvo folga | Decreto 10.854/2021, arts. 154 e 157 | oficial |
| Súmulas 45, 63, 146, 172, 264, 347 | TST, Res. 121/2003 | oficial |
| Súmulas 366 (minutos) e 376 (limite de 2 h) | TST, Res. 129/2005 | oficial |
| Súmula 431 (divisor 200) | TST, Res. 185/2012 | oficial |
| Divisor = horas semanais ÷ 6 × 30 (220, 180); sábado não muda o divisor; não multiplicar por 5 | TST, IRR-849-83.2013.5.03.0138 (Informativo 149) | oficial |
| OJ 394 nova: DSR das HE reflete em férias, 13º, aviso e FGTS para horas desde 20/03/2023 | TST, ata do Pleno de 20/03/2023; Informativo 269 | oficial |
| OJ 97: adicional noturno na base da HE noturna | ementa do TST no DJ de 14/11/2007 que aplica a OJ | oficial (decisão, não a publicação da OJ) |
| Conta do DSR (HE ÷ dias úteis × repousos) | ementa citada no acórdão do TST Pleno RRAg 0000279-22.2023.5.05.0161 (2025) | oficial (jurisprudência, não norma) |
| Doméstico: 22h–5h, 52min30s, 20%; divisor 220 | LC 150/2015, arts. 2º e 14 | oficial |
| Rural: 25%, 21h–5h lavoura, 20h–4h pecuária, sem hora reduzida na lei | Lei 5.889/1973, art. 7º | oficial |
| HE é rendimento do trabalho (IR) | Receita, P&R IRPF 2026, pergunta 186 | oficial |
| Tabelas de INSS e IR de 2026 | `src/lib/tributos/parametros-2026.ts` | oficial |

## Motor, fórmulas e testes

- Hora normal = (salário + adicionais fixos) ÷ divisor. Divisor sugerido pela
  jornada: horas semanais ÷ 6 × 30 (44 → 220, 40 → 200, 36 → 180 com fonte; 42 →
  210 e 30 → 150 só pela conta, com aviso). "Outro divisor" aceita o da
  convenção.
- Linha = base × horas × (1 + adicional) [× (1 + adicional noturno) × 60/52,5
  se noturna urbana ou doméstica], exata em BigInt e arredondada ao centavo no
  fim. Domingo/feriado sem folga = 100%; com folga, fica fora.
- DSR = HE ÷ dias úteis × (domingos + feriados), só com HE habituais. Domingos
  contados pelo mês; feriados informados pela pessoa.
- Reflexos por mês (não somados ao total): 13º = base ÷ 12; férias + 1/3 =
  base ÷ 12 × 4/3; FGTS = 8%. Base = HE + DSR desde 04/2023; antes, só HE;
  março de 2023 usa a regra antiga, com aviso.
- Simulador: `compararSalarios` (INSS e IR de 2026) com e sem as HE + DSR.
- Conferência do holerite: compara HE (e o DSR, se informado); tolerância de
  R$ 1,00; com uma só faixa de adicional, calcula o divisor que explicaria o
  valor pago e cita o mais próximo (150, 180, 200, 210, 220, 240). Nunca diz
  que o pagamento é ilegal; lista motivos comuns e quando procurar orientação.
- Testes: `tests/horas-extras.test.mjs` (27) contra
  `tests/referencia/horas_extras.py` (18 casos, frações exatas, escrito à
  parte), mais leitura de minutos, divisores, dias do mês, OJ 394, conferência,
  erros e valores extremos. Interface testada com Playwright: três modos,
  minutos, folga, noturna urbana e rural, divisores, holerite, axe sem
  violações com o resultado aberto, sem rolagem em 320 px, resumo copiado e os
  7 eventos do GA.

## Pendente

- **Divisor para 42 horas (EC 141):** sem texto oficial; a calculadora sugere
  210 com aviso. Revisar quando houver regulamentação ou súmula.
- **Embargos da OJ 394 (22/05/2023):** acolhidos em parte "nos termos da
  fundamentação"; a ata não diz o que mudou. Sem texto oficial diferente.
- **OJ 97:** confirmada por decisões do TST; a publicação da própria OJ não
  abriu (tst.jus.br bloqueado).
- **Feriados automáticos:** a pessoa informa a quantidade; um calendário de
  feriados nacionais por ano pode entrar depois, com fonte.

## Decisões

- **Título** "Calculadora de Horas Extras 2026: 50%, 100% e DSR" (49) e **H1**
  do prompt, em caixa de frase como as outras calculadoras.
- **Descrição** (145): a do prompt foi ajustada para começar pela busca
  ("Calculadora de horas extras 2026"), como manda o CLAUDE.md e como foi feito
  na de férias; mantém 50%, 100%, adicional noturno, DSR e holerite, e soma
  "com minutos" (1º termo do autocompletar).
- **Três modos** num só formulário: rápido (salário, jornada, horas,
  adicional, DSR), completo (+ adicionais fixos, domingos e feriados com
  folga, noturnas com regime e adicional da convenção) e conferir holerite
  (completo + valores pagos).
- **Reflexos separados** do total, com a frase "não é dinheiro a receber
  agora".
- **Sem salvar nada**: os dados ficam só na tela (privacidade do salário).
- **GA4** (`src/lib/analitico.ts`): `horas_extras_calculadora_view`,
  `_calculo_realizado` (modo), `_modo_completo`, `_conferencia_holerite`,
  `_comparacao_realizada`, `_compartilhamento` (canal), `_link_relacionado`
  (destino). Nenhum valor, hora ou dado do holerite vai nos parâmetros. O
  `Compartilhar` ganhou o retorno opcional `aoCompartilhar`, sem mudar as
  outras calculadoras.
- **Fora da ferramenta (com aviso na página):** comissionistas (Súmula 340),
  bancários (Súmula 124), tempo parcial (art. 58-A), petroleiros e escalas
  especiais, banco de horas (link para o artigo).
- **AdSense:** `site.adsense` vazio; quando entrar, nenhum anúncio dentro da
  ferramenta, entre o lead e ela ou entre o resultado e o "Como chegamos".
- **Links:** daqui para o artigo de hora extra, feriado, 6x1, férias, 13º,
  rescisão e IR; do artigo de hora extra para cá (seção "Como calcular").

## Para medir

A partir de ~5/11/2026: "calculadora de horas extras", "calculadora de horas
extras 2026", "calculadora de horas extras com minutos", "calculadora de
horas extras com dsr", "como calcular hora extra com minutos", "quanto vale 30
minutos de hora extra", "dsr sobre horas extras", "dsr sobre horas extras como
calcular". Revisar em 16/12/2026 (42 horas) e na tabela de INSS e IR de 2027.

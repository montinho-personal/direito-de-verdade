# Calculadora: férias 2026 (`/calculadoras/ferias`)

Publicada em 21/10/2026 (horário de Brasília), a pedido do Renato ("Prompt
mestre — Calculadora de férias 2026"). Usa a ferramenta `calculadora-ferias`, a
mesma do artigo [como calcular férias](../artigos/como-calcular-ferias.md), que
ganhou situação (férias ou saída), período aquisitivo e concessivo, dobra,
comparador 30 x 20 + 10, aviso de início vedado e "refazer".

## Por que existe

"Calculadora de férias" é busca de quem quer a conta pronta, com pico de
novembro a janeiro (férias coletivas). A página própria estava na pauta desde
20/10.

## Prints recebidos

Recebidos em 20/10/2026, em `docs/calculadoras/prints/ferias/` (detalhe na
tabela do [doc do artigo](../artigos/como-calcular-ferias.md)).

| print | conteúdo | onde entrou |
|---|---|---|
| 01 autocompletar `calculadora de férias` | proporcionais; 2026; proporcionais na rescisão; online; com adicional noturno; vencidas; cálculo exato; clt | "2026" no título; situação "Estou saindo da empresa" e H2 das proporcionais e vencidas; H2 das médias (adicional noturno); FAQ do "valor exato" (estimativa, sem prometer exatidão) |
| 02 visão geral de IA | Mobills e iDinheiro; integrais; fracionadas (14 + 5); abono "isento de INSS e IRRF" | H2 do fracionamento; tabela de incidência corrige o "isento de IRRF" do 1/3 do abono (Cosit 209/2021) |
| 03 resultados e PAA | valor líquido com 1/3 e abono; quem recebe R$ 2.000 / R$ 3.500 / R$ 1.800 | tabela por salário; FAQ dos R$ 2.000 |
| 04 outras pesquisas | proporcionais; cálculo exato; grátis; 2026; vendendo 10 dias; vencidas | "grátis" na descrição; H2 da venda com comparação |

Título, H1 e descrição seguem a sugestão do Renato no prompt; a descrição foi
ajustada para começar pela busca ("Calculadora de férias 2026"), como manda o
CLAUDE.md.

## Regras e fontes

| regra | fonte | tipo |
|---|---|---|
| Dias pelas faltas; faltas não descontam das férias | CLT, art. 130 | oficial |
| Faltas que não contam; perda do direito | CLT, arts. 131 e 133 | oficial |
| Concessão nos 12 meses seguintes; até 3 períodos (14 e 5); início vedado nos 2 dias antes de feriado ou repouso | CLT, art. 134 | oficial |
| Aviso por escrito 30 dias antes | CLT, art. 135 | oficial |
| Dobra fora do prazo | CLT, art. 137; Súmula 81 do TST (dias gozados depois do prazo) | oficial |
| Atraso no pagamento não gera dobra (Súmula 450 inconstitucional) | STF, ADPF 501 (5/8/2022), citado em acórdão do TRT-9 (PDF baixado em 21/10/2026); notícias Machado Meyer, Lex/TRT-18 | oficial + veículos |
| Coletivas e menos de 12 meses | CLT, arts. 139 e 140 | oficial |
| Remuneração e médias | CLT, art. 142 | oficial |
| Abono de 1/3, pedido 15 dias antes do fim do aquisitivo | CLT, art. 143 | oficial |
| Pagamento 2 dias antes | CLT, art. 145 | oficial |
| Rescisão: vencidas e proporcionais (1/12, fração > 14 dias); sem proporcionais na justa causa | CLT, arts. 146 e 147 | oficial |
| 1/3 | CF, art. 7º, XVII | oficial |
| INSS: abono, férias indenizadas e dobra fora do salário de contribuição | Lei 8.212, art. 28, § 9º, "d" e "e", 6 | oficial |
| IR: férias + 1/3 em separado; abono não tributado | Receita, P&R IRPF 2026, pergunta 178 | oficial |
| IR: 1/3 do abono tributado no curso do contrato | Solução de Consulta Cosit 209/2021 (2 veículos; texto da Receita não abriu) | 2 veículos |
| Redução de 2026 | Lei 9.250, art. 3º-A | oficial |
| Tabelas de INSS e IR | `src/lib/tributos/parametros-2026.ts` | oficial |

## Motor

`src/lib/trabalhista/ferias.ts`, em centavos, cada etapa arredondada ao
centavo (meio centavo para cima).

- Férias = remuneração ÷ 30 × dias de descanso; 1/3 = férias ÷ 3.
- Abono = remuneração ÷ 30 × dias vendidos (até 1/3 do direito); 1/3 do abono.
- INSS sobre férias + 1/3; IR sobre férias + 1/3 + 1/3 do abono, com
  dependentes, pensão e o desconto simplificado quando maior.
- Períodos (com admissão): aquisitivo n = do aniversário n−1 à véspera do n;
  concessivo até a véspera do aniversário n+1; pedido do abono até 15 dias
  antes do fim do aquisitivo. Admissão em 29/02: aniversário em 28/02 nos
  anos comuns (mesma regra da rescisão).
- Início antes de completar o 1º período: erro (só coletivas).
- Dobra: dias gozados depois do concessivo × remuneração ÷ 30, mais 1/3;
  mostrada à parte, fora do líquido.
- Início na sexta ou no sábado: aviso (para quem folga no domingo).
- Comparador (`compararVenda`): mesmo período de direito; bruto integral
  (férias + 1/3) contra bruto vendendo (férias + 1/3 + abono + 1/3 do abono +
  salário dos dias trabalhados, pela mesma remuneração).

## Testes

`npm test` (120 testes no total). Para as férias:

- 37 situações conferidas com a conta de referência em Python
  (`tests/referencia/ferias.py`, escrita à parte, direto da CLT e das regras
  da Receita): 30 dias de R$ 1.621 a R$ 10.000; venda de 5 e 10 dias;
  fracionadas; faltas; médias; dependentes; pensão; 13º junto; datas; período
  dentro e fora do prazo; início no último dia do prazo; 30 dias começando 10
  dias antes do fim do prazo; admissão em 29/02; início na sexta e no sábado.
- Valores conferidos à mão (R$ 3.000; venda de 10; 1/3 de R$ 1.600).
- Faltas (art. 130), soma do recibo ao centavo, entradas inválidas (salário
  zero, faltas acima de 32, venda acima de 1/3, divisões proibidas, datas
  impossíveis), períodos (antes de 12 meses, período incompleto), comparador
  e valores extremos (R$ 0,01 a R$ 9.999.999,99, negativo, NaN).
- Interface (Playwright, 320, 390 e 1280 px): fluxo completo, axe WCAG 2.2 AA
  sem violações, sem rolagem horizontal, sem erros no console.

A conta de referência foi escrita por nós: ela confere a implementação, mas
não substitui um recibo real. Comparar com recibos de folha quando o Renato
tiver algum.

## Limitações

- Horistas, comissionados puros, doméstico com regras próprias, servidor
  público e convenções coletivas com regras próprias.
- Imposto sobre a dobra (IN 1.500/2014 e Solução de Divergência 1/2009 só em
  veículos): dobra fora do líquido.
- Feriados não são conhecidos: o aviso de início vedado cobre só sexta e
  sábado para quem folga no domingo.
- O valor que cai no holerite seguinte não é estimado (depende do calendário
  e da folha).
- Dados não são guardados entre visitas: decisão de privacidade (salário).

## AdSense

`site.adsense` está vazio: não há anúncios hoje. Quando entrarem, nada dentro
da calculadora: no máximo um bloco depois de "Continue entendendo seus
direitos" ou entre H2s do texto, com altura reservada para não deslocar o
layout e longe dos botões. Os anúncios automáticos precisam excluir a
`#calculadora-de-ferias`.

## Para medir

A partir de 22/10/2026: `calculadora de férias`, `calculadora de férias 2026`,
`calcular férias`, `calculadora de férias vendendo 10 dias`, `calculadora de
férias com adicional noturno`.

## Revisão anual

Em janeiro de 2027: tabelas de INSS e IR (parametros), exemplos e tabela por
salário, salário mínimo, data da revisão no rodapé da ferramenta e no texto.

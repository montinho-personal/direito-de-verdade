# Auditoria diária das ferramentas

Pedido do Renato em 26/11/2026: rotina diária, **2 ferramentas por dia**, com especialistas de
cada área. Roteiro de cada ferramenta (o mesmo da regra "Testar tudo" do CLAUDE.md, mais a
conferência das contas):

1. Abrir o site no navegador (build de produção, `npx next start -p 3100`, Chromium).
2. Testar botões e funcionalidades: todos os campos, opções, botões, limpar, mudar de modo,
   valores extremos (zero, vazio, muito alto, centavos, datas na virada de mês e de ano).
3. Verificar a versão mobile (390 px): sem rolagem lateral, campos e resultado legíveis,
   teclado numérico onde couber, acessibilidade (axe) sem falha grave.
4. Executar os testes automatizados: `npm test`, `npm run lint`,
   `node scripts/verificar-site.mjs <páginas onde a ferramenta aparece>`.
5. **Verificar se as contas estão 100% corretas:** pelo menos 5 casos calculados à mão pelo
   especialista, a partir da lei e das tabelas oficiais do ano (não a partir do código), e
   comparados com o que a ferramenta mostra na tela, centavo por centavo. Incluir casos de
   borda (faixa da tabela, teto, piso, arredondamento, proporcional de 1/12, mês de 31 dias).
6. Identificar os erros e corrigi-los: cada erro de conta vira **teste novo** em
   `tests/<ferramenta>.test.mjs` antes da correção (o teste falha, a correção faz passar).
   Texto errado na página (regra, exemplo, valor) é corrigido com a fonte oficial e sobe o
   `atualizadoEm` da página.
7. Repetir os testes depois das correções, até tudo passar. Só então publicar no `main` e
   conferir no ar.

## Os especialistas (subagentes, um por área)

Cada ferramenta é auditada por **dois especialistas independentes**, que não veem as
conclusões um do outro, e eu confiro cada achado antes de mexer em qualquer coisa:

| especialista | ferramentas |
| --- | --- |
| **Perito contábil trabalhista** (cálculos de rescisão e folha, CLT, súmulas do TST) | rescisão, 13º, férias, FGTS, horas extras, seguro-desemprego, acordo, pedido de demissão, conferir TRCT, comparadores de rescisão e de 13º, conferir 13º |
| **Especialista tributário** (IRPF, INSS, tabelas da Receita, tributação de importação) | IR do salário, conferir holerite, comparador de salário, compra internacional |
| **Especialista previdenciário** (Lei 8.213, Decreto 3.048, portarias do INSS) | auxílio-doença |
| **Especialista em direito do consumidor e matemática financeira** (CDC, Lei do Inquilinato, juros, correção, Banco Central) | cobrança indevida, juros abusivos, aluguel atrasado, multa de aluguel, simulador de compras online, simulador de voo (com a Resolução ANAC 400) |
| **Engenheiro de qualidade (QA)**, em todas | navegador, celular, acessibilidade, campos e botões, valores extremos, código da ferramenta |

Regra de fato continua valendo: a conta do especialista tem de citar a fonte oficial (lei,
tabela, portaria, súmula). Divergência entre especialista e ferramenta sem fonte que decida
não vira correção: vira "Pendente" no doc da calculadora e aviso ao Renato.

## Fila (2 por dia, na ordem; ao fim, recomeça do 1)

| ordem | ferramenta | onde aparece (testar em todas) | especialista | última auditoria |
| --- | --- | --- | --- | --- |
| 1 | calculadora-rescisao | /calculadoras/rescisao, /artigos/demissao-sem-justa-causa, /artigos/rescisao-indireta e mais 3 | trabalhista | — |
| 2 | calculadora-13-salario | /calculadoras/13-salario, /artigos/13-salario | trabalhista | — |
| 3 | calculadora-ir-salario | /calculadoras/imposto-de-renda, /artigos/isencao-imposto-de-renda-5-mil e mais 1 | tributário | — |
| 4 | calculadora-ferias | /calculadoras/ferias, /artigos/como-calcular-ferias, /artigos/faltas-justificadas | trabalhista | — |
| 5 | calculadora-fgts | /calculadoras/fgts e mais 4 artigos | trabalhista | — |
| 6 | calculadora-seguro-desemprego | /calculadoras/seguro-desemprego, /artigos/seguro-desemprego-2026 | trabalhista | — |
| 7 | calculadora-horas-extras | /calculadoras/horas-extras, /artigos/adicional-noturno e mais 2 | trabalhista | — |
| 8 | calculadora-auxilio-doenca | /calculadoras/auxilio-doenca | previdenciário | — |
| 9 | calculadora-acordo-de-demissao | /artigos/acordo-de-demissao | trabalhista | — |
| 10 | calculadora-pedido-de-demissao | /artigos/pedido-de-demissao | trabalhista | — |
| 11 | conferir-trct | /calculadoras/rescisao | trabalhista | — |
| 12 | comparador-de-rescisao | /calculadoras/rescisao | trabalhista | — |
| 13 | conferir-13 | /calculadoras/13-salario | trabalhista | — |
| 14 | comparador-13 | /calculadoras/13-salario | trabalhista | — |
| 15 | conferir-holerite | /calculadoras/imposto-de-renda | tributário | — |
| 16 | comparador-de-salario | /calculadoras/imposto-de-renda | tributário | — |
| 17 | calculadora-compra-internacional | /calculadoras/taxa-de-importacao, /artigos/taxa-compras-internacionais | tributário | — |
| 18 | calculadora-juros-abusivos | /calculadoras/juros-abusivos, /artigos/superendividamento e mais 1 | consumidor e financeira | — |
| 19 | calculadora-cobranca-indevida | /calculadoras/cobranca-indevida e mais 6 | consumidor e financeira | — |
| 20 | calculadora-aluguel-atrasado | /calculadoras/aluguel-atrasado | consumidor e financeira | — |
| 21 | calculadora-multa-aluguel | /calculadoras/multa-rescisao-aluguel, /artigos/despejo-por-falta-de-pagamento e mais 1 | consumidor e financeira | — |
| 22 | simulador-compras-online | /calculadoras/simulador-direitos-compras-online, /artigos/procon-barueri e mais 1 | consumidor | — |
| 23 | simulador-voo | /calculadoras/simulador-direitos-voo-atrasado-cancelado | consumidor | — |

A lista completa de páginas de cada ferramenta sai de
`grep -rl "<!-- ferramenta: NOME -->" content`. Ferramenta nova entra no fim da fila.

## Registro

| data | ferramenta | casos conferidos | erros achados | corrigido em |
| --- | --- | --- | --- | --- |

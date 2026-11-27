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
| 1 | calculadora-rescisao | /calculadoras/rescisao, /artigos/demissao-sem-justa-causa, /artigos/rescisao-indireta e mais 3 | trabalhista | 26/11/2026 |
| 2 | calculadora-13-salario | /calculadoras/13-salario, /artigos/13-salario | trabalhista | 26/11/2026 |
| 3 | calculadora-ir-salario | /calculadoras/imposto-de-renda, /artigos/isencao-imposto-de-renda-5-mil e mais 1 | tributário | 27/11/2026 |
| 4 | calculadora-ferias | /calculadoras/ferias, /artigos/como-calcular-ferias, /artigos/faltas-justificadas | trabalhista | 27/11/2026 |
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
| 26/11/2026 | calculadora-rescisao | perito trabalhista: 11 casos à mão (sem justa causa com Lei 12.506, pedido, justa causa com férias em dobro, acordo, teto do INSS e IR alto, dia 14 x 15, exemplo da página e do artigo), todos batem centavo a centavo; tabelas de INSS e IRRF 2026 conferidas no gov.br. QA: 6 páginas, computador e celular, valores extremos | **contas: nenhum erro.** Uso: campo escondido (FGTS, saldo, dias de aviso) bloqueava o resultado sem mensagem; comparador ignorava o FGTS informado no pedido e na justa causa; data impossível sem aviso; ano 0020 virava 1920; admissão no futuro aceita; número grande vazava no celular estreito; TRCT dizia "conferem" com campo inválido; "1621," piscava erro; mensagem de dias e de anos; linha "Descontos R$ 0,00"; texto do IR ("isenção" acima de R$ 7.350); exemplo do artigo ("saldo" do FGTS) | 8a9d17b e o commit seguinte |
| 26/11/2026 | calculadora-13-salario | perito trabalhista: 17 casos à mão (ano todo, admissão 14/02 x 15/02, faltas, mínimo, faixas e teto, dependentes, média, limite de R$ 5.000,01, saída no ano, reajuste, variáveis mês a mês); tabelas e exemplos da página e do artigo conferidos. QA: 2 páginas, computador e celular | **conta: 1ª parcela com variáveis mês a mês usava a média até novembro em vez da média até o mês anterior ao pagamento** (art. 78, § 1º; R$ 1.636,37 → R$ 1.750,00 com a 1ª em julho; o total não muda); a referência em Python tinha o mesmo erro e foi corrigida. Uso: reajuste desfeito sumia com o resultado; memória contraditória na saída no ano; "sai da 2ª parcela" na rescisão; 1ª parcela informada maior que o 13º sem alerta; "− R$ 0,00" em vez de "Isento"; comparador com salário menor falava em "aumento"; caixa de seleção pequena no celular | 8a9d17b e o commit seguinte |
| 27/11/2026 | calculadora-ir-salario | especialista tributário: 32 casos à mão (bordas de todas as faixas do INSS e do IRRF, R$ 5.000 / 5.000,01, R$ 7.350 / 7.350,01, simplificado x deduções, dependentes, pensão com redução limitada, teto), todos batem; tabelas de 2026 conferidas no gov.br e na Receita; exemplos dos dois textos conferidos. QA: 3 páginas, 1280, 390 e 320 px | **contas: nenhum erro.** Uso: campo escondido apagava o resultado sem mensagem; pensão maior que o salário dava líquido negativo; "− R$ 0,00" em vez de "Isento"; "Resumo copiado" ficava velho (todas as calculadoras); "(0%)" nos percentuais; memória do INSS somava 1 centavo a mais que o total; fórmula da redução escrita com resultado errado quando limitada (art. 3º-A, § 1º); faixa "de R$ 1.621,00"; tabela do conferir-holerite cortada no celular; doc com contagem errada de casos de 1 centavo; texto do artigo ("não tem desconto") | commit desta auditoria |
| 27/11/2026 | calculadora-ferias | perito trabalhista: 29 casos à mão (30 dias, abono, faixas de faltas do art. 130, mínimo, bordas da redução, média, fracionamento, datas, dobra), todos batem; CLT, Lei 810/1949, Lei 4.749/1965 e tabelas de 2026 lidas. QA: 3 páginas, 1280, 390 e 320 px | **regra: admissão em 29/02 usava o dia 28 como aniversário** (Lei 810/1949, art. 3º manda o primeiro dia seguinte; prazo de concessão 27/02 → 28/02, dobra de 3 → 2 dias no caso testado); referência em Python corrigida. **Texto: o artigo dizia que vender 10 dias dá R$ 1.333,33 a mais no recibo** (o recibo bruto é o mesmo; o ganho é R$ 1.000 de salário dos dias trabalhados). Uso: campo escondido; líquido negativo com pensão alta; resumo sem pensão e sem dobra; admissão depois do início com mensagem errada; contrato de mais de 60 anos; aviso da 1ª parcela do 13º em dezembro e das tabelas de 2027; prazo da venda sempre no passado; "Isento" | commit desta auditoria |


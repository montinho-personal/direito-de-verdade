# Calculadora: rescisão trabalhista 2026 (`/calculadoras/rescisao`)

Escrita e publicada em 19/10/2026, a partir dos prints do Renato. Usa a
ferramenta `calculadora-rescisao` (a mesma do artigo da demissão sem justa
causa), que ganhou o campo "motivo da saída".

## Por que existe

"Calculadora rescisão" é busca de quem quer a conta pronta. A visão geral
de IA manda informar o motivo da saída (sem justa causa, pedido, acordo,
justa causa, experiência): a calculadora passou a cobrir os quatro
primeiros.

## Prints recebidos

Recebidos em 19/10/2026 (celular, 15h37). Prints em
`docs/calculadoras/prints/rescisao/`. Não vieram PAA nem "Outras pessoas
pesquisaram" ("Só tem esses", disse o Renato); as perguntas vêm do artigo
da demissão e do autocompletar.

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `calculadora rescisão` | clt; trabalhista; 2026; de contrato; clt 2026; idinheiro; de contrato temporário; sem carteira assinada; experiência; com fgts e multa | "CLT 2026" e "FGTS e multa de 40%" no título; "trabalhista" no H1 e na descrição; H2 de FGTS e multa, de experiência e de temporário/sem carteira. "idinheiro" é navegação |
| Visão geral de IA | informar datas, remuneração e variáveis, motivo do desligamento (sem justa causa, pedido, acordo do art. 484-A, justa causa, fim da experiência), férias e 13º; cita Carmelitas e RescisãoIA | campo "motivo da saída" na calculadora; H2 do que informar; tabela por tipo de rescisão |

## Fontes confirmadas

As do [artigo da demissão](../artigos/demissao-sem-justa-causa.md), mais o
art. 484-A da CLT (acordo: metade do aviso indenizado e da multa, demais
verbas inteiras, saque de até 80%, sem seguro-desemprego), lido no texto
atualizado da Câmara. Justa causa: só saldo de salário e férias vencidas
com 1/3 (art. 146, caput e parágrafo único; Lei 4.090, art. 3º; Súmula 171).
Pedido de demissão: 13º e férias proporcionais (Súmula 261), sem aviso
indenizado, multa, saque nem seguro. Exemplos: cálculo próprio com
o motor `src/lib/trabalhista/rescisao.ts`.

## Pendente

- **Projeção do aviso no acordo:** fontes divergem; a calculadora não
  projeta e o texto diz isso.
- **Contrato temporário (Lei 6.019/1974):** regras não pesquisadas; só a
  menção.

## Decisões

- **Título** "Calculadora rescisão CLT 2026: com FGTS e multa de 40%":
  junta "clt", "2026" e "com fgts e multa" do autocompletar.
- **Tabela comparando os 4 motivos** com valores do mesmo exemplo.
- **FAQ com 4**: prazo, aviso trabalhado ou indenizado, aviso no pedido,
  seguro no acordo.
- **Links:** para o artigo da demissão e a calculadora de IR; o artigo da
  demissão linka para cá.

## Para medir

A partir de ~10/11 e no pico de dezembro e janeiro: "calculadora rescisão",
"calculadora rescisão clt 2026", "calculadora rescisão trabalhista",
"calculadora rescisão com fgts e multa", "calculadora rescisão acordo".

## Auditoria e evolução (19/10/2026)

Pedido do Renato: auditar e evoluir a calculadora, com a conferência do TRCT
como prioridade, e só publicar depois dos testes.

### O que a auditoria achou

| problema | gravidade | evidência | correção |
|---|---|---|---|
| A projeção do aviso que completava um período de férias apagava os 12/12 daquele período | crítica | admissão 01/02/2023, saída 20/01/2026: a conta antiga recomeçava o período no aniversário dentro da projeção e pagava 1/12 em vez de 12/12 + 1/12 | avos contados desde o início do período em curso até o fim projetado (podem passar de 12) |
| Saldo de salário errado para quem entrou no mesmo mês da saída | alta | admissão 15/10, saída 20/10: pagava 20 dias em vez de 6 | dias contados desde a admissão |
| Pedido de demissão sem cumprir o aviso: nenhum desconto | alta | CLT, art. 487, § 2º | opções cumprido, em parte, não cumprido e dispensado; desconto até um mês de remuneração (art. 477, § 5º) |
| 1ª parcela do 13º já paga não era descontada | alta | saídas depois do pagamento da 1ª parcela | campo no cálculo detalhado |
| Férias vencidas nunca em dobro; só 0 ou 1 período | alta | CLT, arts. 134, 137 e 146 | até 2 períodos; dobra automática quando o prazo de concessão acabou antes da saída, com o terço sobre a dobra (Súmula 328) |
| Multa do FGTS sobre "saldo do extrato" | alta | a base legal são os depósitos do contrato com correção, mesmo os sacados (Lei 8.036, art. 18, § 1º), sem a distribuição de resultado (art. 13, § 7º) | campo "FGTS para fins rescisórios", com explicação; sem ele, estimativa identificada |
| Sem média de variáveis, adiantamentos e outros descontos | média | — | cálculo detalhado |
| Sem prazo de pagamento | média | CLT, art. 477, § 6º | data-limite no resultado e na memória |
| Contas em reais com ponto flutuante | baixa | — | motor em centavos inteiros |

Conferido e mantido: aviso 30 + 3 por ano até 90; projeção do aviso
indenizado na demissão sem justa causa (art. 487, § 1º; Súmula 371), contada
do dia seguinte (Súmula 380); 13º com 15 dias; férias com fração acima de 14
dias; Súmulas 171 e 261; sem INSS e IR no aviso indenizado e nas férias
indenizadas; FGTS de 8% sobre saldo, aviso e 13º (Súmula 305); acordo do art.
484-A (metade do aviso e da multa, saque de até 80%, sem seguro, § 2º).

### Pontos controversos (sinalizados na página)

- Projeção do aviso no acordo: a conta não projeta.
- Aviso proporcional no pedido de demissão: a conta usa 30 dias.
- Dias de aviso acima de 30 em aviso trabalhado: a conta trata como cumprido.
- Início do prazo de 10 dias no aviso indenizado: a conta usa a data da
  comunicação. A OJ 162 da SDI-1 (contagem do prazo) não pôde ser conferida:
  o site do TST bloqueia acesso automático.
- INSS do empregado sobre o 13º da projeção: a conta desconta, como regra
  geral do 13º (pendente desde o artigo da demissão).

### O que mudou

- Motor novo em `src/lib/trabalhista/`: `datas.ts` (datas em UTC, bissextos,
  soma de meses), `parametros.ts` (regras e data da revisão) e `rescisao.ts`
  (verbas, descontos, FGTS, prazo, validação). Usa o motor de INSS e IR de
  `src/lib/tributos`. O `src/lib/rescisao.ts` antigo saiu.
- Interface (`calculadora-rescisao.tsx`): resultado "Quanto você deve receber
  de rescisão?", FGTS separado do pagamento da empresa, seguro-desemprego como
  direito à parte, memória de cálculo por verba (quantidade, fórmula,
  explicação), etiquetas de informado e estimado, copiar, WhatsApp e imprimir.
- `conferir-trct.tsx`: compara 6 linhas do termo com a estimativa; diferença
  acima de R$ 1 é destacada com causas comuns, sem afirmar erro da empresa.
- `comparador-de-rescisao.tsx`: os 4 tipos de saída com os mesmos dados,
  com aviso de que é hipotético.
- As três ferramentas usam os mesmos dados digitados
  (`src/components/rescisao/formulario.ts`), só na memória do navegador.

### Testes

`npm test`: 18 situações conferidas com uma conta de referência escrita à
parte em Python (`tests/referencia/rescisao.py`), mais testes de valores
conferidos à mão, férias em dobro, FGTS (estimativa, saque-aniversário, saque
por modalidade), desconto maior que as verbas, entradas inválidas e datas.
No navegador: valores, TRCT, comparador, erros, 320/390/1280 px e
acessibilidade (axe, WCAG 2.2 AA) em todas as páginas.

### Fora da conta

Contrato de experiência e prazo determinado, rescisão indireta, culpa
recíproca, falecimento, estabilidades, convenção coletiva e faltas (que reduzem
os dias de férias, art. 130).

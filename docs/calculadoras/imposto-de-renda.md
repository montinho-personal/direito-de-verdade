# Calculadora: imposto de renda 2026 do salário (`/calculadoras/imposto-de-renda`)

Escrita e publicada em 19/10/2026, a partir dos prints do Renato. Usa a
mesma ferramenta (`calculadora-ir-salario`) do artigo da isenção de R$ 5 mil.

## Por que existe

"Calculadora imposto de renda 2026" e "calcular imposto de renda salário"
são buscas de quem quer a conta pronta, diferentes de "isenção imposto de
renda 5 mil" (o artigo). Os resultados são calculadoras (Contec, DIEESE,
Brasilprev, Receita).

## Prints recebidos

Duas buscas pedidas ao Renato em 19/10/2026, recebidas às 15h08. Prints em
`docs/calculadoras/prints/imposto-de-renda/` (os da segunda busca começam
com `calcular-salario-`).

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `calculadora imposto de renda 2026` | g1; receita federal; mensal; autonomo; aluguel; anual; salario; clt | "salário mensal e CLT" no título; H2 de autônomo, aluguel e anual. "g1" e "receita federal" são navegação |
| Visão geral de IA (1ª busca) | indica o simulador de alíquotas efetivas da Receita e a calculadora do Contábeis; regras da Lei 15.270 | passo 4 do cálculo. Não é fonte |
| PAA e resultados (1ª busca) | Como calcular o IR de 2026? · Quem ganha 7 mil paga quanto? · Quem ganha R$ 8.000 paga quanto? · Simulador de restituição 2026? Resultado: Contec "Calculadora de IRRF 2026: isenção até R$ 5 mil" | H2 do cálculo, H2 de 7 mil e de 8 mil; FAQ da restituição |
| Autocompletar `calcular imposto de renda salário` | salário 2026; desconto imposto de renda salário; como calcular sobre salário 2026/2025; no salário mensal; salário mínimo | H2 "Como calcular o imposto de renda mensal de 2026?"; FAQ do salário mínimo |
| Visão geral de IA (2ª busca) | passo a passo: bruto, INSS, R$ 189,59 por dependente | lista de passos |
| PAA e resultados (2ª busca) | Quem ganha R$ 7.000 paga quanto? · Quem ganha 6.000 paga quanto? · Quem ganha R$ 8.000? · Como calcular o IRPF mensal para 2026? Resultados: DIEESE, Brasilprev | H2 de 6 mil; título do H2 do cálculo com "mensal" |

## Fontes confirmadas

As mesmas do [artigo da isenção](../artigos/isencao-imposto-de-renda-5-mil.md):
tabela mensal de 2026 e exemplos da Receita, art. 3º-A e 11-A da Lei 9.250
atualizada (Câmara), INSS de 2026. Valores dos exemplos: cálculo próprio com
o motor `src/lib/tributos/`; o de R$ 6.000 tem a mesma redução do exemplo 4
da Receita (R$ 179,75), mas o exemplo usa o INSS de 2025.

## Pendente

- **Carnê-leão (autônomo e aluguel):** o texto só diz que é pago pelo
  carnê-leão, sem detalhar deduções; não pesquisado.
- **Link do simulador da Receita** citado pela IA: endereço não conferido.

## Decisões

- **Título** "Calculadora imposto de renda 2026: salário mensal e CLT":
  "mensal", "salário" e "clt" vêm do autocompletar; a descrição traz a
  isenção de R$ 5 mil (gancho do Contec e do DIEESE) e "grátis e sem cadastro".
- **H2 com os valores do PAA** (6, 7 e 8 mil) e tabela de 3 a 8 mil.
- **FAQ com 5 perguntas**: salário mínimo, até R$ 5 mil, dependente,
  restituição, 13º.
- **Links:** daqui para o artigo da isenção e a calculadora do 13º; do
  artigo da isenção para cá.

## Para medir

A partir de ~5/11 e em março de 2027: "calculadora imposto de renda 2026",
"calculadora imposto de renda 2026 mensal", "calcular imposto de renda
salário", "quem ganha 7 mil paga quanto de imposto de renda".

## Auditoria e evolução (19/10/2026)

Pedido do Renato: auditar e evoluir a calculadora sem refazer do zero.

### O que a auditoria achou

| problema | gravidade | evidência | correção |
|---|---|---|---|
| Texto dizia que o caso de R$ 6.000 era "o mesmo cálculo do exemplo oficial da Receita" | média (informação imprecisa) | o exemplo 4 da Receita usa R$ 649,60 de INSS (tabela de 2025) e chega a R$ 382,88; o nosso, com o INSS de 2026, a R$ 385,10 | texto explica a diferença e linka o exemplo |
| R$ 7.000: redução de R$ 46,605 sem regra de arredondamento definida | baixa (1 centavo) | o código antigo arredondava só o imposto final (R$ 754,75); o texto dizia redução de R$ 46,60, que não bate com nenhuma das duas contas | regra única: cada etapa arredondada ao centavo (redução R$ 46,61, imposto R$ 754,74); a página avisa que a folha pode diferir em 1 centavo. Em 235 mil salários testados entre R$ 5.000,01 e R$ 7.350, é o único valor que mudou |
| Pensão alimentícia judicial (dedução legal, Lei 9.250, art. 4º, II) não era aceita | média | campo inexistente | modo avançado com pensão |
| Horas extras e adicionais só entravam somados à mão no salário | baixa | — | campo próprio no modo avançado |
| "6 ou mais" dependentes calculava como 6 | baixa | select com 0–6 | campo numérico até 20 |
| Contas em ponto flutuante (reais com `Math.round(x*100+1e-6)`) | baixa (sem erro encontrado) | — | motor em centavos inteiros, com arredondamento explícito |
| Parâmetros de 2026 espalhados em `decimo-terceiro.ts` | manutenção | — | `src/lib/tributos/parametros-2026.ts`, único lugar com os números |
| Sem testes automatizados | alta para manutenção | — | `npm test` (tests/tributos.test.mjs) |
| Cabeçalho do site passava da tela em celulares de 320px (todas as páginas) | média | scrollWidth 355px em 320px | margem e logo menores só abaixo de 360px |
| Tabelas do texto com rolagem lateral não recebiam foco pelo teclado (WCAG) | média | axe: scrollable-region-focusable | `tabindex="0"` nas tabelas do texto e contorno de foco |

Conferido e correto: tabela do INSS de 2026 (Portaria Interministerial MPS/MF
nº 13/2026), tabela do IRRF, R$ 189,59 por dependente, desconto simplificado de
R$ 607,20 alternativo às deduções (Lei 9.250, art. 4º, § 2º; "substitui todas
as deduções legais", Receita), redução sobre o rendimento e não sobre a base
(art. 3º-A, §§ 1º e 2º, exemplo 5 da Receita).

### O que mudou

- **Motor:** `src/lib/tributos/parametros-2026.ts` (parâmetros por ano, com
  `revisadoEm`, a data da última conferência — só mudar depois de conferir de
  novo) e `src/lib/tributos/calculo.ts` (INSS por faixa, IRRF com memória de
  cálculo, salário líquido, comparação). `decimo-terceiro.ts` virou adaptador:
  13º e rescisão usam o mesmo motor, com resultados idênticos (testado).
- **Leitura dos campos:** `src/lib/dinheiro.ts` (valida e converte para
  centavos; mensagens de erro).
- **Calculadora:** salário líquido em destaque, barra de composição com
  legenda em texto, memória de cálculo em 12 passos, modo avançado fechado
  por padrão, copiar, WhatsApp e imprimir (nada sai da página sem clique).
- **Comparador** (`comparador-de-salario`): aumento em %, em R$ ou novo
  salário, com ganho líquido, diferenças de INSS e IR e quanto do aumento fica.
- **Conferência do holerite** (`conferir-holerite`): informado × estimado ×
  diferença, com causas comuns e sem afirmar erro da empresa.
- **Página:** H3 "Tabela do IRRF 2026", seções do comparador e do holerite,
  "Como calculamos" (regras, revisão, escopo, fora da conta, arredondamento,
  privacidade e aviso), FAQ da pensão (6 perguntas). Uma página pode ter
  várias ferramentas diferentes (cada uma uma vez).

### Testes

`npm test`: 5 exemplos oficiais da Receita, 29 salários (faixas e bordas,
dependentes, pensão, teto do INSS, simplificado × legais) com valores de uma
conta independente em decimal (Python), regras (redução sobre o rendimento,
nunca somar as deduções), comparador e leitura dos campos.

### Fora da conta (limitações declaradas na página)

Férias, previdência complementar (o limite de 12% é anual e a regra mensal não
foi conferida), parcela isenta de aposentados com 65 anos ou mais, pró-labore,
autônomos e mais de uma fonte pagadora.

### AdSense

O AdSense ainda não está ativo (`site.adsense` vazio). Quando ativar: não usar
anúncio dentro das ferramentas (entre campos e resultado ou na memória de
cálculo); com anúncios automáticos, conferir na pré-visualização do AdSense e
excluir áreas que caiam dentro das calculadoras; preferir posições entre seções
do texto, com espaço reservado para não deslocar o layout.

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
`src/lib/decimo-terceiro.ts`; o de R$ 6.000 bate com a redução do exemplo 4
da Receita (R$ 179,75).

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

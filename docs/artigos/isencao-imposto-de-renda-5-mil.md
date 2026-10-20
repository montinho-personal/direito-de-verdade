# Artigo: Isenção do IR até R$ 5 mil (`/artigos/isencao-imposto-de-renda-5-mil`)

Escrito e publicado em 19/10/2026, a partir dos prints do Renato.

## Por que existe

A isenção vale desde janeiro de 2026 e volta ao centro das buscas em dois
momentos: no fim do ano (13º) e de março a maio de 2027, na primeira
declaração com a redução anual. O autocompletar pede "tabela",
"calculadora" e "bruto ou líquido".

## Prints recebidos

Busca pedida ao Renato em 19/10/2026 e recebida no mesmo dia (celular,
14h13). Prints em `docs/artigos/prints/isencao-imposto-de-renda-5-mil/`. Não
veio "Outras pessoas pesquisaram".

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `isenção imposto de renda 5 mil` | tabela; quando começa; bruto ou líquido; como funciona; calculadora; 2026; reais | "tabela 2026" e "calculadora" no título; calculadora no topo; H2 "quando começa", "como funciona" e "bruto ou líquido" |
| Visão geral de IA | em vigor desde janeiro de 2026 (reflexo nos salários de fevereiro); isenção total até R$ 5 mil, incluindo o 13º; redução de R$ 5.000,01 a R$ 7.350; acima disso nada muda; cita Agência Brasil e Câmara | lead e H2 do funcionamento. O "reflexo em fevereiro" foi corrigido: vale pela data do pagamento, desde janeiro (exemplo da Receita com pagamento em 02/01/2026) |
| PAA e resultados | Foi aprovada? · Quando começa? · Como fica a tabela para 2026? · Como fica a tabela com isenção de 5 mil? Resultados: Senado ("Sancionada…", aprovada em 5/11, vale a partir de janeiro de 2026), G1, PDF | um H2 para cada pergunta; as duas de tabela viraram um H2 só |

## Fontes confirmadas

| fato | fonte | tipo |
|---|---|---|
| Art. 3º-A (redução mensal: até R$ 5.000 até R$ 312,89; de R$ 5.000,01 a R$ 7.350, R$ 978,62 − 0,133145 × rendimentos; § 3º vale para o 13º), art. 11-A (anual: até R$ 60.000 até R$ 2.694,15; até R$ 88.200 decrescente, R$ 8.429,73 − 0,095575 × rendimentos), art. 16-A (tributação mínima acima de R$ 600 mil, até 10% a partir de R$ 1,2 milhão), retenção de 10% sobre lucros e dividendos acima de R$ 50 mil/mês da mesma empresa; Lei 15.270 de 26/11/2025, efeitos desde 1º/1/2026 | [Lei 9.250 atualizada (Câmara, PDF)](https://www2.camara.leg.br/legin/fed/lei/1995/lei-9250-26-dezembro-1995-362566-normaatualizada-pl.pdf) | oficial |
| Exemplos: R$ 5.000 → imposto de R$ 312,89 zerado; R$ 6.000 → redução de R$ 179,75; "utiliza-se nessa tabela de redução o valor do salário… e não o da base de cálculo"; salário pago em 02/01/2026 já com a redução (os exemplos usam INSS de 2025) | [Receita, exemplos da Lei 15.270](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025) | oficial |
| Tabela mensal 2026, dependente R$ 189,59, simplificado R$ 607,20 | [Receita, tabelas 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) (ver [doc do 13º](13-salario.md)) | oficial |
| Senado aprovou o PL 1.087/2025 em 5/11/2025 | [Estado de Minas](https://em.com.br/politica/2025/11/7286627-senado-aprova-projeto-de-isencao-do-imposto-de-renda-ate-rs-5-mil.html); [Jornal Opção](https://www.jornalopcao.com.br/ultimas-noticias/senado-aprova-isencao-do-ir-para-renda-ate-r-5-mil-texto-vai-a-sancao-de-lula-763008/) (vistos na busca) | 2 veículos |
| Mais de uma fonte de renda pode ter imposto a pagar na declaração | ver [doc do 13º](13-salario.md) (Bora Investir/B3 e Band) | 2 veículos |

Tabela de exemplos e FAQ: cálculo próprio com o motor `src/lib/tributos/calculo.ts`
(INSS de 2026), conferido com o exemplo da Receita de R$ 6.000 (redução
igual; o imposto muda só porque a Receita usou o INSS de 2025).

## Pendente

- **Quantas pessoas são beneficiadas:** estimativas divergem (15 milhões no
  governo; 25 a 30 milhões em outras fontes). Fora do texto.
- **Notícia do Senado** sobre a sanção: não abriu aqui; a data da lei vem
  da Câmara.

## Decisões

- **Calculadora do imposto do salário no topo** ("calculadora" no
  autocompletar): mostra INSS, desconto usado, imposto pela tabela, redução
  da lei e o líquido. Mesma conta da calculadora do 13º.
- **FAQ com 5 perguntas** (o que fazer, economia de R$ 312,89, 13º, hora
  extra, aposentado).
- **Links internos:** FAQ do 13º para a calculadora do 13º; o artigo do
  13º (seção do imposto de renda) linka para cá.
- **Categoria Trabalho:** o público é quem recebe salário.

## Para medir

A partir de ~5/11 e de novo em março de 2027: "isenção imposto de renda 5
mil", "isenção imposto de renda 5 mil tabela", "quando começa", "bruto ou
líquido", "calculadora", "tabela imposto de renda 2026".

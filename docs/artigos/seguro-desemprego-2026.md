# Artigo: seguro-desemprego 2026 (`/artigos/seguro-desemprego-2026`)

Escrito e publicado em 19/10/2026, a partir dos prints do Renato. Usa a
ferramenta nova `calculadora-seguro-desemprego` (`src/lib/seguro-desemprego.ts`).

## Por que existe

"Seguro-desemprego 2026" é busca perene e alta, que fecha o assunto da
demissão sem justa causa e da rescisão. O pico vem em janeiro, com a tabela nova, e
continua o ano inteiro, puxado pelas demissões.

## Prints recebidos

Recebidos em 19/10/2026 (computador, 17h25). Prints em
`docs/artigos/prints/seguro-desemprego-2026/`. Os de "calculadora
seguro-desemprego" (17h27) ficam para a página da calculadora.

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `seguro-desemprego 2026` | regras; quantas parcelas; valor; teto; quem tem direito; parcelas; cálculo; tabela; valor máximo | "valor", "tabela" e "quantas parcelas" no título; H2 de valor, parcelas, quem tem direito e regra nova; H3 do cálculo e da tabela com exemplos; frase do valor máximo |
| Visão geral de IA | piso R$ 1.621 e teto R$ 2.518,65; INPC 3,90%; tabela de 3 faixas; 3/4/5 parcelas por 6/12/24 meses; carência por pedido; pedido do 7º ao 120º dia por CTPS Digital, gov.br e Sine/158 | tabela oficial; tabela de parcelas completa (a da IA mistura carência e parcelas: com 6 meses não há direito no 1º pedido); seção de como pedir |
| PAA | nova regra 2026; quem tem direito a 7 parcelas; quem tem direito a 5 parcelas; regra hoje | H2 "Teve nova regra..."; H3 de 7 e de 5 parcelas; "quem tem direito" |
| Resultados | G1 (tabela), Carmelitas (calculadora), MTE | o nosso tem o que eles não têm: arredondamento para o real de cima, 7 parcelas e lei de 2026 |

## Fontes confirmadas

| fato | fonte | tipo |
|---|---|---|
| Tabela 2026 (2.222,17 / 3.703,99 / 1.777,74 / 2.518,65; piso 1.621) | Agência Brasil 12/01/2026, citando o MTE; nota da Prefeitura de Ladário (MS) reproduzindo o MTE ("vigência a partir de 11 de janeiro de 2026") | oficial (EBC) |
| Teto anterior R$ 2.424,11 | Agência Brasil | oficial (EBC) |
| INPC 2025 = 3,90% | Agência Brasil/IBGE | oficial |
| Salário mínimo R$ 1.621 | Decreto 12.797/2025 | oficial |
| Média dos 3 meses; piso de 1 salário mínimo | Lei 7.998, art. 5º; Res. Codefat 957, art. 39 (falta de meses: média dos que houver) | oficial |
| O que entra no salário médio | página do MTE (seguro-desemprego formal) | oficial |
| Arredondamento para a unidade inteira de cima | Lei 7.998, art. 4º, § 4º | oficial |
| Parcelas por pedido e meses em 36 meses; fração ≥ 15 dias | Lei 7.998, art. 4º, §§ 2º e 3º | oficial |
| Carência 12/18, 9/12, 6 imediatamente anteriores | Lei 7.998, art. 3º, I | oficial |
| Período aquisitivo de 16 meses | Res. 957, art. 36 | oficial |
| Prorrogação de até 2 parcelas (7) | Lei 7.998, art. 4º, § 5º; Res. 957, arts. 13 e 14; Res. 1.026/2025 (Rio Bonito do Iguaçu); Res. 1.003/2024 (RS) | oficial |
| Prazo 7º ao 120º dia; canais; documento e CPF | gov.br (serviço e FAQ); Res. 957, art. 41 | oficial |
| 1ª parcela 30 dias após o requerimento, depois a cada 30 | Res. 957, art. 12; gov.br | oficial |
| Acordo sem seguro | CLT, art. 484-A, § 2º | oficial |
| PDV sem direito | Res. 957, art. 38 | oficial |
| Renda própria; outros benefícios (exceto auxílio-acidente e pensão por morte) | Lei 7.998, art. 3º; FAQ gov.br; Res. 957, art. 6º | oficial |
| MEI | Lei 7.998, art. 3º, § 4º | oficial |
| Novo emprego suspende; devolução se reempregado nos 30 primeiros dias; retomada | Lei 7.998, art. 7º; Res. 957, arts. 22 e 37 | oficial |
| Isento de IR | Decreto 9.580/2018, art. 35, II, "k" | oficial |
| Doméstico: 1 salário mínimo, até 3 parcelas, 15 meses em 24, prazo de 7 a 90 dias, pedido nas unidades do MTE | LC 150, arts. 26, 28 e 29; página do MTE | oficial |
| Resgatado: 6 parcelas | Lei 15.455, de 01/07/2026 | oficial |

## Pendente

- **Notícia do MTE com a tabela 2026** pede login no gov.br (provável
  restrição eleitoral); a fonte do texto é a Agência Brasil. Trocar o link
  quando a notícia do MTE voltar.
- **Biometria:** portaria conjunta MGI/MDS/MPS nº 23/2026 parece dispensar
  quem pede o seguro até 31/12/2026; a regra para 2027 não foi encontrada.
  Ficou fora do texto; acompanhar.
- **Seguro conta como tempo de contribuição para o INSS?** Sem fonte; fora
  do texto.
- **Boatos de restrição** (ex.: limite para quem ganha mais de 2 salários
  mínimos): fonte única, sem norma; o texto só diz que notícia sem lei não vale.

## Decisões

- **Título** "Seguro-desemprego 2026: valor, tabela e quantas parcelas"
  (56): os três termos que mais aparecem no autocompletar.
- **Descrição** com os dois números da resposta (piso e teto) e "de 3 a 5
  parcelas"; o ganho do clique é "calcule o seu valor exato".
- **Calculadora no meio do H2 de valor**, logo depois da tabela, porque ela
  responde a "cálculo" e "valor".
- **Arredondamento**: a calculadora segue a lei (real inteiro de cima); os
  concorrentes mostram centavos (ex.: 3.000 → 2.166,66; aqui, 2.167).
- **Tabela de parcelas completa** por pedido, corrigindo a simplificação da
  visão geral de IA.
- **FAQ com 5**: pedido de demissão, quando cai, novo emprego, IR, MEI.
- **Links**: para a calculadora de rescisão e o artigo da demissão; o artigo
  da demissão passou a linkar para cá.

## Para medir

A partir de ~10/11 e no pico de janeiro (tabela nova): "seguro-desemprego
2026", "seguro desemprego 2026 valor", "seguro desemprego 2026 tabela",
"seguro desemprego 2026 quantas parcelas", "quem tem direito a 7 parcelas do
seguro", "valor máximo seguro desemprego 2026".

Revisão anual: a tabela muda em janeiro (entra na lista da pauta).

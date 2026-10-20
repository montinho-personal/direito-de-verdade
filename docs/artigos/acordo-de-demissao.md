# Artigo: acordo de demissão (`/artigos/acordo-de-demissao`)

Escrito e publicado em 20/10/2026, a partir dos prints do Renato. Usa a
calculadora de rescisão já com "Acordo com a empresa" escolhido
(`calculadora-acordo-de-demissao`).

## Por que existe

Último tipo de saída sem artigo próprio (já havia demissão sem justa causa,
pedido de demissão, rescisão e seguro-desemprego). Busca do ano todo.

## Prints recebidos

Recebidos em 20/10/2026 (celular, 21h46–21h47). Prints em
`docs/artigos/prints/acordo-de-demissao/`.

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `acordo de demissão o que recebe` | recebe seguro desemprego; clt; cálculo; na rescisão; calculadora online; seguro; fgts | "FGTS", "seguro" e "cálculo" no título; FAQ do seguro; exemplo de cálculo; calculadora |
| Visão geral de IA | metade: aviso indenizado e multa (20%); integral: saldo, férias + 1/3, 13º | tabela do lead; conferido no art. 484-A |
| PAA (1ª busca) | melhor acordo ou ser demitido; o que acontece com os 20% do FGTS; sou obrigada a devolver os 40%; é legal fazer acordo | H2 e H3 de cada pergunta |
| Pesquisas relacionadas | melhor acordo para sair; calculadora de demissão por acordo; carta de demissão por comum acordo; como funciona; artigo 484-A; acordo sem justa causa | modelo de acordo; comparação com a demissão |
| Autocompletar `acordo de demissão fgts` | acordo fgts pedido de demissão; modelo; cálculo; cálculo exato; como funciona | H2 do FGTS; modelo |
| Visão geral de IA (FGTS) | saque de 80%, os 20% ficam retidos; multa de 20%; aviso trabalhado: cumpre-se integral | H2 e H3 do FGTS; aviso trabalhado |
| Autocompletar `acordo de demissão seguro desemprego` | recebe; perde; para receber; clt; como funciona; comum acordo; é possível fazer acordo e receber | H2 "Quem faz acordo de demissão recebe seguro-desemprego?" (saiu da FAQ) |
| Visão geral de IA e PAA (seguro) | não tem direito (art. 484-A, § 2º); PAA: como funciona o seguro no acordo; melhor ser demitido; os 20%; o acordo de 40% é ilegal? | H2 do seguro; H3 "O acordo de 40% é ilegal?" |
| PAA (FGTS) | como fica o FGTS; melhor ser demitido ou acordo; é crime não devolver 40%; o que acontece com os 20% | H3 "É crime não devolver" |

## Fontes confirmadas

Textos atualizados baixados do Planalto em 19/10/2026 (mesmos da auditoria da
rescisão).

| fato | fonte | tipo |
|---|---|---|
| Metade do aviso indenizado e da multa; demais verbas inteiras | CLT, art. 484-A, I e II | oficial |
| Saque de até 80% | CLT, art. 484-A, § 1º; Lei 8.036, art. 20, I-A | oficial |
| Sem seguro-desemprego | CLT, art. 484-A, § 2º | oficial |
| Multa sobre todos os depósitos do contrato, na conta do trabalhador | Lei 8.036, art. 18, § 1º | oficial |
| Fraude no seguro: cancelamento e 2 anos de suspensão | Lei 7.998, art. 8º, III e parágrafo único | oficial |
| Prazo de 10 dias e multa de um salário | CLT, art. 477, §§ 6º e 8º | oficial |
| Fim da homologação obrigatória | CLT, art. 477, § 1º (revogado pela Lei 13.467/2017) | oficial |
| Seguro só para dispensa sem justa causa | Lei 7.998, art. 3º | oficial |
| Saques posteriores do FGTS | Lei 8.036, art. 20 | oficial |
| Exemplos | motor `src/lib/trabalhista/rescisao.ts` (testado) | cálculo |

## Pendente

- **Projeção do aviso no acordo:** divergente; o texto diz que há decisões
  diferentes e a calculadora não projeta.
- **Consequências penais da simulação de demissão:** não pesquisadas; o texto
  fica na consequência administrativa do seguro (art. 8º) e indica orientação.

## Decisões

- **Título** "Acordo de demissão: o que recebe, FGTS e seguro (cálculo)":
  "seguro desemprego" é o primeiro termo do autocompletar.
- **Comparação com a demissão e o pedido** com os mesmos dados (PAA "é melhor
  acordo ou ser demitido").
- **"Devolver os 40%"** tratado com cuidado: a multa é do trabalhador; o
  problema é simular a demissão.
- **FAQ com 4**: homologação no sindicato, obrigação de aceitar, prazo, 13º e férias inteiros (o seguro virou H2).
- **Links:** calculadora de rescisão (comparador e TRCT) e artigo do pedido; o
  artigo do pedido linka para cá.

## Para medir

A partir de ~10/11: "acordo de demissão o que recebe", "acordo de demissão
fgts", "acordo de demissão seguro desemprego", "é melhor fazer acordo ou ser
demitido", "acordo de demissão cálculo".

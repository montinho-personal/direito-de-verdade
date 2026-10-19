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
`src/lib/rescisao.ts`.

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

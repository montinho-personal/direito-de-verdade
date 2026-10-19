# Pauta editorial

Levantamento de 19/10/2026. Sem acesso a volume exato de buscas: a ordem
combina estudos de palavras-chave jurídicas (trabalhista bem à frente, depois
previdenciário, família e consumidor), os assuntos mais levados à Justiça e
aos Procons, o calendário e as mudanças de lei de 2026.

Regra de cada artigo: prints do Google antes de escrever (ver `CLAUDE.md`).

## Prioridade de novembro

O Google leva semanas para mostrar um site novo: publicar antes do pico.

| artigo | pico de busca | status |
|---|---|---|
| 13º salário 2026: datas, quem tem direito e como calcular | novembro e dezembro (1ª parcela 30/11, 2ª até 18/12) | **publicado em 19/10/2026** — [doc](artigos/13-salario.md), `/artigos/13-salario` |
| Calculadora do 13º salário 2026 | novembro e dezembro | **publicado em 19/10/2026** — [doc](calculadoras/13-salario.md), `/calculadoras/13-salario` |
| Calculadora de rescisão trabalhista 2026 | o ano todo, pico em dezembro e janeiro | **publicado em 19/10/2026** — [doc](calculadoras/rescisao.md), `/calculadoras/rescisao` |
| Calculadora de imposto de renda 2026 (salário) | agora e março a maio | **publicado em 19/10/2026** — [doc](calculadoras/imposto-de-renda.md), `/calculadoras/imposto-de-renda` |
| Black Friday (27/11): direitos do consumidor | novembro | **publicado em 19/10/2026** — [doc](artigos/black-friday-direitos-do-consumidor.md), `/artigos/black-friday-direitos-do-consumidor` |
| Pensão alimentícia incide sobre o 13º? | novembro e dezembro | **publicado em 19/10/2026** — [doc](artigos/pensao-alimenticia-13-salario.md), `/artigos/pensao-alimenticia-13-salario` |
| Isenção do IR para quem ganha até R$ 5 mil | agora e março a maio (declaração 2027) | **publicado em 19/10/2026** — [doc](artigos/isencao-imposto-de-renda-5-mil.md), `/artigos/isencao-imposto-de-renda-5-mil` |

## Temas-base (o ano todo)

### Trabalho
- ~~Rescisão sem justa causa: o que recebe e em quanto tempo~~ — **publicado em 19/10/2026** ([doc](artigos/demissao-sem-justa-causa.md), `/artigos/demissao-sem-justa-causa`)
- Rescisão indireta: o que é e quando pedir
- Acordo de demissão (80% do FGTS, metade do aviso, sem seguro-desemprego)
- Pedido de demissão: o que recebe e o que perde
- ~~Seguro-desemprego 2026: quem tem direito, parcelas e valores~~ — **publicado em 19/10/2026** ([doc](artigos/seguro-desemprego-2026.md), `/artigos/seguro-desemprego-2026`)
- Aviso prévio trabalhado ou indenizado (e os 3 dias por ano)
- Horas extras e banco de horas
- Adicional de insalubridade
- Licença-paternidade nova: 10 dias a partir de 2027 (publicar dez/jan)

### Previdência e INSS
- Regras de aposentadoria 2026 (atualizar em janeiro para 2027)
- BPC/LOAS: quem tem direito
- Auxílio por incapacidade (antigo auxílio-doença) e perícia
- Benefício negado: como recorrer

### Família
- Pensão alimentícia: quanto se paga
- Divórcio em cartório ou na Justiça
- Guarda compartilhada
- União estável: direitos
- Inventário: prazo e custos

### Consumidor
- Cobrança indevida: devolução em dobro
- Desconto indevido de consignado
- Nome sujo: prazo de 5 anos e como limpar o nome
- Produto com defeito: prazos de 30 e 90 dias
- Cancelamento de internet/celular e multa de fidelidade
- Voo atrasado ou cancelado
- Plano de saúde que nega cobertura

### Moradia e Aluguel
- Multa por sair antes do fim do contrato
- Reajuste do aluguel
- Fiador
- Usucapião
- Barulho do vizinho e regras do condomínio

### Trânsito
- CNH sem autoescola: como tirar a carteira em 2026
- Como recorrer de multa
- Pontos e suspensão da CNH

## De fora por enquanto

- **Fim da escala 6x1:** aprovada na Câmara, parada no Senado sem data
  (out/2026). Escrever só se for votada.
- **Devolução dos descontos indevidos do INSS:** prazo de adesão encerrado em
  junho de 2026 (notícia mais recente encontrada).

## Revisão anual (valores que mudam)

- 13º salário: datas do ano, tabelas de INSS e IR, valor da multa.
- Seguro-desemprego: tabela nova em janeiro (faixas, piso e teto), em `src/lib/seguro-desemprego.ts` e no artigo `seguro-desemprego-2026` (exemplos e título com o ano).

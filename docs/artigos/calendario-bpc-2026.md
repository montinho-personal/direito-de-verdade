# Artigo: calendário do BPC/LOAS 2026 (`/artigos/calendario-bpc-2026`)

Criado e publicado em 17/11/2026, a pedido do Renato ("Criar 1 e 2"), a partir da pauta:
candidato 4 de "Candidatos vindos das buscas que ficaram de fora (17/11/2026)" (PAA "Como
saber o dia do pagamento do meu benefício BPC?" e "bpc loas calendário").

## Por que existe

Busca de todo mês, com concorrentes de portal e blog de crédito. O artigo do BPC/LOAS não tinha
as datas. Página com ano no endereço: entra na revisão anual (tabela de 2027).

## Prints recebidos (SerpApi, 17/11/2026)

2 buscas, celular, São Paulo. JSON em `prints/calendario-bpc-2026/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `calendário bpc 2026`, autocompletar | atualizado · **setembro, outubro, agosto, julho, junho** (meses) · **final 1, 2, 3** · Bradesco | tabela do ano por mês (primeiro e último dia); tabelas de novembro e dezembro por final; `tituloSeo` "por final". Bradesco (banco de pagamento): fora |
| idem, PAA | **Qual é o calendário do BPC 2026?** · **Qual a data de pagamento?** · **Qual será o valor do BPC em 2026?** · **Que dia é o pagamento de fevereiro de 2026?** | H2 do calendário; H2 do valor; FAQ de fevereiro (explica mês do benefício × mês do pagamento) |
| idem, outras pesquisas | calendário dos aposentados · INSS 2026 PDF · finais 0 e 1 · BPC outubro e novembro · INSS 13º · pagamento INSS novembro | link para o PDF oficial; novembro em destaque. 13º dos aposentados: já há artigo; o BPC não tem 13º (H2 do valor) |
| idem, visão de IA | não apareceu | — |
| `dia do pagamento bpc`, autocompletar | loas · 2026 · final 2, 3, 4 · **de dezembro** · de outubro, março, julho | tabela de dezembro; FAQ "Quando começa o pagamento de dezembro?" |
| idem, PAA | fevereiro de 2026 · calendário 2026 · **Como saber a data do meu LOAS?** · **Quando começa o pagamento de dezembro?** | H2 "Como saber o dia" (final antes do traço, Meu INSS, 135); FAQ de dezembro |
| idem, outras pesquisas | o que é e quem tem direito · consulta · consultar pelo CPF · **BPC e LOAS é a mesma coisa** · Meu INSS · quem criou · cartão · valor · como solicitar · deficiente · consulta por nome | FAQ "BPC e LOAS são a mesma coisa?"; Meu INSS e extrato; o resto já está em `/artigos/bpc-loas` (linkado). Consulta por CPF ou nome: fora |
| idem, visão de IA | só `page_token` (não pedida: a resposta é a tabela oficial) | — |
| orgânicos | `calendário`: **gov.br/INSS (notícia e PDF)**, G1, meutudo (blog de crédito), IstoÉ Dinheiro. `dia do pagamento`: MDS, Aos Fatos, Ipea, YouTube, Agência Brasil, Senado (resultado desencontrado) | o site não aparece. Fonte oficial em 1º; os outros são notícia e blog de crédito |

**Formato:** página de tabela. O texto responde com a data no começo, como pedem as buscas.

## Fontes confirmadas (17/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Datas de todos os finais e meses de 2026, benefícios de até 1 mínimo (tabela gerada direto do PDF) | INSS, Tabela de Pagamento de Benefícios 2026 (PDF) | oficial |
| Final = último algarismo antes do traço (ex.: 0104-7 → 4); extrato no Meu INSS; 135 de segunda a sábado, 7h às 22h; janeiro de 26/1 a 6/2 (até 1 mínimo) | INSS, notícia "Calendário de pagamentos do INSS de 2026 está disponível" (publicada em 08/07/2026, atualizada em 09/11/2026) | oficial |
| R$ 1.621 | Decreto 12.797/2025 | oficial |
| Sem 13º; CadÚnico para manter | `/artigos/bpc-loas` (LOAS e gov.br) | oficial |

## Pendente

- O BPC está na tabela "até 1 salário mínimo" porque o valor é de 1 mínimo; o INSS não cita o
  BPC por nome na notícia. Conferir se houver página específica do BPC.

## Decisões

- Tabela anual em "primeiro e último dia" (cabe no celular); tabela por final só para os meses
  que ainda vão ser pagos (novembro e dezembro). O resto, no PDF oficial linkado.
- Links: BPC/LOAS (nas duas direções), recurso ao INSS.

## Para medir

A partir de ~24/11/2026 (primeiro pagamento): "calendário bpc 2026", "calendário bpc novembro",
"calendário bpc dezembro 2026", "dia do pagamento bpc".

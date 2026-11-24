# Artigo: calendário do INSS 2026 (`/artigos/calendario-inss-2026`)

Criado e publicado em 24/11/2026, a pedido do Renato ("Pode criar próximos dois"), a partir da pauta:
candidato 1 de "Candidatos vindos das buscas que ficaram de fora (18/11/2026, rotina diária)".

## Por que existe

Veio do autocompletar de `aposentadoria 2026` (calendário, pagamento, datas, reajuste). O site
só tinha o calendário do BPC (até 1 mínimo); faltava quem ganha **acima do mínimo**. Pico em
dezembro e janeiro (pagamento de dezembro e reajuste). Página com ano no endereço: entra na
revisão anual (tabela de 2027).

## Prints recebidos (SerpApi, 24/11/2026)

3 buscas, celular, São Paulo (a principal veio sem perguntas, por isso a 3ª). JSON em `prints/calendario-inss-2026/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `calendário inss 2026`, autocompletar | **aposentados** · pagamento · agosto, setembro, julho, outubro (meses) · BPC / LOAS · **PDF** · aposentados e pensionistas · **final 3, final 4** · **salário-maternidade** · pensionista | título e H1; tabela do ano (cada mês); tabelas por final; link para o PDF; FAQ "vale para pensão, auxílio e salário-maternidade?" (empregada: paga pela empresa, Lei 8.213, art. 72, § 1º); BPC: link para o calendário do BPC |
| idem, PAA, outras pesquisas e visão de IA | não vieram | — |
| `pagamento inss dezembro 2026`, autocompletar | **calendário pagamento inss dezembro 2026** · anos anteriores (2022, 2023) | `tituloSeo` "pagamento de dezembro por final"; H2 de dezembro com as duas tabelas. Anos anteriores: fora |
| idem, PAA | **Qual a data de pagamento de dezembro?** · **Qual a data que o INSS vai pagar esse mês?** · Como ver a tabela de pagamento? · Qual a tabela de INSS 2026? | FAQ de dezembro; H2 de novembro; link para o PDF. "Tabela do INSS 2026" (contribuição): fora |
| idem, outras pesquisas | calendário 2026 · **pagamento novembro 2026** · Meu INSS pagamentos · consulta pelo CPF · informe de rendimentos | H2 de novembro; extrato no Meu INSS. Informe de rendimentos e consulta pelo CPF: fora |
| idem, visão de IA | só `page_token` (não pedida: a resposta é a tabela oficial) | — |
| `reajuste aposentadoria 2027`, autocompletar | **previsão** · INSS 2027 · **acima do mínimo 2027** · anos anteriores | H2 "Qual o reajuste dos aposentados em 2027?": ainda não definido, regra do INPC (art. 41-A), e o de 2026 para comparar. Previsões: fora |
| idem, PAA | Tabela de pontos 2027 · Quanto vai estar o salário em 2027 · **Aumento acima do mínimo em 2026** · Idade mínima 2027 | FAQ "Quanto foi o reajuste em 2026?" (3,90%, Portaria 13/2026). Pontos e idade 2027: já no artigo de aposentadoria 2026. Salário 2027: fora (sem valor oficial) |
| idem, outras pesquisas | previsão do INPC 2027 · aumento do salário mínimo 2027 · teto 2027 · tabela reajuste 2026 | 2026 entrou; 2027: fora (projeções) |
| idem, visão de IA | "previsão oficial" de R$ 1.741 para o mínimo de 2027, INPC de 4,93% a 5,3%, teto estimado. Fontes: iG, Previdenciarista, jornais | não é fonte; nada disso entrou (projeção, sem portaria). Formato: o texto diz que ainda não há valor oficial |
| orgânicos | `calendário`: só portais de notícia, YouTube e Instagram (o gov.br nem aparece). `dezembro`: **Meu INSS, gov.br/INSS**, Instagram, DOU, Wikipédia. `reajuste 2027`: blogs, Facebook, iG, YouTube | o site não aparece. **Concorrência fraca na busca principal**: prioridade para medir |

**Formato:** página de tabela, com a data no começo (lead) e as tabelas do mês corrente e do próximo primeiro.

## Fontes confirmadas (24/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Datas de todos os finais e meses de 2026, até 1 mínimo e acima (pares 1-6, 2-7, 3-8, 4-9, 5-0) | INSS, Tabela de Pagamento de Benefícios 2026 (PDF), tabelas geradas direto do texto do PDF | oficial |
| Último algarismo antes do traço; Meu INSS "Extrato de pagamento"; 135; vale para aposentados, pensionistas e auxílios | INSS, notícia do calendário (atualizada em 09/11/2026) | oficial |
| Acima do mínimo: do 1º ao 5º dia útil do mês seguinte; até o mínimo: do 5º dia útil antes do fim do mês ao 5º do seguinte; reajuste anual na data do mínimo, pelo INPC, pro rata | Lei 8.213/1991, art. 41-A, caput e §§ 2º e 3º (Câmara) | oficial |
| Salário-maternidade da empregada pago pela empresa, com compensação | Lei 8.213/1991, art. 72, § 1º | oficial |
| Reajuste de 3,90% em 2026; mínimo R$ 1.621; teto R$ 8.475,55 | Portaria Interministerial MPS/MF 13/2026 (DOU de 12/01/2026, PDF lido como imagem) | oficial |

## Pendente

- Reajuste de 2027: entra quando a portaria de janeiro de 2027 for publicada.
- Tabela de pagamento de 2027: quando o INSS publicar, criar `/artigos/calendario-inss-2027` ou trocar o ano.

## Decisões

- `tituloSeo` "Calendário INSS 2026: pagamento de dezembro por final" (53): o mês do pico. Trocar para janeiro em dezembro, se ainda fizer sentido.
- Sem projeção de reajuste ou de salário mínimo de 2027: só a regra da lei e o número de 2026.
- A tabela por final de até 1 mínimo de novembro fica no calendário do BPC (mesma tabela), para não duplicar.

## Para medir

A partir de ~8/12/2026: "calendário inss 2026", "pagamento inss dezembro 2026", "calendário inss
2026 aposentados", "reajuste aposentadoria 2027".

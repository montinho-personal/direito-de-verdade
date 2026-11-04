# Página local: advogado em Barueri e Alphaville (`/artigos/advogado-em-barueri-e-alphaville`)

Pedido do Renato em 04/11/2026: páginas para quem procura advogado em Barueri, Santana de
Parnaíba, Aldeia da Serra e Alphaville. Esta é a página-piloto da região de Barueri e
Alphaville; o formato vai ser conferido pelo Renato antes das próximas.

## Decisões (04/11/2026)

- **O site não indica escritório** (CLAUDE.md) e a OAB vê, em tese, captação indevida em
  plataformas que encaminham clientes a advogados (Provimento 205/2021; Representação
  49.0000.2025.001346-3). Por isso a página responde à busca sem indicar ninguém: qual
  especialista procurar, como escolher, quanto custa e onde há atendimento gratuito.
- **Sem páginas de entrada** (doorway): em vez de uma página por especialidade × bairro, uma
  página geral por região e uma por área de atuação para a região. Alphaville e Aldeia da
  Serra são bairros de Barueri e Santana de Parnaíba e entram no título e no texto.
- Nova categoria `ajuda-juridica` ("Onde buscar ajuda") em `src/lib/categorias.ts`.
- Só endereços confirmados em fonte oficial; os demais remetem ao site do órgão.

## Prints recebidos

| print | conteúdo | onde entrou |
|---|---|---|
| Google `advogado em alphaville`, autocompletar (04/11/2026) | preso em alphaville (notícia) · criminalista · trabalhista · são paulo · barueri · administradora | título com "Barueri e Alphaville"; tabela de especialistas com criminalista e trabalhista |
| Google, "Outras pessoas pesquisaram" (2 prints) | nomes de escritórios · civil · familiar · em barueri · gratuito barueri · trabalhista alphaville/barueri · jandira · criminalista barueri | tabela de especialistas (civil, família, criminal, trabalhista, imobiliário); seção de atendimento gratuito. Escritórios: fora (não indicamos). Jandira: fora |
| Google, PAA | Qual o valor de uma consulta? · O CRAS oferece advogado gratuito? · Como saber se o advogado é bom? · Quanto custa em média? | H2 "Quanto custa"; H2 "Como escolher"; FAQ do valor e de como saber. CRAS: sem fonte oficial, fora |
| Google, "Encontre produtos e serviços" | trabalhista, imobiliário barueri; escritórios | tabela de especialistas |
| AnswerThePublic `advogado em alphaville` | "advogado em alphaville" 170/mês (CPC US$ 1,30); "advogado preso em alphaville hoje" | — |
| Google `advogado trabalhista barueri` (4 prints) e AnswerThePublic | gratuito barueri · onde conseguir advogado gratuito em Barueri? · valor cobrado · vale a pena entrar com ação · "advogado trabalhista em barueri" 260/mês (CPC US$ 3,39) | FAQ "Tem advogado gratuito em Barueri?"; os demais ficam para a página trabalhista da região (prints em `prints/advogado-trabalhista-barueri/`) |

## Fontes confirmadas (04/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Fórum Trabalhista de Barueri: Al. Araguaia, 2096, Alphaville Industrial; telefones das 5 Varas e do CEJUSC-JT; Santana de Parnaíba com varas próprias | TRT-2, página de telefones e endereços | oficial |
| Justiça Federal / JEF de Barueri (44ª Subseção): Av. Piracema, 1362, Tamboré; PABX (11) 4568-9000 | Justiça Federal de SP, portaria | oficial |
| Fórum de Barueri na Vila Porto | TJSP, notícia; Prefeitura de Barueri | oficial |
| Convênio Defensoria–OAB-SP: assistência suplementar; exclui eleitoral, administrativa, trabalhista e previdenciária | TJSP, termo de convênio | oficial |
| JEC: até 20 SM sem advogado, até 40 com advogado | Lei 9.099/1995 | oficial |
| Reclamação trabalhista sem advogado | CLT, art. 791 | oficial |
| JEF até 60 SM, sem advogado até a sentença | TRF4 (já conferido no artigo do INSS) | oficial |
| CNA em cna.oab.org.br | guias e notícias (TJCE recomenda o CNA) | 2 veículos |
| Publicidade informativa e sóbria | Provimento 205/2021, art. 3º (resumos de OAB-SP e outros) | oficial |

## Pendente

- **Endereço do Juizado Especial Cível e das varas do Fórum de Barueri:** o TJSP lista endereços diferentes (Rua Des. Celso Luiz Limongi, 84; Av. Henriqueta Mendes Guerra, 550; Rua Ministro Rafael de Barros Monteiro, 110). A página diz só "Vila Porto" e manda conferir no TJSP.
- **OAB-SP 117ª Subseção (Barueri):** endereço só em site de terceiros; `oabsp.org.br` está bloqueado na rede da sessão.
- **Defensoria Pública:** unidade e telefone que atendem Barueri não confirmados (`defensoria.sp.def.br` bloqueado na rede da sessão); critério de renda (3 salários mínimos) só em fontes não oficiais.
- Tabela de honorários da OAB-SP 2026: valores não conferidos; a página não dá números.

## Para medir

A partir de ~18/11/2026: "advogado em alphaville", "advogado em barueri", "advogado gratuito barueri", "advogado trabalhista barueri".

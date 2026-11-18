# Artigo: divórcio (`/artigos/divorcio`)

Escrito e publicado em 24/10/2026 **sem os prints do Google nem o AnswerThePublic**,
a pedido do Renato ("Pode seguir, depois mando"). Quando os relatórios chegarem:
salvar em `docs/artigos/prints/divorcio/`, revisar título, H2 e FAQ e preencher a
tabela abaixo.

## Por que existe

"Divórcio", "divórcio em cartório" e "como fazer divórcio" são buscas altas o ano
todo, com pico em janeiro. O grupo de Família só tinha os dois artigos de pensão;
este liga com eles (pensão, ex-cônjuge e guarda).

## Prints recebidos (SerpApi, 18/11/2026)

Revisão da rotina diária, 2 buscas, celular, São Paulo. JSON em `prints/divorcio/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `divórcio`, autocompletar | "Divórcio em Família" (filme, 5 variações) · **litigioso** · **com filho menor no cartório** · **gratuito** (2) · **extrajudicial** · Bíblia · "divórcio energético" · **online** · **no cartório precisa de advogado** | `tituloSeo` "em cartório, litigioso ou gratuito"; H2 "Divórcio litigioso…"; H2 "Quanto custa? Dá para fazer de graça?" (Defensoria); filhos menores, online e advogado já eram seções e FAQ. Filme, Bíblia, "energético": fora |
| idem, PAA | Qual o valor da taxa? · **Qual é a nova regra do divórcio?** · **Qual o primeiro passo?** · Bíblia | H2 "Qual o primeiro passo para se divorciar?"; "regra mais nova" no H3 dos filhos menores (CNJ, 2024); taxa no H2 de custo |
| idem, outras pesquisas | gratuito · online · Netflix · filme · valor · Bíblia · cartório gratuito · documento · extrajudicial · com filhos · civil · no Brasil | documentos no H2 do primeiro passo; o resto já coberto ou fora |
| idem, visão de IA | só `page_token` (não pedida) | — |
| `como dar entrada no divórcio`, autocompletar | **pela Defensoria Pública** (2, uma online) · online / pela internet · gratuito · no cartório · com filhos / filhos menores · **sem advogado** · litigioso · pelo Ministério Público · no fórum · sem pagar · e pensão alimentícia | Defensoria no H2 de custo e no primeiro passo; sem advogado: FAQ (não dá, mas pode ser defensor público). "Pela Defensoria online" e "pelo Ministério Público": fora (variam por estado, sem fonte lida) |
| idem, PAA | primeiro passo para quem quer se separar · **dá para divorciar direto no cartório?** · quanto tempo demora o divórcio gratuito · **tem como pedir o divórcio sozinha?** | primeiro passo: H2 novo; cartório: já era H2; "sozinha" no H2 do litigioso. Tempo: fora (não há prazo na lei) |
| idem, visão de IA | só `page_token` (não pedida) | — |
| orgânicos | `divórcio`: Jusbrasil, Wikipédia, Defensoria ES (+ notícias e "perspectivas"). `como dar entrada`: loja de livros (2), Jusbrasil | o site não aparece; segunda busca com concorrentes muito fracos |

## Fontes confirmadas

Pesquisa de 24/10/2026.

| fato | fonte | tipo |
|---|---|---|
| Separação judicial não é requisito; divórcio só depende da vontade (EC 66/2010) | STF, Tema 1.053 (notícia de 08/11/2023) | oficial |
| Escritura de divórcio consensual sem nascituro ou filhos incapazes; não depende de homologação; advogado ou defensor obrigatório | CPC, art. 733 (Câmara) | oficial |
| Conteúdo do acordo (partilha, pensão, guarda); partilha depois | CPC, art. 731 | oficial |
| Ações de família: mediação e conciliação; audiência | CPC, arts. 693 a 697 | oficial |
| Gratuidade da justiça | CPC, art. 98 | oficial |
| Documentos; declaração sobre filhos e gravidez; filhos menores com questões resolvidas em juízo; procuração pública de 30 dias; averbação sem juiz; tabelião não indica advogado; emolumentos por lei estadual, não em percentual; gratuidade por simples declaração; recusa por escrito; imposto na partilha desigual | Resolução CNJ 35/2007, compilada com a 571/2024 | oficial |
| Divórcio com filho menor em cartório desde agosto de 2024 | Agência Brasil (agosto de 2024) | oficial (EBC) |
| Divórcio online pelo e-Notariado, videoconferência, advogado presente, nem todo cartório oferece | Provimento CNJ 100/2020; Agência Brasil (junho de 2022) | oficial |
| Manter o nome de casado; divórcio sem partilha; guarda unilateral ou compartilhada; comunhão parcial e o que entra e sai | Código Civil, arts. 1.571, 1.581, 1.583, 1.640, 1.658 a 1.660 | oficial |

## Pendente

- Valores de emolumentos por estado: não há tabela nacional; o texto manda
  perguntar ao cartório.
- Tempo médio do divórcio em cartório e na Justiça: sem fonte oficial; fora.
- Resolução CNJ 695/2026 aparece como correlata da Resolução 35 no portal do CNJ,
  mas a página não abriu (403): conferir se mudou algo no divórcio.
- União estável (extinção) e guarda: temas próprios da pauta.

## Decisões

- Título "Divórcio: como fazer em cartório ou na Justiça" (46): provisório.
- Sem "divórcio unilateral" (projetos de lei, não é regra em vigor).
- Links: pensão alimentícia (as duas direções).

## Para medir

A partir de ~8/11/2026: "divórcio", "divórcio em cartório", "como fazer divórcio",
"divórcio online", "quanto custa um divórcio", "divórcio com filhos menores".

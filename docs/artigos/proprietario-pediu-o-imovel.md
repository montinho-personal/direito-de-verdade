# Artigo: proprietário pediu o imóvel (`/artigos/proprietario-pediu-o-imovel`)

Escrito e publicado em 16/11/2026, pedido do Renato ("Pode criar esses 4 artigos"), 2º dos
candidatos vindos das buscas que ficaram de fora ("como fazer um pedido de desocupação",
"despejo por denúncia vazia", nas pesquisas da multa e do despejo).

## Por que existe

Busca alta de inquilino ("proprietário pediu a casa quanto tempo tenho para sair") e de
proprietário ("denúncia vazia", "notificação de desocupação"). Completa Moradia: multa,
despejo, aluguel atrasado, fiador, reajuste.

## Prints recebidos (SerpApi, 16/11/2026)

JSON em `prints/proprietario-pediu-o-imovel/`. Celular, São Paulo.

| busca | conteúdo | onde entrou |
|---|---|---|
| `denúncia vazia`, autocompletar | prazo para desocupação · **e denúncia cheia** · locação · comercial prazo determinado/indeterminado · significado · **contrato inferior a 30 meses** · residencial prazo indeterminado · lei do inquilinato artigo | H2 "O que é denúncia vazia?" (com denúncia cheia); tabela por tipo de contrato (30 meses, menos de 30, comercial) |
| idem, PAA | contrato por prazo indeterminado? · 5 cláusulas indispensáveis · **O que diz o artigo 47?** · prazo da denúncia vazia residencial | lista do art. 47 e tabela. Cláusulas de contrato: fora (outro assunto) |
| idem, outras pesquisas | residencial · comercial · cheia · prazo · modelo · despejo por denúncia vazia (requisitos, liminar) | H2 "E se eu não sair no prazo?" (ação de despejo, 6 meses do art. 61, 15 dias do art. 63). Modelo de petição: fora |
| idem, visão de IA | definição; requisitos por tipo de contrato. Fontes: Exame, Guaíra Imóveis, Jusbrasil, **STJ**, Trilhante, Wikipedia | não é fonte |
| `proprietário pediu o imóvel quanto tempo tenho para sair`, autocompletar | pediu a casa, quanto tempo tenho para sair/que sair | `titulo`, `tituloSeo` e lead |
| idem, PAA | direitos do inquilino · quanto custa um despejo · **dias para sair sem contrato** · **dono vendeu, quanto tempo para sair** | H2 da venda (90 dias, cláusula de vigência averbada); contrato verbal na tabela (art. 47). Custo do despejo: no artigo de despejo |
| idem, outras pesquisas | **tem que pagar o aluguel** · prazo com contrato · **30 dias de graça** · antes do término · uso próprio · sem contrato · vendi o imóvel · **3 meses** · **90 dias** · posso pedir a casa sem contrato | H2 "Tenho de pagar o aluguel até sair?"; FAQ dos "30 dias de graça"; H2 do uso próprio; os "3 meses/90 dias" são a venda (art. 8º) |
| idem, visão de IA | 30 dias em geral; dentro do prazo não pode; venda 90 dias; despejo por falta de pagamento 15 dias. Fontes: Fuhro Souto, Jusbrasil, Regente, Serasa, Unio, Índice Imóveis | não é fonte. "30 dias para o uso próprio" não entrou: na lei, o uso próprio nos contratos menores vai por ação de despejo, sem prazo de 30 dias |
| `notificação de desocupação`, autocompletar | de imóvel · por falta de pagamento · pelo locatário/locador · modelo · imóvel vendido · extrajudicial · uso próprio · contrato vencido · **por WhatsApp** | FAQ do WhatsApp (a lei pede escrito; prova do envio); FAQ do inquilino que quer sair (art. 6º). Modelo: fora |
| idem, PAA, outras pesquisas e orgânicos | dominados por "taxa de desocupação" do IBGE (desemprego) | busca ambígua; nada aproveitado |
| idem, visão de IA | o que deve constar na notificação; cartório e AR. Fontes: AR Online, Jusbrasil, Pilota | não é fonte; só a ideia de comprovar o envio |
| orgânicos (as duas primeiras) | Jetimob, Trilhante, Conjur (STJ: prazo da denúncia vazia contado do início da locação, 2021), Alude, Centure, Âmbito Jurídico, Fuhro Souto, Jusbrasil, Serasa, Estadão, Porta 8 | o site não aparece |

## Fontes confirmadas (16/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Durante o prazo o locador não reaver; multa do locatário (4º); ação de despejo para reaver (5º); aviso de 30 dias do locatário no indeterminado (6º); venda: 90 dias, exceção da cláusula de vigência averbada, prazo de 90 dias do registro (8º); desfazimento (9º) | Lei 8.245/1991, texto atualizado (Câmara) | oficial |
| Pagar aluguel e encargos (23, I); devolver no estado recebido (23, III) | idem | oficial |
| ≥ 30 meses: fim de pleno direito, prorrogação, denúncia com 30 dias (46); < 30 meses ou verbal: prorrogação e retomada só nos incisos, inclusive 5 anos (47); necessidade provada (47, § 1º) | idem | oficial |
| Não residencial: fim de pleno direito, prorrogação, 30 dias (56, 57) | idem | oficial |
| Concordância: 6 meses e isenção de custas e honorários (61); mandado com 30 dias, 15 no art. 46, § 2º (63, § 1º, b) | idem | oficial |
| Exercício arbitrário das próprias razões | Código Penal, art. 345 (Câmara) | oficial |

## Pendente

- Decisão do STJ de 2021 sobre o início do prazo de 5 anos da denúncia vazia (Conjur, 05/03/2021): não conferida no STJ; fora.
- Liminares do art. 59, § 1º (mútuo acordo com 6 meses, fim de contrato de trabalho): não detalhadas.

## Decisões

- "Denúncia cheia" é termo de uso corrente, não da lei: o texto diz "costuma ser chamada".
- Sem ferramenta embutida (nenhuma calculadora responde a dúvida principal); link para a de aluguel atrasado no H2 do pagamento.

## Para medir

A partir de ~30/11/2026: `proprietário pediu o imóvel quanto tempo tenho para sair`, `denúncia vazia`, `quando o proprietário pode pedir o imóvel`, `dono vendeu a casa quanto tempo para sair`.

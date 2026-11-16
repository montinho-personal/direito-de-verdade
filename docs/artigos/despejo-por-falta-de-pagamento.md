# Artigo: despejo por falta de pagamento (`/artigos/despejo-por-falta-de-pagamento`)

Escrito e publicado em 16/11/2026, pedido do Renato ("Pode criar o próximo artigo"). Primeiro
artigo novo feito do começo ao fim com a pesquisa do Google pelo **SerpApi** (celular, São
Paulo), sem print. A pauta de temas-base estava toda publicada; o tema veio das próprias
pesquisas de 16/11 (PAA "Estou devendo 3 meses de aluguel. O que acontece?", em
`multa de 3 aluguéis proporcional`) e fecha o grupo de Moradia (multa, fiador, reajuste).

## Por que existe

Busca o ano todo, com pico em janeiro e fevereiro (contas de fim de ano). Atende inquilino e
proprietário. Sem volume confirmado.

## Prints recebidos (SerpApi, 16/11/2026)

JSON de cada busca em `prints/despejo-por-falta-de-pagamento/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `despejo por falta de pagamento`, autocompletar | cumulado com cobrança · de aluguel · prazo · liminar · juizado especial · precisa de notificação · de condomínio · quantos meses · sem contrato · valor da causa · requisitos · caução · artigo · jurisprudência | H2 da cobrança/fiador, do prazo (tabela com liminar e caução), do Juizado; FAQ da notificação, do condomínio e do contrato verbal. "Valor da causa": fora (CPC/art. 58 não conferidos) |
| idem, PAA | Qual o prazo para despejo? · Quanto custa um processo de despejo? · Quanto tempo o inquilino tem para sair depois da ordem? · Quantos dias depois do aluguel atrasado posso ser despejado? | H2 do prazo e tabela; FAQ do custo; lead (15 dias para sair) |
| idem, outras pesquisas | prazo · cumulada com cobrança · modelo de ação · notificação extrajudicial · lei do inquilinato · com liminar · quanto custa · requisitos · juizado · sem contrato · recebi ordem de despejo o que fazer | H2 "Recebi uma ação de despejo: o que fazer?". Modelo de petição: fora (o site não faz peça) |
| idem, visão de IA | pode entrar no 1º dia; purga em 15 dias, 1 vez em 24 meses; "honorários de 10% a 20%"; contestação em 15 dias úteis; liminar sem garantia com caução de 3 aluguéis; saída em 15 dias; proibido trocar fechadura (CP 345). Fontes: Jusbrasil, EPD, ADVBOX, Bragheto, Arbitralis, Rocha Advogados | não é fonte. Honorários: entrou 10% (art. 62, II, d), não "10 a 20%". Contestação em dias úteis: fora (CPC não conferido) |
| `quantos meses de aluguel atrasado pode despejar`, autocompletar | da despejo · para ordem de despejo · atrasado | H2 "Quantos meses de aluguel atrasado para ser despejado?" (primeiro H2) e `tituloSeo` |
| idem, PAA | 3 aluguéis atrasados, posso ser despejado? · devendo 3 meses, o que acontece? · 2 meses atrasado? · quanto tempo devendo para ser despejado? | mesmo H2: "nenhum número está na lei" |
| idem, outras pesquisas | 1 mês atrasado · por lei quantos dias posso atrasar · 2 meses · lei do inquilinato atraso · liminar quanto demora · quem não pode ser despejado · aluguel vencido ou antecipado · calculadora de juros de aluguel atrasado · aluguel atrasado o que fazer | vencimento até o 6º dia útil (art. 23, I); H2 "Quem não pode ser despejado?"; FAQ do art. 42 (aluguel antecipado). Calculadora de juros de aluguel: não existe no site; ideia para a pauta |
| idem, visão de IA | "mito dos 3 meses"; média de 3 a 6 meses; imobiliárias esperam 30 a 60 dias. Fontes: BRCondos, SP Imóvel, Serasa, TikTok | não é fonte. "3 a 6 meses" e "30 a 60 dias": sem fonte oficial, fora |
| `ação de despejo quanto tempo demora`, autocompletar | por falta de pagamento · comercial · residencial · na justiça · denúncia vazia · judicial · em portugal · quanto tempo para sair · quanto tempo de atraso | H3 "Quanto tempo demora uma ação de despejo?" (a lei não fixa prazo total; 15 dias e execução sem caução). Comercial e denúncia vazia: outros assuntos. Portugal: fora |
| idem, PAA | Quanto tempo leva uma ação de despejo? · valor da causa com denúncia vazia · devendo 3 meses · em quais situações não pode ser despejado? | H3 do tempo; H2 "Quem não pode ser despejado?" |
| idem, outras pesquisas | posso ser despejado com filho menor · quem não pode ser despejado · se eu for despejado tenho que pagar multa · devendo aluguel e não tenho como pagar · lei 8.245/91 | H2 "Quem não pode ser despejado?" (a lei não exclui famílias com filhos); H2 "Quem é despejado tem de pagar multa?" com a calculadora; passo "negocie" e Defensoria |
| idem, visão de IA | 3 a 6 meses, até 1 a 2 anos com recursos. Fontes: Jusbrasil, QuintoAndar, SP Imóvel, redes sociais | não é fonte; prazos médios fora |
| orgânicos (as três) | Jusbrasil, EPD, ADVBOX, YouTube, escritórios, **STJ (notícia de 19/06/2026)**, SP Imóvel, VLV, QuintoAndar, Instagram/Facebook | a notícia do STJ virou fonte (REsp 2.225.450). O site não aparece em nenhuma |

## Fontes confirmadas (16/11/2026)

| fato | fonte | tipo |
|---|---|---|
| Desfazimento por falta de pagamento (9º, III); cobrança antecipada proibida salvo art. 42 e temporada (20); vencimento até o 6º dia útil (23, I); aluguel antecipado sem garantia (42); denúncia com 30 dias no prorrogado (46, § 2º); locação verbal (47) | Lei 8.245/1991, texto atualizado (Câmara), baixado em 16/11/2026 | oficial |
| Liminar em 15 dias com caução de 3 aluguéis em contrato sem garantia (59, § 1º, IX) e depósito para evitá-la (59, § 3º) | idem | oficial |
| Purga em 15 dias da citação, com aluguéis vencidos, multas, juros, custas e honorários de 10% salvo contrato (62, II); complemento em 10 dias (62, III); depósito dos que vencerem (62, V); cobrança antes da desocupação (62, VI); cumulação com cobrança e fiadores (62, I); 1 vez em 24 meses (62, parágrafo único); acessórios (62, caput) | idem | oficial |
| Mandado com 30 dias; 15 dias se fundado no art. 9º ou mais de 4 meses entre citação e sentença (63, § 1º); escolas e outros (63, §§ 2º e 3º) | idem | oficial |
| Execução provisória sem caução nas ações do art. 9º (64); despejo com força e arrombamento, móveis com depositário, 30 dias após falecimento (65); abandono (66) | idem | oficial |
| Juizado: despejo para uso próprio (3º, III); até 40 salários mínimos (3º, I) | Lei 9.099/1995, texto atualizado (Câmara) | oficial |
| Exercício arbitrário das próprias razões | Código Penal, art. 345 (Câmara) | oficial |
| Purga não impede rescisão com atrasos reiterados no processo | STJ, REsp 2.225.450, notícia de 19/06/2026 | oficial |
| Multa compensatória também no despejo | STJ, REsp 1.906.869, notícia de 15/07/2022 (já usada na calculadora de multa) | oficial |

## Pendente

- Prazo da contestação (CPC, arts. 335 e 219): não conferido nesta pesquisa; o texto diz só "a defesa é feita por advogado".
- Valor da causa (art. 58, III, e CPC): não conferido; fora.
- Juizado e despejo por falta de pagamento: a lei só lista o despejo para uso próprio; aceitação em outros casos depende do entendimento local (não afirmado).
- Planalto fora do ar no dia: leis lidas na Câmara.

## Decisões

- Sem prazo médio de processo ("3 a 6 meses" da visão de IA): sem fonte oficial.
- Sem modelo de petição nem orientação para um lado só: o artigo serve a inquilino e proprietário.
- Ferramenta: `calculadora-multa-aluguel` no H2 da multa (é a dúvida de "se eu for despejado tenho que pagar multa").
- Ideia para a pauta: calculadora de aluguel atrasado (multa, juros e correção), pedida em "Outras pessoas pesquisaram".

## Para medir

A partir de ~30/11/2026: `despejo por falta de pagamento`, `quantos meses de aluguel atrasado pode despejar`, `ação de despejo quanto tempo demora`, `prazo para despejo por falta de pagamento`.

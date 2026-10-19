# Artigo: Demissão sem justa causa: o que recebe (`/artigos/demissao-sem-justa-causa`)

Escrito e publicado em 19/10/2026, a partir dos prints do Renato.

## Por que existe

Tema trabalhista buscado o ano todo, com pico em dezembro e janeiro (fim de
contratos temporários e cortes). Vem com a calculadora de rescisão no texto;
a página própria da calculadora (`/calculadoras/rescisao`) vem depois, com
os prints de "calculadora rescisão" já recebidos
(`docs/calculadoras/prints/rescisao/`).

## Prints recebidos

Busca pedida ao Renato em 19/10/2026 e recebida no mesmo dia (celular,
15h37). Prints em `docs/artigos/prints/demissao-sem-justa-causa/`. Não veio
"Outras pessoas pesquisaram".

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `demissão sem justa causa o que recebe` | cálculo; clt; pedido de demissão; o que o funcionário recebe; recebe seguro desemprego; recebe fgts; recebe décimo terceiro | calculadora e H2 do cálculo; H2 do seguro-desemprego, do FGTS e do 13º; pedido de demissão como comparação |
| Visão geral de IA | saldo de salário; aviso prévio de 30 dias + 3 por ano até 90; 13º proporcional (15 dias); férias vencidas e proporcionais + 1/3; saque do FGTS | lista do lead e H2 de cada verba (conferidas em fonte; a IA não é fonte) |
| PAA e resultados | Como calcular a rescisão sem justa causa? · Qual é o valor da multa por demissão sem justa causa? · Quem ganha 1500 recebe quanto de rescisão? · Eu trabalhei 45 dias e fui demitido. Quanto vou receber? Resultados: Barbieri Advogados ("Rescisão sem justa causa 2026: direitos, verbas e cálculo"), meutudo | um H2 para cada pergunta |

## Fontes confirmadas

Todas abertas em 19/10/2026 (pesquisa com textos em
`scratchpad/pesquisa-rescisao/`).

| fato | fonte | tipo |
|---|---|---|
| Prazo de 10 dias (art. 477, § 6º); multa de um salário pelo atraso (§ 8º); aviso integra o tempo de serviço (art. 487, § 1º); desconto se o empregado não cumprir (§ 2º); 2 horas por dia ou 7 dias corridos (art. 488); férias proporcionais 1/12 por mês ou fração acima de 14 dias (arts. 146 e 147); contrato de experiência: metade dos salários até o termo (art. 479) ou regra do prazo indeterminado com cláusula (art. 481) | [CLT na Câmara](https://www2.camara.leg.br/legin/fed/declei/1940-1949/decreto-lei-5452-1-maio-1943-415500-normaatualizada-pe.html) | oficial |
| Aviso de 30 dias + 3 por ano até 90 | [Lei 12.506/2011](https://www2.camara.leg.br/legin/fed/lei/2011/lei-12506-11-outubro-2011-611572-publicacaooriginal-133781-pl.html) | oficial |
| 1 ano completo = 33 dias (NT 184/2012 do MTE, TST RR-20892-88.2014.5.04.0005) | [TST via TRT4](https://www.trt4.jus.br/portais/escola/modulos/noticias/413950) | oficial |
| Súmulas 171, 261, 305 e 371 do TST | JusLaboris (Res. 121/2003 e 129/2005) | oficial |
| Multa de 40% (art. 18, § 1º); saque (art. 20, I); saque-aniversário: só a multa (art. 20-D, § 7º), volta no 25º mês (art. 20-C) | [Lei 8.036 na Câmara](https://www2.camara.leg.br/legin/fed/lei/1990/lei-8036-11-maio-1990-365155-normaatualizada-pl.html) | oficial |
| Sem INSS: férias indenizadas e 1/3 (Lei 8.212, art. 28, § 9º, d), indenização do art. 479 (§ 9º, e, 3); 13º integra (§ 7º); aviso indenizado (STJ Tema 478, mantido em 13/05/2026) | [Lei 8.212](https://www2.camara.leg.br/legin/fed/lei/1991/lei-8212-24-julho-1991-363647-normaatualizada-pl.pdf); [STJ](https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=478&cod_tema_final=478) | oficial |
| Sem IR: férias indenizadas e 1/3 (P178); aviso não trabalhado, indenização e FGTS (P275); 13º exclusivo na fonte (P332) | [Receita, P&R IRPF 2026](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/p-r-irpf-2026-v1-00-2026-04-23.pdf) | oficial |
| Seguro-desemprego: 12/18, 9/12, 6 meses; canais gov.br, Carteira de Trabalho Digital, 158, presencial | [Lei 7.998](https://www2.camara.leg.br/legin/fed/lei/1990/lei-7998-11-janeiro-1990-366029-normaatualizada-pl.pdf); [gov.br](https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego) | oficial |

Exemplo de R$ 1.500 e o de 45 dias: cálculo próprio com `src/lib/rescisao.ts`.

## Pendente

- **INSS do empregado sobre o 13º da projeção do aviso:** o STJ (Tema 1170)
  trata da contribuição patronal; a calculadora desconta INSS sobre todo o
  13º, como a regra geral do 13º (Lei 8.212, art. 28, § 7º).
- **Aviso proporcional a favor do empregador** (pedido de demissão):
  divergente; o texto não fala em dias proporcionais para quem pede.
- **Prazo para pedir o seguro-desemprego** (7 a 120 dias): não confirmado.
- **Liberações extraordinárias do saque-aniversário** (MPs de 2025): não
  confirmadas; fora do texto.

## Decisões

- **Calculadora no topo** ("cálculo" é a 1ª sugestão do autocompletar):
  contrato sem prazo, aviso indenizado ou trabalhado, férias vencidas (0 ou
  1), saldo do FGTS opcional para a multa. Não cobre experiência, pedido de
  demissão, acordo nem verbas variáveis (aviso na própria calculadora).
- **Um H2 por pergunta do PAA** e por sugestão do autocompletar (FGTS,
  seguro-desemprego, 13º, pedido de demissão). FAQ com 5 (prazo, dias de
  aviso, aviso trabalhado, multa no pedido, saque-aniversário).
- **Multa do art. 477** sem valor da parte administrativa (BTN, unidade
  extinta): só "um salário" ao trabalhador.
- **Página própria da calculadora** (`/calculadoras/rescisao`) vem em
  seguida, com os prints de "calculadora rescisão".

## Para medir

A partir de ~10/11 e no pico de dezembro e janeiro: "demissão sem justa
causa o que recebe", "rescisão sem justa causa cálculo", "multa demissão
sem justa causa", "quem ganha 1500 recebe quanto de rescisão", "trabalhei
45 dias e fui demitido".

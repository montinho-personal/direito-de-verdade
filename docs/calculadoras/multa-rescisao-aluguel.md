# Calculadora: multa por quebra de contrato de aluguel 2026 (`/calculadoras/multa-rescisao-aluguel`)

Publicada em 27/10/2026, a pedido do Renato ("Prompt mestre — Calculadora de multa por
quebra de contrato de aluguel 2026"), sem os prints do Google. Ferramenta
`calculadora-multa-aluguel` (`src/components/calculadora-multa-aluguel.tsx` e
`src/components/aluguel/textos.tsx`); motor em `src/lib/aluguel/multa.ts`; testes em
`tests/multa-aluguel.test.mjs`, com referência em `tests/referencia/multa_aluguel.py`.

## Por que existe

Busca principal: `calculadora multa rescisão aluguel`. Secundárias do prompt: `multa
quebra contrato aluguel`, `como calcular multa de aluguel`, `multa proporcional aluguel`,
`sair antes do fim do contrato`, `multa de 3 aluguéis proporcional`, `quebra de contrato
de locação`, `multa aluguel 30 meses`, `transferência de trabalho multa aluguel`,
`rescisão contrato aluguel inquilino`. Sem volume confirmado.

**Canibalização:** o artigo `/artigos/multa-contrato-de-aluguel` (23/10) mira a dúvida
informativa ("multa de contrato de aluguel", "quando não paga"). A calculadora mira a
ferramenta ("calculadora", "como calcular", "proporcional"): seções curtas e link para o
artigo no aprofundamento (aviso, vistoria, caução, fiador). O artigo agora linka a
calculadora (atualizadoEm 27/10). URL no padrão `/calculadoras/...`.

## Prints recebidos

Primeira revisão com o **Google SEO Research Lab** (16/11/2026): página de resultados salva no
Chrome do Renato e lida pelo laboratório; o autocompletar veio da tentativa de coleta automática
(bloqueada pelo Google logo depois). Evidências em `prints/multa-rescisao-aluguel/`: o JSON com o
que foi lido da página (sem o HTML bruto, que traz dados da sessão) e o recorte do autocompletar.
As outras duas buscas vieram pelo **SerpApi** (Google Brasil, São Paulo, sem personalização), já sem print: JSON de cada uma na mesma pasta.

| print | conteúdo | onde entrou |
|---|---|---|
| `calculadora multa rescisão aluguel`, autocompletar | rescisão contrato aluguel · rescisão aluguel · **rescisória** · aluguel **proporcional** | `tituloSeo` "Calculadora de multa de rescisão de aluguel proporcional"; FAQ "Qual a fórmula da multa rescisória do aluguel?" |
| "As pessoas também perguntam" | não apareceu nessa busca | — |
| visão geral de IA | fórmula proporcional; exemplo R$ 2.000, 30 meses, restam 12 → R$ 2.400; exceção da transferência; cita Pilota Imóveis e Imobiliária Razão | não é fonte; confirma a fórmula e a exceção que a página já tinha. O site não é citado |
| "Outras pessoas pesquisaram" | como calcular 12 meses · 30 meses · quanto é de 12 meses · de 6 meses · lei do inquilinato · multa proporcional aluguel · quinto andar · rescisão de contrato de trabalho | H3 "Quanto é a multa em contrato de 12, 30 ou 6 meses?"; H2 renomeado "Multa de rescisão do contrato de aluguel: o que diz a Lei do Inquilinato?"; link para a calculadora de rescisão trabalhista (quem buscou a multa do contrato de trabalho). "quinto andar" (marca): fora |
| orgânicos (9) | imobiliárias com calculadora (Razão, CG Tecnologia, HouseUp, Alluxsi, Pilota, Primeiro Plano, Frias Neto, Rafael Sieiro) e um vídeo do YouTube; o site não está entre eles | `descricao` diz o que só a nossa tem: conta pelas datas, meses incompletos e quando não há multa |

| `multa proporcional aluguel`, autocompletar (SerpApi) | lei do inquilinato art · como calcular · artigo · lei · **jurisprudência** · cláusula · rescisória · contratual · rescisão antecipada | H3 "O que diz a jurisprudência sobre a multa proporcional?" (o parágrafo do STJ, que já existia) |
| `multa proporcional aluguel`, PAA | pedido de desocupação · reajuste após 3 anos · **Pode cobrar 20% de multa por quebra de contrato?** · O que diz o artigo 42 da Lei do Inquilinato? | FAQ "Pode cobrar multa de 20% ou 30%...?" (art. 4º e CC 413, já conferidos). Desocupação e reajuste: outros assuntos (há artigo de reajuste). Art. 42: sem texto conferido nesta pesquisa, fora (Pendente) |
| `multa proporcional aluguel`, visão de IA | proporcional ao tempo restante (art. 4º); fórmula; dispensas. Fontes: Feldmann Advocacia, Frias Neto, Imobiliária Razão, Crédito Real, Jusbrasil, QuintoAndar, Tecnisa, redes sociais | não é fonte; o site não é citado |
| `multa de 3 aluguéis proporcional`, autocompletar | nenhuma sugestão (busca longa) | — |
| `multa de 3 aluguéis proporcional`, PAA | Como calcular a multa do contrato de locação? · artigo 42 · **A multa contratual de 30% é abusiva?** · Estou devendo 3 meses de aluguel | cálculo já é H2; 30% na FAQ dos percentuais; dívida de aluguel/despejo: fora do escopo da calculadora |
| `multa de 3 aluguéis proporcional`, visão de IA | exemplo R$ 1.000, 30 meses, sai no 10º mês → R$ 2.000; dispensas, inclusive "problemas estruturais que o locador se recuse a consertar" | não é fonte. A dispensa por problema estrutural **não entrou**: não está no art. 4º lido (Pendente) |
| `multa de 3 aluguéis proporcional`, outras pesquisas | calculadora de multa de aluguel · 12, 30 e 6 meses · calcular multa rescisória · lei do inquilinato art | confirmam o H3 de 12, 30 e 6 meses e o título |
| orgânicos das duas | Lei do Inquilinato comentada, Jusbrasil, escritórios, imobiliárias, Instagram/Facebook; 1º lugar em `multa de 3 aluguéis proporcional` é uma calculadora de escritório | o site não aparece no top 8 de nenhuma |

As contas novas (R$ 6.000 ÷ 6, 12 e 30; metade do prazo; 2 meses restantes) são aritmética
sobre o art. 4º, já conferido; nenhum fato novo.

## Fontes confirmadas

Lei 8.245/1991, texto atualizado da Câmara baixado em 27/10/2026 (arts. 3º, 4º, 6º, 8º, 9º,
22, 23, 25, 37, 38, 46, 47, 48, 54-A, 56, 57 lidos).

| fato | fonte | tipo |
|---|---|---|
| Durante o prazo, locador não reaver; locatário devolve pagando multa pactuada proporcional ao período cumprido, ou a judicialmente estipulada | art. 4º, caput (redação da Lei 12.744/2012) | oficial |
| Dispensa da multa: transferência pelo empregador, privado ou público, para outra localidade, notificação escrita de 30 dias | art. 4º, par. único | oficial |
| Prazo indeterminado: aviso escrito de 30 dias; sem aviso, um mês de aluguel e encargos | art. 6º | oficial |
| Venda: comprador denuncia com 90 dias, salvo prazo determinado + cláusula de vigência averbada | art. 8º | oficial |
| Desfazimento: acordo, infração, falta de pagamento, reparos urgentes | art. 9º | oficial |
| ≥ 30 meses escrito: fim de pleno direito; prorrogação após 30 dias; denúncia com 30 dias | art. 46 | oficial |
| < 30 meses: prorrogação automática; retomada só nos incisos | art. 47 | oficial |
| Built to suit: multa convencionada até a soma dos aluguéis a receber | art. 54-A, § 2º | oficial |
| Não residencial: fim de pleno direito; prorrogação; denúncia com 30 dias | arts. 56 e 57 | oficial |
| Caução em dinheiro até 3 aluguéis, em poupança | art. 38, § 2º | oficial |
| Recibo discriminado; devolver no estado recebido; contas de consumo do locatário; IPTU do locador salvo contrato | arts. 22, VI e VIII; 23, III e VIII | oficial |
| Redução da multa excessiva ou de obrigação cumprida em parte | Código Civil, art. 413 | oficial |
| Abatimento proporcional ao período cumprido; multa compensatória também no despejo | STJ, REsp 1.906.869 (notícia 15/07/2022) | oficial |
| Redução por equidade, não proporcionalidade matemática (shopping) | STJ, notícia 28/05/2018 | oficial |
| Juizado até 40 SM; sem advogado até 20 | Lei 9.099/1995 | oficial |

## Fórmula e regras do motor

- Multa integral = aluguéis × aluguel (em décimos, aceita 2,5) ou valor fixo.
- Proporcional = integral × tempo restante ÷ prazo total, uma divisão só, arredondada ao
  centavo no fim.
- Tempo em meses e fração de mês: meses completos (mesmo dia do mês; 31 vira o último dia
  do mês curto) + dias que sobram ÷ dias daquele mês do contrato. Datas no mesmo dia dão
  meses exatos (exemplo do prompt: 10 de 30 → R$ 2.000).
- Desfechos: proporcional; sob medida (mín. entre multa e aluguéis restantes); transferência
  (só com empregador + outra localidade + aviso escrito de 30 dias; qualquer "não"/"não sei"
  → proporcional com aviso); prazo terminou (sem multa); prorrogado (aviso de 30 dias; sem
  aviso, até 1 aluguel + encargos mensais informados); acordo (valor combinado); sem multa no
  contrato (sem número: juiz); outra cláusula (sem conversão automática); retomada pelo
  proprietário (sem fórmula do inquilino; orientação dos arts. 4º, 8º, 9º, 46, 47, 57);
  descumprimento (proporcional só como referência, depende do juiz).
- Encargos: aluguéis, condomínio, IPTU (se do inquilino pelo contrato), contas, outros,
  menos já pagos; separados da multa; total pode indicar crédito; caução nunca descontada.

## Testes

14 testes: referência Python com frações exatas (9 casos: exemplo do prompt e do artigo,
mês incompleto, 31/01, saída no 1º e no último dia, valor fixo com arredondamento, prazo de
1 mês, valores extremos de 10 anos e R$ 1 milhão), aluguéis e fixo, prazo em meses,
encerrado/prorrogado/sem aviso, transferência completa e incompleta, indeterminado,
retomada (46 e 47), acordo, cláusula sem proporção, sem multa, sob medida, descumprimento,
multa zerada e alta, encargos e crédito, datas inválidas, meses incompletos. Playwright a
320 px com axe em todas as etapas e nos desfechos principais.

## Pendente

- O STJ não fixa a forma exata de contar meses incompletos; a fração por dias do mês é
  escolha da calculadora, explicada na página.
- Multa para o proprietário que pede o imóvel durante o prazo: depende do contrato; a
  calculadora só orienta.
- Despejo por falta de pagamento: multa compensatória depende do juiz (STJ admite).
- Lei 8.245, art. 42 (PAA): conferir o texto oficial antes de responder.
- Dispensa da multa por defeito grave do imóvel não consertado (visão de IA): sem fonte lida; seria descumprimento do locador (art. 22), a confirmar com jurisprudência.

## Decisões

- Perguntas da etapa 4 só quando mudam a conta (transferência, aviso, prorrogação, acordo,
  encargos). "Prazo determinado?" sai das datas, não de uma pergunta.
- Texto exato do prompt sobre o valor efetivamente devido no resultado proporcional.
- Sem SoftwareApplication (sem avaliações reais); Article, FAQPage e BreadcrumbList.
- AdSense só automático, sem bloco manual (mesma limitação das outras calculadoras).

## Analytics

`multa_aluguel_visualizada`, `_iniciada`, `_tipo_selecionado` (perfil, situação),
`_resultado` (perfil, situação, desfecho), `_pdf`, `_compartilhamento` (canal),
`_artigo_clicado` (destino). Nunca valores ou datas.

## Para medir

A partir de 10/11/2026 (revisão de 16/11: medir de novo a partir de 30/11): `calculadora multa rescisão aluguel`, `calculadora multa rescisória aluguel`, `multa aluguel 12 meses`, `multa proporcional aluguel`,
`multa de 3 aluguéis proporcional`, `multa aluguel 30 meses`. Conferir se a calculadora e o
artigo não disputam a mesma busca no Search Console.

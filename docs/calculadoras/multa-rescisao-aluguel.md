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

Nenhum. A printar: `calculadora multa rescisão aluguel`, `multa proporcional aluguel`,
`multa de 3 aluguéis proporcional`.

| print | conteúdo | onde entrou |
|---|---|---|

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

A partir de 10/11/2026: `calculadora multa rescisão aluguel`, `multa proporcional aluguel`,
`multa de 3 aluguéis proporcional`, `multa aluguel 30 meses`. Conferir se a calculadora e o
artigo não disputam a mesma busca no Search Console.

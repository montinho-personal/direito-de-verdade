# Simulador: direitos em compras online (`/calculadoras/simulador-direitos-compras-online`)

Publicado em 26/10/2026, a pedido do Renato ("Prompt mestre — Simulador de direitos em
compras online"), sem os prints do Google. Ferramenta `simulador-compras-online`
(`src/components/simulador-compras-online.tsx`); motor em `src/lib/compras-online/`
(`regras.ts` com fontes e data de revisão; `diagnostico.ts` com perguntas e diagnóstico);
testes em `tests/compras-online.test.mjs`.

## Por que existe

Busca principal: `direitos em compras online`. Secundárias do prompt: `produto não
entregue o que fazer`, `comprei pela internet e não recebi`, `produto com defeito comprado
online`, `prazo para devolução de compra online`, `loja não quer devolver dinheiro`,
`direito de arrependimento 7 dias`, `compra cancelada sem reembolso`, `produto diferente
do anunciado`. Sem volume confirmado. Pico: Black Friday (27/11/2026) e Natal.

**Canibalização:** cada secundária já tem artigo próprio (compra-nao-chegou,
produto-com-defeito, direito-de-arrependimento, loja-cancelou-pedido,
loja-e-obrigada-a-trocar-produto, estorno-cartao-de-credito, propaganda-enganosa). A
página do simulador mira só a busca ampla (`direitos em compras online`), resume cada
assunto em um parágrafo e manda para o artigo; os H2 não repetem os títulos dos artigos.
Usei `/calculadoras/...`, padrão das ferramentas do site, e não `/simulador-...` na raiz.

## Prints recebidos

Nenhum ainda. A printar: `direitos em compras online`, `comprei pela internet e não
recebi`; AnswerThePublic `compra online` já recebido em 23/10 (ver doc do arrependimento).

| print | conteúdo | onde entrou |
|---|---|---|

## Fontes confirmadas

| fato | fonte | tipo |
|---|---|---|
| Oferta obriga e integra o contrato | CDC, art. 30 (Câmara, normaatualizada) | oficial |
| Recusa da oferta: cumprimento, equivalente ou rescisão com restituição e perdas e danos | CDC, art. 35 | oficial |
| Deixar de estipular prazo é prática abusiva | CDC, art. 39, XII | oficial |
| Arrependimento: 7 dias da assinatura ou do recebimento, fora do estabelecimento; devolução imediata e atualizada | CDC, art. 49 | oficial |
| Vício: solidariedade, 30 dias para sanar, troca/restituição/abatimento; uso imediato em produto essencial ou se a troca de partes comprometer | CDC, art. 18, §§ 1º e 3º | oficial |
| Disparidade com embalagem ou publicidade é vício; quantidade | CDC, arts. 18 e 19 | oficial |
| Falsificado é impróprio | CDC, art. 18, § 6º, II | oficial |
| 30/90 dias; da entrega ou do aparecimento do vício oculto; reclamação obsta | CDC, art. 26 | oficial |
| Garantia legal independe de termo | CDC, art. 24 | oficial |
| Responsabilidade solidária de quem causou o dano | CDC, arts. 7º, par. único, e 25, § 1º | oficial |
| Site deve mostrar CNPJ, endereço, despesas, prazo de entrega, restrições | Decreto 7.962/2013, art. 2º | oficial |
| Confirmar pedido e reclamação; resposta em até 5 dias | Decreto 7.962, art. 4º, V, VI e parágrafo único | oficial |
| Arrependimento pelo mesmo canal; cancela contratos acessórios; estorno no cartão; confirmação imediata | Decreto 7.962, art. 5º | oficial |
| Decreto 11.034 (SAC, 7 dias, suspensão de cobrança) só para serviços regulados pelo Poder Executivo federal | Decreto 11.034/2022, art. 1º | oficial |
| Não entrega é descumprimento de oferta; cancelamento imediato | Procon-SP, compras pela internet | oficial |
| Plataformas respondem solidariamente | Procon-SP, 26/02/2026 | oficial |
| Sem frete de devolução; não exige embalagem lacrada | Procon-SP, Guia de Comércio Eletrônico | oficial |
| 7 dias corridos, a partir do dia seguinte | Procon-SP, perguntas frequentes | oficial |
| Personalizados, sob encomenda e perecíveis podem ficar fora | Procon-SC (entendimento, não lei) | oficial |
| Vício oculto na vida útil, depois da garantia | STJ, notícia de 11/04/2022 | oficial |
| MED: pedido em até 80 dias; análise em 7 dias; sem BO prévio | Banco Central, Guia do MED | oficial |
| Consumidor.gov.br: 10 dias para a empresa responder | Consumidor.gov.br | oficial |
| Juizado até 20 SM sem advogado | Lei 9.099/1995 | oficial |

## Fluxos e regras

- **Não chegou:** pagou? → meio → data prometida (ou "não sei" → o prazo passou?) → novo
  prazo (só se atrasou) → rastreio → contato → marketplace. Situações: sem pagamento, no
  prazo (o dia prometido ainda está no prazo), sem prazo informado, atrasado (art. 35).
- **Defeito:** durável? → recebimento → quando apareceu → data do defeito (oculto) →
  tentativa de solução → essencial? → marketplace. 7 dias do arrependimento; 30/90 dias
  da entrega ou do defeito (na dúvida, 30); conserto de 30 dias; escolha imediata se
  essencial; aviso de prazo talvez vencido (sem conclusão, cita o STJ da vida útil).
- **Diferente do anúncio:** o que veio → recebimento → contato → marketplace. Art. 30, 35,
  18 e 19; 7 dias.
- **Desistir:** onde comprou (loja física encerra o fluxo) → produto ou serviço → chegou?
  → data → personalizado/perecível → já pediu. 7 dias corridos do recebimento ou da
  contratação; antes de chegar, pode desistir. A exceção do Procon-SC vira aviso, não
  negativa.
- **Cancelei e não recebi:** motivo → data → meio → ainda na fatura? → já cobrou. Fundamento
  conforme o motivo (49, 18 ou 35); cartão: Decreto 7.962, art. 5º, § 3º; liga à
  calculadora de cobrança indevida quando a compra seguiu na fatura ou no cartão.
- **Loja não troca:** motivo → (sem defeito) onde e se anunciou troca; (defeito)
  durabilidade → recebimento. Sem defeito na loja física: sem obrigação legal, salvo troca
  anunciada; online: 7 dias; com defeito: conserto antes da troca.
- **Loja sumiu:** meio → data → CNPJ e endereço no site → marketplace. MED de 80 dias no Pix.
- **Golpe:** meio → data → avisou o banco. MED no Pix; contestação no cartão; BO.
- **Outro:** sem perguntas; direitos básicos e canais.

## Integrações

- Publicadas: calculadora de cobrança indevida (cancelei e não recebi, no cartão ou com a
  compra na fatura). A calculadora e o artigo `compra-nao-chegou` linkam o simulador.
- Futuras, sem link (campo `integracoesFuturas` do motor): Gerador de Reclamação ao
  Fornecedor (não chegou, defeito, diferente, desistir, cancelei, loja sumiu) e Simulador de
  Golpe do Pix (golpe e loja sumiu com Pix).

## Analytics

`simulador_compras_visualizado`, `_iniciado`, `_problema_selecionado` (problema),
`_etapa_concluida` (problema, número da etapa, id interno da pergunta), `_resultado`
(problema, situação), `_compartilhado` (canal: copiar, whatsapp, imprimir, ferramenta),
`_cta_clicado` (problema, destino). Nunca datas nem respostas. A desistência por etapa
sai de `_etapa_concluida`.

## Testes

18 testes em `tests/compras-online.test.mjs`: perguntas visíveis por fluxo, prazos (7
dias, 30/90, oculto, MED 80), dia limite, exceções, combinações, validação de datas e de
respostas fora da lista, respostas escondidas sem efeito, fontes existentes. Playwright a
320 px: axe sem violação no início, nas perguntas, no resultado; foco no título de cada
pergunta; eventos sem dados pessoais.

## Pendente

- **Exceções ao arrependimento:** só entendimento de Procon; não há regra na lei. Rever se
  sair norma ou tese do STJ.
- **Produto essencial:** o CDC não lista; o simulador não decide.
- **Dias corridos nos 30/90 dias:** escolha conservadora, o CDC não diz.
- **Marketplace:** citado o Procon-SP; não há tese repetitiva do STJ lida.
- **AdSense:** só anúncios automáticos; sem espaço manual reservado (mesma limitação das
  outras calculadoras).

## Decisões

- Uma pergunta por tela, com a contagem que se ajusta às respostas.
- SoftwareApplication fora (sem avaliação real; mesmo motivo da cobrança indevida).
- Correção paralela: o Decreto 11.034 (SAC) estava citado como regra geral na calculadora de
  cobrança indevida, no artigo de cobrança indevida e no "como reclamar no Procon"; agora
  vale só para serviços regulados pelo governo federal, e as lojas online têm 5 dias pelo
  Decreto 7.962.

## Para medir

A partir de 09/11/2026: `direitos em compras online`, `simulador direitos do consumidor`,
`comprei pela internet e não recebi o que fazer`. No GA4: problema mais escolhido e a etapa
com mais abandono.

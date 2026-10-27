# Simulador: direitos por voo atrasado ou cancelado 2026 (`/calculadoras/simulador-direitos-voo-atrasado-cancelado`)

Publicado em 27/10/2026, a pedido do Renato ("Prompt mestre — Simulador de direitos do
passageiro aéreo 2026"), sem os prints do Google. Ferramenta `simulador-voo`
(`src/components/simulador-voo.tsx`); motor em `src/lib/voo/` (`regras.ts` com vigências e
fontes; `diagnostico.ts` com perguntas, espera, diagnóstico por categoria e despesas);
testes em `tests/voo.test.mjs`.

## Por que existe

Busca principal do prompt: `direitos voo atrasado`. Secundárias: `voo cancelado direitos`,
`voo atrasado 4 horas`, `voo atrasado indenização`, `direitos do passageiro ANAC`, `voo
cancelado reembolso`, `bagagem extraviada direitos`, `overbooking direitos`, `assistência
material voo atrasado`, `companhia aérea não ofereceu alimentação`. Sem volume confirmado.
Pico: dezembro e janeiro.

**Canibalização (risco alto):** o artigo `/artigos/voo-atrasado-ou-cancelado` (21/10) já
mira "voo atrasado ou cancelado direitos". A página do simulador mira a intenção de
ferramenta ("simule", "simulador"), resume cada assunto e manda ao artigo; o artigo linka o
simulador no lead. Acompanhar no Search Console qual URL o Google escolhe para
`direitos voo atrasado`; se as duas disputarem, avaliar canonical ou reforçar a diferença.

## Prints recebidos

Nenhum para o simulador. A printar: `simulador direitos voo atrasado`, `voo atrasado 4
horas`, `companhia aérea não ofereceu alimentação`, `overbooking direitos`.

| print | conteúdo | onde entrou |
|---|---|---|

## Fontes confirmadas (27/10/2026)

| fato | fonte | tipo |
|---|---|---|
| Res. 400 aplica-se ao transporte regular doméstico e internacional | Res. 400, art. 1º (cópia oficial Procon-GO) | oficial |
| Alteração programada: aviso de 72 h; > 30 min (doméstico) / > 1 h (internacional) sem concordância; falha de informação → assistência + 3 alternativas | art. 12 | oficial |
| Limite de 1.131 DES e declaração especial de valor | art. 17 | oficial |
| Requisitos do passageiro (documento, horário, visto, vacinas); descumprimento autoriza negar embarque | art. 18 | oficial |
| Informação imediata, atualização a cada 30 min, motivo por escrito (até 24/11/2026) | art. 20 original | oficial |
| Alternativas à escolha do passageiro: atraso > 4 h, cancelamento, preterição, conexão perdida por causa do transportador; oferta imediata se souber antes | art. 21 | oficial |
| Preterição; voluntário com compensação negociada não é preterição; compensação imediata de 250/500 DES | arts. 22 a 24 | oficial |
| Atraso/cancelamento ≠ alteração programada | art. 25 | oficial |
| Assistência: original > 1 h comunicação, > 2 h alimentação, > 4 h hospedagem com pernoite + traslado, a bordo com portas abertas; morador; PNAE; cessa com reembolso ou reacomodação de conveniência | art. 27 original | oficial |
| Desde 26/10/2026: assistência "no território nacional"; > 2 h alimentação (crédito, refeição ou equivalente); > 4 h hospedagem com pernoite + transporte; morador; PNAE; sem comunicação; 25-A, 25-B, 26 par. único, 27-A, 27-B (reembolso de despesas em 7 dias) | Res. 813/2026 (texto compilado ANAC) | oficial |
| Vigência: art. 20 novo em 25/11/2026; resto em 26/10/2026 | Res. 819/2026, publicada em 26/10/2026 | oficial |
| Reacomodação, reembolso (7 dias, integral ou proporcional), crédito só com concordância | arts. 28 a 31 | oficial |
| Bagagem: protesto imediato; 7/21 dias; indenizar em 7 dias; avaria em 7 dias; despesas fora do domicílio; item frágil | arts. 32 a 34 | oficial |
| Dano extrapatrimonial depende de prova do prejuízo | CBA, art. 251-A | oficial |
| Força maior no atraso: mau tempo com restrição do controle do espaço aéreo, infraestrutura, autoridade | CBA, art. 256, § 1º, II e § 3º | oficial |
| Convenções prevalecem nos danos materiais (Tema 210); não nos morais (Tema 1.240) | STF, notícias oficiais | oficial |

## Regras do motor

- Espera = horário de saída (ou "agora") − previsto, ambos na hora local do aeroporto de
  partida: o fuso do aparelho não entra. Saída antes do previsto = 0. Cancelamento e
  outros fluxos usam faixas de espera.
- Marcos "superior a": 61 min, 121 min, 241 min. Regime pela data do voo (< 26/10/2026:
  original com comunicação; ≥: Res. 813). Informação: regra antiga até 24/11/2026.
- Hospedagem: pernoite e não morador; morador → transporte até casa; PNAE → sem exigir
  pernoite; sem pernoite → aviso.
- Território: partida do exterior → sem a assistência da ANAC, com aviso; voo só no
  exterior → fora do alcance (sem informação nem assistência); saída do Brasil → vale.
- Categorias separadas: informação, assistência, alternativas, reembolso, ressarcimento,
  compensação, indenização.
- Preterição só com apresentação no horário e documentos; voluntário, documentação e
  atraso do passageiro não são preterição.
- Conexão: mesma reserva e causa do transportador → alternativas; reservas separadas →
  aviso; motivo do passageiro → sem obrigação.
- Despesas: soma por categoria do que o usuário declara; texto deixa claro que não é valor
  devido.

## Correção no artigo de voo (27/10/2026)

A Res. 819/2026, publicada em 26/10/2026, adiou para 25/11/2026 as novas regras de
informação (art. 20). O artigo dizia que tudo valia desde 26/10. Corrigido: lead, lista do
que mudou, descrição, fontes. Também saiu a afirmação de que a assistência vale "a bordo
com portas abertas" como regra atual: o novo caput do art. 27 não repete a frase; o artigo
agora diz isso e manda pedir a assistência assim mesmo.

## Pendente

- Texto compilado oficial da Res. 400 com as alterações (o PDF compilado não abriu no site
  da ANAC); conferir o caput do art. 27 e a frase "a bordo com portas abertas".
- Valor do DES em reais: não embutido (muda todo dia).
- Limites de indenização de bagagem no internacional (Convenção de Montreal): não
  embutidos; o texto manda ao tratado aplicável.
- Prazo para ação (CBA 2 anos x CDC 5 anos; STF Tema 1.240 para dano moral): não
  incluído no simulador.
- Regras de outros países (por exemplo, União Europeia): fora do alcance.

## Decisões

- Uma pergunta por tela; checklist e despesas só no resultado, sem guardar nada.
- Sem SoftwareApplication (sem avaliações reais); Article, FAQPage e BreadcrumbList.
- AdSense só automático, sem bloco manual (mesma limitação das outras ferramentas).

## Analytics

`voo_simulador_visualizado`, `voo_simulador_iniciado`, `voo_tipo_problema` (problema),
`voo_etapa_concluida` (problema, etapa, id da pergunta), `voo_resultado_exibido`
(problema, situação), `voo_despesas_calculadas` (problema), `voo_pdf_gerado`,
`voo_compartilhamento` (canal), `voo_artigo_clicado` (destino). Nunca horários, rotas,
valores ou reservas.

## Testes

19 testes: fluxos e perguntas, atraso até 1 h, marcos de 1/2/4 h (61/121/241 min), regime
anterior com comunicação, hospedagem (pernoite, morador, PNAE), assistência oferecida e não
oferecida, espera com virada de dia e fuso, conexão (mesma reserva, separadas, passageiro),
cancelamento com antecedência e no dia, preterição nacional/internacional/voluntário/
documentação, bagagem 7/21 dias e despesas, avaria em 7 dias, alteração de horário,
território, força maior, informação antes e depois de 25/11, validação de datas e opções,
despesas e fontes. Playwright a 320 px com axe nas perguntas de cada tipo, no resultado,
nas despesas e na preterição.

## Para medir

A partir de 10/11/2026: `direitos voo atrasado`, `voo atrasado 4 horas`, `companhia aérea
não ofereceu alimentação`, `overbooking direitos`; comparar com o artigo de voo.

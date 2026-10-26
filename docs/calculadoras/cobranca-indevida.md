# Calculadora: cobrança indevida 2026 (`/calculadoras/cobranca-indevida`)

Publicada em 26/10/2026, a pedido do Renato ("Prompt mestre — Calculadora de
Cobrança Indevida 2026"), sem os prints do Google (pedido dele: publicar e revisar
depois). Ferramenta nova `calculadora-cobranca-indevida`
(`src/components/calculadora-cobranca-indevida.tsx` e
`src/components/cobranca-indevida/textos.tsx`); motor em `src/lib/cobranca-indevida/`
(`regras.ts`, `ipca.ts`, `calculo.ts`). Liga com `/artigos/cobranca-indevida` nos dois
sentidos.

## Por que existe

O artigo de cobrança indevida explica o dobro, mas não faz a conta de várias
cobranças, com datas, pagamento parcial, estorno parcial e correção. A busca
principal é `calculadora de cobrança indevida`; secundárias: `devolução em dobro`,
`como calcular cobrança indevida`, `repetição de indébito cálculo`. Sem volume
confirmado (não inventar). Pico esperado: faturas depois da Black Friday e do fim
de ano.

## Prints recebidos

Nenhum ainda. Buscas a printar: `calculadora cobrança indevida`, `devolução em
dobro`; AnswerThePublic `cobrança indevida`. Quando chegarem, salvar em
`docs/calculadoras/prints/cobranca-indevida/` e revisar título, H2 e FAQ.

| print | conteúdo | onde entrou |
|---|---|---|

## Fontes confirmadas

Pesquisa de 22 e 26/10/2026; downloads em `scratchpad/cob/` e `scratchpad/cobcalc/`
da sessão.

| fato | fonte | tipo |
|---|---|---|
| Dobro do que pagou em excesso, com correção e juros legais, salvo engano justificável | CDC, art. 42, parágrafo único (planalto.gov.br, l8078compilado) | oficial |
| Dobro independe de má-fé; basta contrariar a boa-fé objetiva | STJ, EAREsp 676.608/RS, inteiro teor (DJe 30/03/2021) | oficial |
| Modulação: em contratos de consumo sem serviço público do Estado ou de concessionária, a regra só atinge cobranças "pagas após a data da publicação do presente acórdão" | idem, ementa | oficial |
| Prazo de 10 anos (CC 205) para telefonia, como na Súmula 412 (água e esgoto) | EAREsp 676.608; Súmula 412 | oficial |
| Tema 929 julgado em 15/09/2026; "Aguardando a publicação do acórdão"; acórdão sem data de publicação | página do Tema 929 no STJ, consultada em 26/10/2026 | oficial |
| Correção pelo IPCA quando o índice não foi convencionado nem está em lei específica | CC, art. 389, parágrafo único (Lei 14.905/2024) | oficial |
| Juros de mora desde a citação inicial | CC, art. 405 | oficial |
| Taxa legal = Selic − IPCA; metodologia do CMN, divulgada pelo BCB | CC, art. 406, §§ 1º e 2º; Resolução CMN 5.171/2024 (bcb.gov.br) | oficial |
| Restituição de quem recebeu o indevido; prova do erro por quem pagou voluntariamente | CC, arts. 876 e 877 | oficial |
| Dívida já paga cobrada na Justiça: dobro do que foi cobrado | CC, art. 940 (já no artigo) | oficial |
| IPCA número-índice dez/2009 a set/2026 (3017,59 a 7695,82) | IBGE Sidra 1737, v. 2266; igual à série 433 do BCB nos 141 meses desde 2015 | oficial |
| Telecom: dobro com correção e juros de 1% ao mês; índice da prestadora ou da Anatel (RGC, art. 64) | gov.br/anatel, "Cobrança" | oficial |
| Luz: dobro corrigido pelo IPCA, salvo erro do consumidor | gov.br/aneel, "Como resolver" | oficial |
| SAC: suspensão imediata da cobrança contestada; 7 dias para resposta | Decreto 11.034/2022 | oficial |
| Juizado: até 20 SM sem advogado; até 40 SM | Lei 9.099/1995, arts. 3º e 9º | oficial |

## Como a conta é feita (metodologia)

- Por cobrança: pago a mais = max(0, pago − correto). "Paguei tudo" usa pago = cobrado;
  "não paguei" zera o pago e leva ao cenário de contestação.
- Simples = Σ pago a mais − devolvido; dobro = 2 × Σ pago a mais − devolvido; mínimo 0.
  Os dois são alternativos e nunca somados.
- Correção: valor × IPCA(último mês divulgado) ÷ IPCA(mês do pagamento), em centavos,
  meio centavo para cima. O devolvido é corrigido da data da devolução. Correção nunca
  negativa.
- Juros: não calculados (ver Decisões).
- Repetições: "quantos meses seguidos" gera uma cobrança por mês no mesmo dia (31 vira o
  último dia do mês).
- Avisos: Tema 929; modulação (pagamento até 30/03/2021 fora de luz e água; telecom com
  ressalva da telefonia fixa); índice antes de 30/08/2024; pagamentos com mais de 5 ou
  10 anos; devolvido maior que o pago a mais; pagamento incerto; mês sem IPCA ainda.
- Testes: `tests/cobranca-indevida.test.mjs` contra a referência em Python
  (`tests/referencia/cobranca_indevida.py`): não paga, integral, parcial, abaixo do
  correto, múltiplas, devolvidos, devolvido maior, zerados, datas inválidas, modulação
  no dia e no dia seguinte, sem IPCA, mais de 5 e de 10 anos, arredondamento e limites.
  Conta conferida à mão: R$ 10.000 de set/2025 = R$ 10.457,61 em set/2026.
- Interface conferida no Playwright: 4 etapas a 320 px, axe sem violações em cada etapa,
  foco no título de cada etapa, máscara de moeda, eventos do GA4.

## Eventos do Analytics

`calculadora_cobranca_visualizada`, `_iniciada`, `_etapa_concluida` (etapa),
`_resultado` (situação, tipo do problema, pagamento, várias cobranças sim/não),
`_pdf`, `_compartilhamento` (canal), `_artigo_clicado` (destino). Nunca valores,
datas, nomes ou respostas da etapa 4.

## Pendente (revisão humana especializada)

- **Tema 929 do STJ:** tese a publicar. Quando sair, rever os avisos, a modulação e o
  texto "quando a devolução é em dobro". Pode mudar tudo o que é dobro.
- **Devolvido abatido do dobro:** a calculadora tira o valor estornado do dobro
  (2 × excesso − devolvido). É a leitura mais comum, mas não há tese vinculante lida;
  um advogado de consumidor deve confirmar.
- **Termo inicial e convenção da correção:** do mês seguinte ao pagamento (sem a
  inflação do próprio mês). Conservador; conferir com a prática dos tribunais e com a
  Calculadora do Cidadão.
- **Índice antes de 30/08/2024:** a calculadora usa o IPCA em todo o período, com aviso;
  tribunais estaduais usavam tabelas próprias (INPC, por exemplo).
- **Telecom:** internet e TV tratadas como contrato privado na modulação; telefonia fixa
  com ressalva. Juros de 1% ao mês da Anatel não calculados: o RGC não diz o termo
  inicial no trecho lido.
- **Prazo fora de água, esgoto e telefonia:** não fixado; só aviso de 5 e 10 anos.
- **Planalto fora do ar** em parte da pesquisa: textos do CDC e do CC lidos nos
  arquivos baixados em 22/10/2026.

## Decisões

- **Juros fora da conta:** o CC 405 manda contar da citação, data que a pessoa não tem;
  1% ao mês fixo seria sem fundamento (pedido do prompt). O resultado explica e manda à
  Calculadora do Cidadão do BCB.
- **SoftwareApplication fora:** sem avaliações reais, e exigiria mexer no componente de
  todas as páginas; a página já tem Article, FAQPage e BreadcrumbList.
- **Sem parâmetros de URL:** nada do que é digitado vai para o endereço, para não gerar
  páginas duplicadas nem expor valores; compartilhar só por clique (copiar, WhatsApp,
  imprimir/PDF).
- **AdSense:** o site usa anúncios automáticos, sem espaço manual dentro do formulário.
  Não há como reservar espaço fixo sem criar bloco manual; fica como melhoria futura.
- **URL:** `/calculadoras/cobranca-indevida`, no padrão das outras calculadoras (o
  prompt sugeria `/calculadora-cobranca-indevida`).
- **Gerador de reclamação:** planejado, não feito (pedido do prompt).
- **Nada de dano moral calculado** nem promessa de valor.

## Para medir

A partir de 09/11/2026 no Search Console: `calculadora de cobrança indevida`,
`calculadora devolução em dobro`, `cobrança indevida valor em dobro`, `como calcular
cobrança indevida`. No GA4: taxa de `_resultado` sobre `_iniciada` e a etapa em que
mais gente para.

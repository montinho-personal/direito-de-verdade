# Artigo: reajuste do aluguel (`/artigos/reajuste-do-aluguel`)

Escrito e publicado em 29/10/2026 **sem os prints do Google nem o AnswerThePublic**,
a pedido do Renato ("Pode criar os dois próximos artigos aí"). Quando os relatórios
chegarem: salvar em `docs/artigos/prints/reajuste-do-aluguel/`, revisar título, H2 e FAQ
e preencher a tabela.

## Por que existe

Busca alta o ano todo, com pico na virada do ano (contratos e mudanças de janeiro).
Terceiro conteúdo de Moradia, ao lado da multa de aluguel (artigo e calculadora).

## Prints recebidos (SerpApi, 24/11/2026)

Revisão da rotina diária, 2 buscas, celular, São Paulo. JSON em `prints/reajuste-do-aluguel/`, com os dados do Banco Central usados na tabela (séries 189 e 433).

| busca | conteúdo | onde entrou |
|---|---|---|
| `reajuste aluguel`, autocompletar | **reajuste aluguel <mês> 2026** (abril, junho, julho, agosto, setembro, outubro: 9 variações) · **2026 IGP-M / IPCA** · cálculo exato (marca) · igpm · ipca | `tituloSeo` "Reajuste do aluguel 2026: IGP-M e IPCA de cada mês"; H2 novo com a tabela do acumulado em 12 meses de dez/2025 a out/2026 (Banco Central). "Cálculo exato": fora (nome de site) |
| idem, PAA | Como vão ficar os aluguéis em 2026? · **Como calcular o reajuste para janeiro de 2026?** · **Qual o IPCA para reajuste em 2026?** · **Qual o IGP-M dos últimos 12 meses?** | tabela do H2 novo (cada mês); a conta já era H2. "Como vão ficar": fora (projeção) |
| idem, outras pesquisas | **calculadora de reajuste de aluguel (2026)** · **tabela de reajuste 2026** · por mês (novembro, abril, agosto, setembro, março) · igpm · ipca | tabela do H2 novo; a calculadora oficial do BC já estava. **Calculadora própria: vai para a pauta** (ver Formato) |
| idem, visão de IA | só `page_token` (não pedida, pelo orçamento) | — |
| `reajuste aluguel igpm ou ipca`, autocompletar | reajuste igpm ou ipca · contrato · **qual o melhor** · igpm ou inpc · igpm outubro | H3 novo "IGP-M ou IPCA: qual aumenta mais?" (com os números de 2026, sem recomendar um índice) |
| idem, PAA | **Qual aumenta mais, IGP-M ou IPCA?** · Projeção do IGP-M para 2026 · Reajuste pelo IPCA · Como calcular o IGP-M? | H3 novo; tabela. Projeção e metodologia da FGV: fora (projeção não é fato; FGV não lida) |
| idem, visão de IA | "o IPCA costuma ser a escolha mais equilibrada"; IGP-M volátil, com peso do atacado; lei permite escolher o índice, menos câmbio e salário mínimo; combinar o índice negativo. Fontes: QuintoAndar, Exame, imobiliárias | não é fonte. Recomendação de índice: fora (o site não dá veredito). **Índice negativo: entrou** como H3, só com o que a lei diz (o contrato decide) |
| orgânicos | `reajuste aluguel`: **Cálculo Exato, Debit e MySide (calculadoras)**, **CRECISP (tabela de índices)**. `igpm ou ipca`: imobiliária, Corecon-PR, Estadão Imóveis, blogs, Jusbrasil, Instagram | o site não aparece. 1ª busca dominada por calculadoras |

**Formato (estratégia 1 do CLAUDE.md):** os 4 primeiros resultados de `reajuste aluguel` são calculadoras e tabelas. A peça que disputa essa busca é uma **ferramenta**: calculadora de reajuste de aluguel com o IGP-M e o IPCA de cada mês. Entra na pauta como "vale um artigo" (calculadora); este artigo ganhou a tabela enquanto isso.

## Fontes confirmadas (29/10/2026)

| fato | fonte | tipo |
|---|---|---|
| Livre convenção; proibido moeda estrangeira, câmbio e salário mínimo (art. 17); novo valor e cláusula de reajuste por acordo (art. 18); revisão judicial depois de 3 anos, a preço de mercado (art. 19); aluguel provisório (art. 68); retroage à citação (art. 69) | Lei 8.245/1991, texto atualizado (Câmara) | oficial |
| Reajuste por índices gerais ou setoriais em contratos de 1 ano ou mais; nulo com periodicidade inferior a 1 ano; nulos os expedientes equivalentes | Lei 10.192/2001, art. 2º, §§ 1º e 3º (PDF atualizado da Câmara) | oficial |
| Correção por IGP-M, IPCA, INPC, IGP-DI | Banco Central, Calculadora do Cidadão | oficial |

| IGP-M e IPCA mensais (jan/2025 a out/2026), acumulado em 12 meses calculado pelo produto das variações | Banco Central, SGS, séries 189 e 433 (API pública), consultadas em 24/11/2026; JSON em `prints/` | oficial |

## Pendente

- **Aplicado em 18/11/2026:** FAQ "É possível reajustar o aluguel depois de 3 anos de contrato?" (art. 19 conferido na Câmara). Era: PAA "É possível reajustar o aluguel após 3 anos de contrato?". Conferir a revisão do art. 19 da Lei 8.245 na próxima revisão.

- Índice negativo (deflação do IGP-M): o artigo diz só que a lei não trata e que o contrato decide (H3 de 24/11/2026). Se houver decisão do STJ, rever.
- Projetos de lei que trocam o IGP-M pelo IPCA nos aluguéis: nenhum aprovado conferido; fora.
- Cobrança de reajuste atrasado: sem regra específica conferida; a FAQ manda negociar e procurar orientação.

## Decisões

- Exemplo com índice **hipotético** (4,5%): os índices mudam todo mês, e a Calculadora do Cidadão faz a conta oficial.
- `tituloSeo` "Reajuste do aluguel 2026: IGP-M e IPCA de cada mês" (50), pelo autocompletar de 24/11/2026 (mês + 2026).
- A tabela mensal precisa ser **atualizada a cada revisão** e virar 2027 em janeiro; entra na revisão anual da pauta.

## Para medir

A partir de ~12/11/2026: "reajuste aluguel", "reajuste aluguel 2027", "igpm aluguel",
"calcular reajuste aluguel".

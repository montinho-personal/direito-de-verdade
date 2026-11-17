# Artigo: pensão alimentícia (`/artigos/pensao-alimenticia`)

Escrito e publicado em 23/10/2026 **sem os prints do Google**, a pedido do Renato
("Pode criar próximos 2 artigos", seguindo o combinado de 22/10). Quando os prints
chegarem: salvar em `docs/artigos/prints/pensao-alimenticia/`, revisar título, H2
e FAQ e preencher a tabela abaixo.

## Por que existe

"Pensão alimentícia" e "quanto é a pensão alimentícia" são das buscas mais altas
de Família, o ano todo. O grupo de Família só tinha o artigo da pensão no 13º;
este é o artigo-base, e os dois se linkam. Liga também com a calculadora de
imposto de renda (líquido do salário) e com o 13º.

## Prints recebidos (SerpApi, 17/11/2026)

Revisão da rotina diária, com 2 buscas (celular, São Paulo). JSON em `prints/pensao-alimenticia/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `pensão alimentícia`, autocompletar | **até qual idade / até quantos anos / 18 ou 21** (5 variações) · **2026** · esposa com mais de 40, 50 e 60 anos · **descontado do salário bruto ou líquido** · **quem ganha um salário mínimo** · como funciona · filha mulher até que idade · conta como renda no Bolsa Família | `tituloSeo` com "2026" e "até que idade"; H2 "Até que idade… 18, 21 ou 24 anos?" (a lei não fixa; filho e filha iguais; ex-cônjuge sem idade, arts. 1.708 e 1.699); H3 "bruto ou líquido?"; linha de 1 mínimo na tabela. Esposa "com mais de 50/60" e Bolsa Família: fora (abaixo) |
| idem, PAA | **Quem ganha R$ 3000 paga quanto?** · **Como funciona para 1 filho?** · **O que diz a nova lei?** · Como consultar pelo CPF? | H3 "Quem ganha R$ 3.000…" com a conta de 2026 (INSS R$ 248,60, IR zero, líquido R$ 2.751,40); H3 "1 filho ou 2 filhos"; H2 do Pix Pensão. CPF: fora |
| idem, outras pesquisas | como calcular · como dar entrada · como funciona · filho · lei · 18 ou 21 · **valor 2 filhos** · porcentagem · quando o filho perde o direito · justiça gratuita · pela internet · vitalícia | 2 filhos no H3; o resto já é coberto (cálculo, como pedir, Defensoria, maioridade). "Vitalícia" e "pela internet": fora |
| idem, visão de IA | sem valor fixo; necessidade × possibilidade; quem tem direito (filhos até ~24 anos se estudantes, ex-cônjuge temporário, gestante, outros parentes); desemprego não elimina; prisão, penhora, protesto, desconto, SPC; não acaba aos 18. Fontes: Jusbrasil, Wikipedia, YouTube, MPPR, Defensorias SP, ES e RJ, Estadão, Aurum, VLV, gov.br | não é fonte. Resposta em lista com subtítulos e sem número de valor; nosso lead já responde igual e agora traz o exemplo em reais. "24 anos" e alimentos gravídicos sem fonte oficial lida: fora |
| idem, vídeos | carrossel de vídeos do YouTube no topo (Me Julga e outros) | registrado: busca com vídeo; texto disputa abaixo deles |
| `quanto é a pensão alimentícia`, autocompletar | **de um salário mínimo** · baseada no salário mínimo · de um filho · de duas crianças · **2026** · para 2 filhos · **quanto tempo pode atrasar** · quanto por cento · porcentagem | linha de 1 mínimo; H3 2 filhos; FAQ "Quanto tempo a pensão pode atrasar?" (Súmula 309, sem tolerância na lei) no lugar da FAQ do Pix, que virou H2 |
| idem, PAA | Qual o valor 2026 para 1 filho? · **Quem ganha R$ 3.000 paga quanto para 1 filho?** · **Qual a nova lei para 2026?** · Quem tem 1 filho paga quanto? | mesmas seções acima |
| idem, outras pesquisas | **Pix Pensão** (lei, quando entra em vigor, como solicitar, já está valendo, sancionado, Lei 15.479) · pensão por morte (outro assunto) | H2 "Qual a nova lei da pensão alimentícia? (Pix Pensão)" com vigência em julho de 2027, como pedir e falta de saldo (Agência Senado) |
| idem, visão de IA | sem valor na lei; "costume" de 15% a 30% para 1 filho; exemplo 30% de R$ 3.000 = R$ 900; 30% do mínimo = R$ 486,30; fatores (nº de filhos, gastos). Fontes: MPPR, escritório, YouTube, Jusbrasil, iFood Benefícios, Instagram, Cálculo Jurídico (simulador) | não é fonte. A faixa "15% a 30%" não tem fonte oficial lida: fora. O exemplo dela usa o bruto; o nosso usa o líquido, que é o que o STJ aplica quando a decisão fala em líquido |
| orgânicos | `pensão alimentícia`: Defensoria RJ (PDF), MPPR, gov.br (serviço da UFES, para servidor), Jusbrasil, Aurum, Defensoria CE, Defensoria ES. `quanto é…`: Agência Senado (Pix Pensão) e páginas de pensão por morte (resultado misturado) | o site não aparece. Concorrentes fortes (Defensorias e MP) na principal; na secundária, o Google confunde com pensão por morte: oportunidade para uma página que responda o valor com exemplo |

**Formato:** busca com carrossel de vídeos e com simulador entre as fontes da visão de IA. Uma calculadora de pensão seria possível só como conta de percentual sobre o líquido (sem "valor justo"); fica como ideia na pauta, não como promessa de valor.

## Fontes confirmadas

Pesquisa de 23/10/2026 (Planalto fora do ar: leis lidas na Câmara, texto atualizado).

| fato | fonte | tipo |
|---|---|---|
| Necessidade e possibilidade; sem percentual na lei; "sem desfalque do necessário" | Código Civil, arts. 1.694 § 1º e 1.695 (Câmara) | oficial |
| Recíproca entre pais e filhos; ascendentes; descendentes e irmãos; grau seguinte | CC, arts. 1.696 a 1.698 | oficial |
| Revisão, redução, exoneração | CC, art. 1.699 | oficial |
| Transmite aos herdeiros | CC, art. 1.700 | oficial |
| Pais contribuem na proporção dos recursos | CC, art. 1.703 | oficial |
| Irrenunciável | CC, art. 1.707 | oficial |
| Cessa com casamento, união estável ou concubinato do credor | CC, art. 1.708 | oficial |
| Prescrição de 2 anos; não corre durante o poder familiar | CC, arts. 206 § 2º e 197, II | oficial |
| Intimação em 3 dias; impossibilidade absoluta; protesto; prisão de 1 a 3 meses em regime fechado; 3 prestações; prisão não exime; desconto em folha até 50% do líquido; abandono material | CPC, arts. 528, 529 e 532 (Câmara) | oficial |
| Provisórios também executáveis | CPC, art. 531 | oficial |
| Acordo referendado por Defensoria, MP, advogados ou conciliador é título executivo | CPC, arts. 784, IV, e 911 | oficial |
| Salário e poupança penhoráveis para pensão | CPC, art. 833 § 2º | oficial |
| Súmulas 309, 358, 594, 596 e 621 (textos conferidos) | STJ, scon.stj.jus.br | oficial |
| Desemprego não extingue; percentual alternativo do mínimo; caso de 20% e 54% do mínimo | STJ, notícia de 07/08/2026 (processo em segredo) | oficial |
| INSS e IR fora da base (rendimentos líquidos) | STJ, Informativo 533 (REsp 1.159.408) | oficial |
| Tema 192 (13º e terço de férias) | STJ | oficial |
| IR: dedutível para quem paga, isento para quem recebe (ADI 5.422) | Receita Federal | oficial |
| Pix Pensão, Lei 15.479/2026, vigência em julho de 2027 | Câmara dos Deputados | oficial |
| Salário mínimo de R$ 1.621 | Decreto 12.797/2025 | oficial |
| Pix Pensão: publicada em 30/07/2026, vigor um ano depois, pedido no cumprimento de sentença, conteúdo da decisão, bloqueio e penhora se faltar saldo (17/11/2026) | Agência Senado | oficial |
| R$ 3.000 em 2026: INSS R$ 248,60, IRRF zero, líquido R$ 2.751,40; 1 mínimo: líquido R$ 1.499,42 (17/11/2026) | motor `src/lib/tributos` com as tabelas do INSS e da Receita de 2026 | oficial (conta) |

## Pendente

- Faixa "20% a 30% por filho": aparece em Defensorias (CE, MT) pelos resultados de
  busca, mas os sites não abriram daqui (bloqueados pelo proxy). Ficou de fora.
- Idade limite (universitário, "24 anos"): sem fonte oficial aberta; o texto diz só
  que a lei não fixa idade e que o juiz decide caso a caso.
- Lei 5.478/1968 (Lei de Alimentos) e Lei 11.804/2008 (alimentos gravídicos): não
  abriram (Planalto fora do ar, Câmara 404). Alimentos gravídicos ficou de fora.

## Decisões

- Título "Pensão alimentícia 2026: quanto é e até que idade" (49), em 17/11/2026: "2026" e "até que idade" são os termos que mais aparecem no autocompletar.
- Fora em 17/11/2026: "esposa com mais de 50/60 anos" e "pensão vitalícia" (sem fonte oficial lida sobre prazo da pensão do ex-cônjuge; vale artigo próprio se houver fonte do STJ); "consultar pelo CPF" (não há consulta pública oficial; processos de família correm em segredo); "conta como renda no Bolsa Família" (regra do MDS, fora do tema; pauta); faixa "15% a 30%" e "24 anos" (sem fonte oficial lida).
- Exemplos com líquido redondo (R$ 2.700) em vez de salário bruto: o IR do salário
  depende da própria pensão (dedução), e a conta circular confundiria.
- Sem tabela de "valor por número de filhos": não existe regra oficial.
- Ligações: pensão no 13º (as duas direções), calculadora de imposto de renda.

## Para medir

A partir de ~7/11/2026: "pensão alimentícia", "quanto é a pensão alimentícia",
"pensão alimentícia valor", "pensão alimentícia 30%", "pensão alimentícia
desempregado", "até que idade paga pensão". Revisão anual em janeiro (salário
mínimo no exemplo) e em julho de 2027 (Pix Pensão em vigor).

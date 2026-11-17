# Artigo: BPC/LOAS 2026 (`/artigos/bpc-loas`)

Escrito e publicado em 23/10/2026 **sem os prints do Google**, a pedido do Renato
("Pode criar próximos 2 artigos"). Quando os prints chegarem: salvar em
`docs/artigos/prints/bpc-loas/`, revisar título, H2 e FAQ e preencher a tabela.

## Por que existe

BPC/LOAS é busca alta o ano todo e o segundo artigo de Previdência e INSS. Liga
com auxílio-doença (quem não tem qualidade de segurado), nos dois sentidos.

## Prints recebidos (SerpApi, 17/11/2026)

Revisão da rotina diária, com 2 buscas (celular, São Paulo). JSON em `prints/bpc-loas/`.

| busca | conteúdo | onde entrou |
|---|---|---|
| `bpc loas`, autocompletar | quem tem direito · **pode fazer empréstimo** (5 variações: 20 mil, 30 mil, 2026, consignado) · **autismo** · **tem direito a décimo terceiro** (2) · **foi criado em qual governo / quem criou** · requisitos · idoso · pode trabalhar de carteira assinada · valor | H3 "Quais doenças… Autismo"; H3 "O BPC tem 13º?"; FAQ "Quem criou o BPC/LOAS?" (Lei 8.742/1993, sem citar governo); trabalho já era H2. **Empréstimo: fora** (lei do consignado não abriu; abaixo) |
| idem, PAA | Para que serve? · Como saber o dia do pagamento? · **O que faz o idoso perder o BPC?** · **Qual o valor para pessoa com deficiência?** | H2 "O que faz perder o BPC?" com a lista da LOAS (renda, CadÚnico e CPF, outro benefício, irregularidade, morte); H2 do valor "para idoso e pessoa com deficiência". Dia do pagamento: fora (calendário oficial não lido) |
| idem, outras pesquisas | quem tem direito · como solicitar · autismo · lei · quem criou · é aposentadoria · calendário · idoso · Meu INSS | já cobertos (H2, FAQ "BPC é aposentadoria?", passo a passo no Meu INSS); calendário fora |
| idem, visão de IA | R$ 1.621 em 2026; 65+ ou deficiência de 2 anos; renda até 1/4 (R$ 405,25); sem contribuição; sem 13º e sem pensão; CadÚnico atualizado em 2 anos; Meu INSS ou 135. Fontes: gov.br, Previdenciarista, Barbieri Advogados, Facebook | não é fonte; bate com o texto (mesmos números). Formato: lista com subtítulos, valor em reais no começo; nosso lead já faz isso |
| idem, vídeos | carrossel de vídeos e shorts no topo | registrado: busca com vídeo |
| `bpc loas quem tem direito`, autocompletar | mulher · como solicitar · **autismo / autista** · 2026 · **TDAH** · renda familiar · valor · **fibromialgia** · PcD · **diabetes** · **doença / quais doenças** · **ansiedade** | H3 "Quais doenças dão direito? Autismo, TDAH, fibromialgia": a LOAS não tem lista; vale o impedimento de longo prazo na avaliação; autismo é deficiência por lei (Lei 12.764, art. 1º, § 2º); `tituloSeo` com "doenças" |
| idem, PAA | Quem recebe pode receber [outro]? · **Quem recebe tem que fazer perícia?** · **Qual é a nova lei do BPC?** · valor para PcD | perícia: frase no H2 da revisão (art. 21, § 5º); acumulação já no texto. "Nova lei": só a menção às mudanças de 2024 e 2025 na FAQ; detalhar fica pendente |
| idem, visão de IA | igual à anterior, mais nacionalidade, avaliação biopsicossocial e CRAS. Fontes: gov.br, Abrale, Conjur, Jusbrasil, Projuris, escritórios, YouTube, Facebook | não é fonte; bate |
| orgânicos | `bpc loas`: monitordomercado (2x), **Facebook (2x)**, **YouTube**, Conjur, Legador. `quem tem direito`: blogs de advogados, Prevfácil, previdencia.gov.br (link antigo), Jusbrasil | o site não aparece. **Concorrentes fracos** (portal de notícias, rede social, vídeo): prioridade alta para medir |

## Fontes confirmadas

Pesquisa de 23/10/2026. Planalto fora do ar: LOAS lida na Câmara (texto atualizado,
com as Leis 15.077/2024, 15.156/2025 e 15.157/2025).

| fato | fonte | tipo |
|---|---|---|
| Um salário mínimo; idoso de 65+ e pessoa com deficiência | LOAS, art. 20 | oficial |
| Composição da família sob o mesmo teto | LOAS, art. 20, § 1º | oficial |
| Deficiência; longo prazo de 2 anos; avaliação médica e social; telemedicina | LOAS, art. 20, §§ 2º, 6º e 10; art. 40-B | oficial |
| Renda de até 1/4 do mínimo; soma sem deduções não previstas | LOAS, art. 20, §§ 3º e 3º-A | oficial |
| Fora da renda: estágio, aprendizagem, barragem; BPC ou benefício de até 1 mínimo de outro idoso/PcD | LOAS, art. 20, §§ 9º e 14 | oficial |
| Acumulação proibida, exceções (assistência médica, pensão indenizatória, transferência de renda) | LOAS, art. 20, § 4º | oficial |
| Instituição de longa permanência não tira o direito; mais de um na família | LOAS, art. 20, §§ 5º e 15 | oficial |
| Outras provas de miserabilidade; ampliação até 1/2 por regulamento; critérios | LOAS, art. 20, §§ 11 e 11-A; art. 20-B | oficial |
| CPF e CadÚnico; biometria (CIN, título, CNH); biometria do responsável | LOAS, art. 20, §§ 12, 12-A e 12-B | oficial |
| Revisão a cada 2 anos; cessação; dispensa de perícia periódica no permanente | LOAS, art. 21 | oficial |
| Suspensão ao trabalhar (inclusive MEI); volta sem perícia; aprendiz por 2 anos | LOAS, art. 21-A | oficial |
| Auxílio-inclusão: até 2 mínimos, 50% do BPC, não acumula | LOAS, arts. 26-A a 26-C | oficial |
| CadÚnico atualizado há menos de 2 anos com CPF de todos; nacionalidade; Meu INSS; 135; documentos; até 45 dias; gratuito; sem 13º; sem pensão por morte | gov.br, serviços do BPC ao idoso e à pessoa com deficiência (atualizados em 12/08/2026) | oficial |
| Salário mínimo de R$ 1.621 (1/4 = R$ 405,25; metade = R$ 810,50) | Decreto 12.797/2025 | oficial (conta) |
| CPF e CadÚnico exigidos também para manter e revisar; cessação por superação das condições ou morte; cancelamento por irregularidade; reabilitação não suspende (lido em 17/11/2026) | LOAS, art. 20, § 12; art. 21, §§ 1º a 3º | oficial |
| Pessoa com TEA é pessoa com deficiência para todos os efeitos legais (17/11/2026) | Lei 12.764/2012, art. 1º, § 2º (Câmara) | oficial |

## Pendente

- **Empréstimo consignado para quem recebe BPC** (5 variações no autocompletar, 17/11/2026): a Lei 10.820/2003 não abriu (Câmara 404, Planalto fora do ar). Sem fonte, ficou de fora. Pista: Lei 10.820, art. 6º, e página do INSS sobre consignado.
- Dia do pagamento (calendário do INSS de 2026): não lido.
- "Nova lei do BPC": detalhar as mudanças das Leis 15.077/2024, 15.156/2025 e 15.157/2025.

- **Biometria:** prazos da Portaria Conjunta MDS/INSS 36/2026 (30/04 e 31/12/2026)
  e prorrogação pela Portaria SGD/MGI 2.907/2026 aparecem só em veículos, com
  datas divergentes; a portaria no DOU não abriu daqui e as notícias do gov.br
  pedem login. O texto cita só a exigência da lei e manda conferir no Meu INSS.
- **Bolsa Família fora da renda:** está no FAQ do MDS de 2021 (desatualizado) e
  no Decreto 6.214 (não abriu). Depois da Lei 15.077/2024 ("vedadas deduções não
  previstas em lei"), ficou de fora até confirmar.
- **Prazo do recurso:** FAQ do MDS de 2021 fala em 60 dias; a regra geral do INSS
  hoje é 30. Divergente: o texto manda seguir o prazo da decisão.
- Escala da ampliação até 1/2 salário mínimo (regulamento): não pesquisada.

## Decisões

- Título "BPC/LOAS 2026: quem tem direito, renda e como pedir" (51): provisório.
- Exemplos de renda montados com a composição da família do § 1º (netos e avós não
  entram, por isso o exemplo usa irmãos solteiros).
- Sem valor de atrasados nem de ação judicial.

## Para medir

A partir de ~7/11/2026: "bpc loas", "bpc quem tem direito", "bpc renda per
capita", "bpc 2026 valor", "bpc negado", "auxílio-inclusão". Revisão anual em
janeiro (salário mínimo, 1/4 e 1/2) e quando sair a regra final da biometria.

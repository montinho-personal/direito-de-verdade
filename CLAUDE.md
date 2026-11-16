@AGENTS.md

# Direito de Verdade — regras do projeto

Conteúdo jurídico é YMYL ("seu dinheiro, sua vida"): o Google exige mais
confiança dele do que de quase qualquer outro assunto. Estas regras existem
para que cada artigo mereça essa confiança. Adaptadas do Personal por Perto.

## Antes de criar qualquer artigo: os prints do Google

Artigo novo, ou reescrita grande, só ganha título, H1, seções e FAQs depois
dos dados do Google. Desde 16/11/2026 eles vêm do SerpApi, buscados pelo Claude
(seção "Pesquisa no Google pelo SerpApi" abaixo); print do Renato só se o SerpApi
falhar. De cada busca:

- o autocompletar (digitar a busca devagar);
- "Outras pessoas pesquisaram";
- "As pessoas também perguntam" (com 2 ou 3 abertas);
- a visão geral de IA, quando aparecer.

Sem os prints, o artigo responde o que a gente acha que as pessoas perguntam,
não o que elas perguntam. Enquanto não chegam, adiantar o que eles não mudam:
fontes, pesquisa e o doc da peça.

Os prints (ou o JSON do SerpApi) ficam em `docs/artigos/prints/<slug>/` e entram na tabela do doc da
peça, dizendo o que cada um mudou no texto.

## Pesquisa no Google pelo SerpApi (no lugar dos prints)

Desde 16/11/2026, os dados do Google que o Renato mandava em print vêm do
**SerpApi**, buscados pelo próprio Claude no começo da tarefa. Não pedir print
ao Renato; só se o SerpApi falhar (sem cota ou fora do ar).

**Pedido de "cria o próximo artigo" ou "revisa o próximo" (regra do Renato,
16/11/2026):** começar já pela pesquisa, sem perguntar nada antes. Pegar a próxima
peça da pauta (ou a que ele nomear), definir 2 ou 3 buscas (a principal e as
secundárias do doc ou da pauta), buscar no SerpApi e seguir o fluxo inteiro deste
arquivo: fontes, texto, checagens e publicação. Na resposta final, além do link,
mandar as intenções de busca separadas por tipo (autocompletar, "As pessoas também
perguntam", "Outras pessoas pesquisaram", visão de IA com o que diz e quem cita, e
quem ranqueia), marcando o que entrou no texto e o que ficou de fora, com o motivo.

**Depois de cada artigo ou revisão: as buscas que ficaram de fora viram pauta (regra do
Renato, 16/11/2026).** Sem esperar pedido, pegar tudo o que foi marcado como "ficou de
fora" nas intenções de busca, conferir no site (artigos, páginas e docs) o que já existe
e separar em três grupos: **vale um artigo** (assunto que o site ainda não cobre, com
fonte possível e busca real; entra na pauta com as buscas e o motivo), **não recomendo**
(com o motivo: nome de marca, fora do tema do site, sem fonte, canibaliza uma página que
já existe) e **cabe em página existente** (anotar no doc dessa página, para a próxima
revisão dela). Mandar ao Renato junto com a resposta final, em lista curta, na ordem em
que faria os artigos. Só entra na pauta; criar o artigo continua sendo um pedido dele.

**O que trazer de cada busca:** autocompletar, "As pessoas também perguntam",
"Outras pessoas pesquisaram", visão geral de IA (texto e fontes), resultados
orgânicos e, em busca local, o mapa (`local_results`). Google Brasil, pt-BR, sem
personalização, **como celular** e na **região do site** (abaixo).

**Aparelho e região (pedido do Renato, 16/11/2026):** sempre `"device":"mobile"`, porque
a maior parte do público chega pelo celular. Região padrão deste site: **São Paulo** (`Sao Paulo,State of Sao Paulo,Brazil`): o site é nacional. As páginas de cidade (Barueri, Santana de Parnaíba e outras) usam a cidade delas.
O nome exato da cidade sai da lista de locais do SerpApi, que é grátis e não gasta cota:
`curl -s "https://serpapi.com/locations.json?q=Barueri&limit=3"` (usar o `canonical_name`).
Bairro quase nunca existe na lista: use a cidade. O autocompletar não aceita cidade nem
aparelho; ele sai pelo Brasil (`gl=br`). Mesmo assim, o resultado não bate 100% com o
celular do Renato: muda com o dia, com testes do Google e com a digitação letra a letra.

**Como buscar** (bash; a chave está no cofre do ambiente e o proxy a envia sozinho,
não passe chave nenhuma):

```bash
serp() { curl -s -m 120 -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' -X POST https://mcp.serpapi.com/mcp \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"search\",\"arguments\":{\"params\":$1,\"mode\":\"compact\"}}}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["content"][0]["text"])'; }

# Página de resultados: related_questions, related_searches, ai_overview, organic_results, local_results
serp '{"engine":"google","q":"BUSCA","google_domain":"google.com.br","hl":"pt-br","gl":"br","device":"mobile","location":"CIDADE,State of ESTADO,Brazil"}'
# Autocompletar: suggestions[].value
serp '{"engine":"google_autocomplete","q":"BUSCA","hl":"pt-br","gl":"br"}'
# Visão de IA que veio só com "page_token" (sem text_blocks): um pedido a mais
serp '{"engine":"google_ai_overview","page_token":"TOKEN"}'
```

**Cota:** uma conta só para todos os sites do Renato, em plano pago desde 16/11/2026 (1.000 buscas por mês)
(o limite do mês aparece no painel do SerpApi; se a API disser que acabou, parar e
avisar). Cada busca gasta 2 (página + autocompletar), 3 com a visão de IA em duas
etapas. Buscar só o que a peça precisa (em geral 3 buscas), nunca em massa, e não
repetir busca já feita no mesmo dia.

**Orçamento do mês (1.000 pesquisas, todos os sites somados; conta de 16/11/2026):**
rotina diária do Direito de Verdade (2 revisões, 2 buscas cada) cerca de 300; rotinas
do Personal por Perto (artigos e cidades, 2 + 2 por dia) cerca de 360; rotina do Site do
Montinho cerca de 120 a 150; rotina do Crédito por Perto (1 revisão por dia) cerca de 60
a 90; rotinas mensais (com o alerta do Crédito) cerca de 35. Total: 875 a 935, com pouca sobra para pedidos
avulsos. Rotina nova, ou maior, só depois de refazer esta conta com o Renato; passou de
850 no mês, só pesquisar o que ele pedir.

**Evidência:** guardar no doc da peça, no lugar dos prints, um JSON enxuto de cada
busca (busca, data, autocompletar, perguntas, outras pesquisas, texto e fontes da
visão de IA, orgânicos com posição, título e endereço), sem `page_token` nem links
do serpapi.com, e preencher a tabela de prints dizendo o que cada dado mudou no texto.

**Continua valendo:** o que o Google mostra, inclusive a visão de IA, diz o que as
pessoas perguntam; não é fonte de fato.

**Se der erro de chave** ("Invalid API key", 401 ou host bloqueado): a chave não está
no ambiente desta sessão. Chamar a ferramenta `request_credential` para o host
`mcp.serpapi.com` (tipo bearer) e pedir ao Renato que cole a chave do SerpApi (menu
"API Key" em serpapi.com) no formulário. Nunca pedir a chave na conversa.

## Estratégias de SEO com o SerpApi (decisão do Renato, 16/11/2026)

Além da pesquisa de cada peça, o SerpApi serve para o seguinte. O Search Console continua
sendo a fonte da posição e dos cliques do próprio site; o SerpApi não substitui isso.

1. **Formato antes de escrever (sem busca extra).** Olhar os primeiros resultados da
   pesquisa da peça: se são calculadoras ou ferramentas, a peça é ferramenta; se são
   vídeos, registrar no doc que o texto sozinho dificilmente entra; se há mapa, é busca
   local. Anotar a decisão no doc da peça.
2. **Visão de IA.** Em toda pesquisa, registrar no doc quem a visão de IA cita e como é a
   resposta (tamanho, lista, tabela, exemplo com número). Escrever o lead e a primeira
   seção de modo que respondam do mesmo jeito direto, com fonte oficial. Uma vez por mês,
   a rotina mensal repete as buscas principais do site e anota em
   `docs/seo/visao-de-ia.md` se o site passou a ser citado.
3. **Concorrentes.** No doc da peça, anotar os domínios que ocupam os primeiros lugares e
   se são fracos (rede social, fórum, página antiga): essas buscas têm prioridade na pauta.
4. **Sazonalidade.** Antes de pautar tema sazonal, consultar o Google Trends pelo SerpApi
   (`{"engine":"google_trends","q":"TERMO","geo":"BR","date":"today 5-y"}`) e publicar
   algumas semanas antes do pico. Uma busca por tema, não por artigo.
5. **Alerta de mudança de regra.** Na rotina mensal, uma busca de notícias
   (`{"engine":"google_news","q":"TERMO","gl":"br","hl":"pt-br"}`) para os temas que mudam
   (STJ e STF nos temas citados, INSS, salário mínimo, tabelas). Mudou: conferir na fonte
   oficial e revisar a página; a notícia não é fonte.

## Doc da peça

Todo artigo tem `docs/artigos/<slug>.md` com:

- **Por que existe** — a busca, o volume quando houver, a época de pico;
- **Prints recebidos** — tabela: print, conteúdo, onde entrou;
- **Fontes confirmadas** — fato, URL e se é oficial ou "2 veículos";
- **Pendente** — o que ainda não tem fonte, com a pista;
- **Decisões** — o que ficou de fora e por quê;
- **Para medir** — buscas a acompanhar no Search Console e a partir de quando.

A pauta geral fica em `docs/pauta-editorial.md`.

## Regra de fato

- Só vale fonte oficial (planalto.gov.br, gov.br, Receita Federal, INSS,
  Ministério do Trabalho, TST, STF, STJ, CNJ, Procon, Senacon) ou dois
  veículos independentes dizendo a mesma coisa.
- Visão geral de IA e resumo de busca não são fonte.
- Nunca inventar prazo, valor, número de lei, súmula ou entendimento de
  tribunal. Dado divergente: entra só a parte que bate, ou o texto diz que
  varia e onde conferir.
- Valores que mudam todo ano (salário mínimo, tabelas de INSS e IR, multas)
  levam o ano no texto e entram na lista de revisão anual da pauta.

## Estrutura do artigo

- `tituloSeo` (o `<title>`): até ~60 caracteres, com a busca principal no
  começo e, depois dela, o gancho mais forte dos prints: o termo que mais
  aparece no autocompletar (ex.: "antecipado", "líquido", "cálculo exato"),
  um dado novo que os concorrentes não têm ou um número. Não listar todos os
  assuntos do texto: quem lê o título decide em meio segundo.
- `titulo` (o H1): a busca principal, completa e natural.
- `descricao`: meta description de até ~160 caracteres, escrita como anúncio:
  começa com a busca principal, entrega a resposta (data, valor, prazo) e
  termina com o que a pessoa ganha ao clicar. Olhar os títulos e trechos dos
  concorrentes nos prints e dizer o que só o nosso tem.
- O primeiro parágrafo (o lead) responde direto a dúvida principal.
- H2 no formato das perguntas reais (autocompletar e "As pessoas também
  perguntam"); H3 para desdobrar.
- Todo artigo tem FAQ (4 a 6 perguntas, com resposta curta e direta, que
  abre e fecha): primeiro as perguntas do Google que não viraram H2; se
  todas viraram, as dúvidas pontuais dos prints (visão geral de IA,
  autocompletar) e a pergunta da data, quando houver (pedido do Renato em
  19/10/2026).
- Links internos no meio da frase, com âncora que descreve o destino e
  variada entre artigos; nunca link forçado só para ter link.
- Links externos só para fontes oficiais, e toda fonte usada vai também no
  campo `fontes` (seção "Fontes" no fim).
- Vídeo do YouTube (campo `video`) só quando o Renato indicar; entra no fim
  do artigo, depois das perguntas frequentes.
- O aviso "Importante" (informativo, procure advogado ou Defensoria) é
  automático; não prometer resultado de processo nem valor de indenização.
- O site não presta consultoria e não indica escritório.

## Calculadoras

Calculadoras ficam fora da lista de artigos, na seção `/calculadoras`: o
texto em `content/calculadoras/<slug>.md` (mesmo formato do artigo, com a
ferramenta logo depois do lead), o doc em `docs/calculadoras/<slug>.md` e
os prints em `docs/calculadoras/prints/<slug>/`. Valem as mesmas regras de
prints, fonte e estrutura. Artigo e calculadora do mesmo assunto se linkam.

As tabelas de INSS e imposto de renda ficam só em
`src/lib/tributos/parametros-<ano>.ts`. Mexeu no motor ou nos parâmetros: rodar
`npm test`, que confere a conta com os exemplos oficiais da Receita.

## Data de atualização

`atualizadoEm` sobe a cada edição de conteúdo visível, no mesmo commit, e
nunca em massa: o Google ignora `lastmod` quando tudo muda junto.

## Ritmo

Artigos novos um de cada vez: um publicado e conferido no ar antes do
próximo. Publicar rápido é seguro; publicar rápido, igual e raso não é.

Publicar direto em `main`, sem esperar aprovação (pedido do Renato em
19/10/2026), e sempre mandar a ele o link do artigo no ar para conferir.
Os prints do Google continuam vindo antes de escrever.

@AGENTS.md

# Direito de Verdade — regras do projeto

Conteúdo jurídico é YMYL ("seu dinheiro, sua vida"): o Google exige mais
confiança dele do que de quase qualquer outro assunto. Estas regras existem
para que cada artigo mereça essa confiança. Adaptadas do Personal por Perto.

## Antes de criar qualquer artigo: os prints do Google

Artigo novo, ou reescrita grande, só ganha título, H1, seções e FAQs depois
dos prints do Google. No começo da tarefa, pedir ao Renato a lista de buscas
a printar e, em cada uma:

- o autocompletar (digitar a busca devagar);
- "Outras pessoas pesquisaram";
- "As pessoas também perguntam" (com 2 ou 3 abertas);
- a visão geral de IA, quando aparecer.

Sem os prints, o artigo responde o que a gente acha que as pessoas perguntam,
não o que elas perguntam. Enquanto não chegam, adiantar o que eles não mudam:
fontes, pesquisa e o doc da peça.

Os prints ficam em `docs/artigos/prints/<slug>/` e entram na tabela do doc da
peça, dizendo o que cada um mudou no texto.

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

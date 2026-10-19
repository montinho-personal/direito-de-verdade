# Direito de Verdade

Site do **Direito de Verdade**, feito com [Next.js](https://nextjs.org) (App Router), TypeScript e Tailwind CSS.

## Como rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts

| Comando         | O que faz                              |
| --------------- | -------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento            |
| `npm run build` | Gera a versão de produção              |
| `npm run start` | Roda a versão de produção já compilada |
| `npm run lint`  | Verifica o código com ESLint           |

## Configuração

As configurações gerais ficam em `src/lib/site.ts`. Alguns recursos só são ativados quando o campo correspondente é preenchido:

| Campo               | O que ativa                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `adsense`           | Código do Google AdSense em todas as páginas e o arquivo `/ads.txt`           |
| `emailContato`      | Página `/contato`, link no rodapé e contato na Política de Privacidade        |
| `verificacaoGoogle` | Verificação do site no Google Search Console (método "tag HTML")             |

O endereço do site (usado no sitemap, nos links canônicos e no compartilhamento) vem automaticamente da Vercel: é o domínio de produção do projeto.

## Artigos

Cada artigo é um arquivo Markdown em `content/artigos/`. O nome do arquivo vira o endereço da página: `content/artigos/como-calcular-a-rescisao.md` é publicado em `/artigos/como-calcular-a-rescisao`.

Para criar um artigo, copie `content/artigos/_modelo.md`, que explica cada campo do cabeçalho (título, descrição, categoria, datas, FAQ, fontes) e a formatação do texto. Ao publicar o arquivo, o artigo aparece sozinho na lista de artigos, na página da categoria, na página inicial e no sitemap. As regras editoriais (prints do Google antes de escrever, fontes aceitas, estrutura) estão em `CLAUDE.md`.

- **Título:** `titulo` é o H1 da página. `tituloSeo` (opcional, até 60 caracteres) é o título da aba e do Google; sem ele, vale o `titulo` seguido de " | Direito de Verdade".
- **Lead:** o primeiro parágrafo do texto aparece em destaque logo abaixo do título e deve responder direto a dúvida principal. A `descricao` é a meta description e o resumo dos cartões; ela não aparece na página do artigo.
- **Perguntas frequentes:** o campo `faq` vira a seção "Perguntas frequentes" no fim do texto, com dados estruturados FAQPage, e entra no sumário.
- **Fontes:** o campo `fontes` vira a seção "Fontes" no fim do artigo, com links que abrem em nova aba.
- **Categorias:** definidas em `src/lib/categorias.ts`. Cada uma só aparece no site depois que tiver pelo menos um artigo.
- **Antes do primeiro artigo:** as páginas `/artigos` e de categoria respondem com erro 404, e o link "Artigos" do menu fica oculto.
- **Rascunhos:** com `rascunho: true` no cabeçalho, o artigo só aparece rodando o site no computador (`npm run dev`).
- **Erros no cabeçalho:** um campo obrigatório faltando, uma categoria inexistente, uma data em formato errado, um `tituloSeo` longo demais ou uma fonte sem `https://` interrompem a publicação, com uma mensagem explicando o problema.
- **Documentação de cada artigo:** `docs/artigos/<slug>.md` registra os prints do Google, as fontes e as decisões. A pauta fica em `docs/pauta-editorial.md`.

## Estrutura

- `src/lib/site.ts`: configurações gerais (nome, descrição, AdSense, contato)
- `src/lib/metadados.ts`: título, descrição, link canônico e dados de compartilhamento de cada página
- `src/lib/artigos.ts` e `src/lib/categorias.ts`: leitura dos artigos e lista de categorias
- `src/lib/ferramentas.ts`: ferramentas que podem entrar no meio de um artigo (uma por artigo); `src/lib/decimo-terceiro.ts` tem as contas da calculadora do 13º e as tabelas de 2026
- `content/artigos/`: os artigos, em Markdown
- `src/app/artigos`, `src/app/categoria`: lista de artigos, página de cada artigo e página de cada categoria
- `src/app/layout.tsx`: layout raiz, fontes, metadados padrão e código do AdSense
- `src/app/page.tsx`: página inicial (com dados estruturados para o Google)
- `src/app/sobre`, `src/app/contato`, `src/app/politica-de-privacidade`, `src/app/termos-de-uso`: páginas institucionais
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/ads.txt`: arquivos para buscadores e para o AdSense
- `src/app/not-found.tsx`: página de erro 404
- `src/app/globals.css`: cores da marca e estilos globais (inclui o estilo dos textos longos)
- `src/app/icon.png` e `src/app/apple-icon.png`: ícone do site (aba do navegador e tela inicial do celular)
- `src/components/`: cabeçalho, rodapé, modelo das páginas de texto, cartões e listas de artigos, trilha de navegação e as ferramentas (calculadora do 13º)
- `src/assets/logo.png`: logo usado no topo do site
- `public/imagem-compartilhamento.png`: imagem que aparece ao compartilhar o link (WhatsApp, redes sociais)
- `marca/logo-original.png`: arquivo original do logo, em alta resolução

Ao criar uma página nova, use `metadadosDaPagina` para os metadados e inclua o endereço em `src/app/sitemap.ts`.

## Publicação

O projeto pode ser publicado na [Vercel](https://vercel.com) importando este repositório.

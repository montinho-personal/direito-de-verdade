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

## Estrutura

- `src/lib/site.ts`: configurações gerais (nome, descrição, AdSense, contato)
- `src/lib/metadados.ts`: título, descrição, link canônico e dados de compartilhamento de cada página
- `src/app/layout.tsx`: layout raiz, fontes, metadados padrão e código do AdSense
- `src/app/page.tsx`: página inicial (com dados estruturados para o Google)
- `src/app/sobre`, `src/app/contato`, `src/app/politica-de-privacidade`, `src/app/termos-de-uso`: páginas institucionais
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/ads.txt`: arquivos para buscadores e para o AdSense
- `src/app/not-found.tsx`: página de erro 404
- `src/app/globals.css`: cores da marca e estilos globais (inclui o estilo dos textos longos)
- `src/app/icon.png` e `src/app/apple-icon.png`: ícone do site (aba do navegador e tela inicial do celular)
- `src/components/`: cabeçalho, rodapé e modelo das páginas de texto
- `src/assets/logo.png`: logo usado no topo do site
- `public/imagem-compartilhamento.png`: imagem que aparece ao compartilhar o link (WhatsApp, redes sociais)
- `marca/logo-original.png`: arquivo original do logo, em alta resolução

Ao criar uma página nova, use `metadadosDaPagina` para os metadados e inclua o endereço em `src/app/sitemap.ts`.

## Publicação

O projeto pode ser publicado na [Vercel](https://vercel.com) importando este repositório.

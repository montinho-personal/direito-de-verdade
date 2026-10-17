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

## Estrutura

- `src/app/layout.tsx`: layout raiz, fontes e metadados (título e descrição do site)
- `src/app/page.tsx`: página inicial
- `src/app/globals.css`: cores da marca e estilos globais
- `src/app/icon.svg`: ícone do site (aba do navegador)
- `public/`: arquivos estáticos (imagens, ícones)

## Publicação

O projeto pode ser publicado na [Vercel](https://vercel.com) importando este repositório.

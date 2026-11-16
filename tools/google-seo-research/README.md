# Google SEO Research Lab

Ferramenta interna do Direito de Verdade para registrar o que o Google Brasil mostra em
cada busca e tirar disso oportunidades para o site. Substitui os prints manuais por uma
coleta com evidências, mas continua valendo a regra do projeto: visão de IA e resumo de
busca **não são fonte** de fato jurídico.

Roda **só na sua máquina**. Nada daqui é publicado: na Vercel, `/seo-lab` e a API dele
devolvem 404.

## O que ela registra

| elemento | como é lido |
|---|---|
| Autocompletar | sugestões exibidas enquanto a busca é digitada |
| Outras pessoas pesquisaram | links dos blocos com esse título (e "Pesquisas relacionadas") |
| As pessoas também perguntam | perguntas; resposta e fonte das que estavam abertas |
| Visão geral criada por IA | texto e fontes citadas |
| Resultados orgânicos | posição, título, endereço e trecho |

Cada elemento ganha um status: `coletado`, `nao_encontrado` (não apareceu ou não foi
reconhecido), `bloqueado` (o Google pediu verificação) ou `erro`. Toda coleta guarda as
capturas de tela e o HTML da página como evidência.

## Preparar (uma vez)

Precisa de Node 22.18 ou mais novo e, de preferência, do Google Chrome instalado.

```bash
npm install                      # na raiz, se ainda não fez
cd tools/google-seo-research
npm install                      # instala o Playwright só nesta pasta
npx playwright install chromium  # só se você não tiver o Chrome
cd ../..
```

## Usar

Dois terminais, na raiz do projeto.

**1. Painel** (cadastro, histórico, resultados, comparação, oportunidades, exportação):

```bash
npm run seo:lab
```

Abra http://localhost:3210/seo-lab.

**2. Coletor** (abre o navegador na sua frente):

```bash
npm run seo:coletar                                    # buscas cadastradas ainda sem coleta
npm run seo:coletar -- "multa proporcional aluguel"    # uma busca
npm run seo:coletar -- --todas                         # refaz todas, para comparar no tempo
npm run seo:coletar -- --dispositivo celular           # página de celular (padrão: computador)
```

Em cada busca o coletor digita o termo, lê o autocompletar e abre os resultados. Aí é com
você: abra 2 ou 3 perguntas, expanda a visão de IA, role até o fim e aperte Enter no
terminal. Ele captura o que está na tela.

As três primeiras buscas já vêm cadastradas: `calculadora multa rescisão aluguel`,
`multa proporcional aluguel` e `multa de 3 aluguéis proporcional`.

## Se o Google bloquear o coletor: importar a página salva

O Google costuma reconhecer o navegador automatizado e pedir verificação. Quando isso
acontecer, não insista: pesquise no seu Chrome de sempre e importe a página.

1. Pesquise a busca no Google, abra 2 ou 3 perguntas, expanda a visão de IA e role até o fim.
2. `Ctrl + S` → em "Tipo", **Página da web, completa** → salvar.
3. No painel, aba **Importar página**: escolha a busca e o arquivo `.html`.

O painel lê o arquivo com o mesmo extrator do coletor e grava a coleta com a origem
`pagina-salva`. Nenhuma busca é feita pelo laboratório nesse caminho. O autocompletar não
fica na página salva: há um campo para copiar as sugestões, e outro para anexar prints.

## Limites, de propósito

- **Sem contorno de CAPTCHA.** Se o Google pedir verificação, o coletor avisa, registra a
  busca como bloqueada e para. Faça poucas buscas por vez.
- **Navegador sempre visível e supervisionado** contra o Google. O modo sem janela existe só
  para o teste automático, que usa uma página de exemplo local.
- **Pesquisa em escala** não é para este coletor: use um provedor autorizado de dados de
  SERP. O ponto de integração está em `lib/provedores.ts`; a chave fica em `.env.local`
  (ignorado pelo Git), nunca no código.
- **A análise é uma triagem**, feita por contagem de palavras em comum com o que está em
  `content/`. Ela aponta onde olhar; não cria nem publica nada.

## Se o Google mudar a página

A leitura fica em `extrator.mjs` e se apoia nos títulos visíveis dos blocos e em atributos
de acessibilidade. Ela foi testada contra a página de exemplo em `testes/`, que imita a
estrutura de uma busca; a página real pode ter diferenças. Quando um bloco aparecer na
captura e vier como `nao_encontrado`, ajuste o `extrator.mjs` e releia as coletas antigas
do HTML salvo, sem pesquisar de novo:

```bash
npm run seo:reextrair
```

## Onde fica cada coisa

| caminho | o que é |
|---|---|
| `coletor.mjs` | coleta supervisionada com Playwright |
| `extrator.mjs` | leitura da página (roda dentro do navegador) |
| `reextrair.mjs` | relê o HTML salvo das coletas |
| `lab.mjs` | abre o painel local |
| `lib/` | tipos, armazenamento, análise, comparação, exportação, importação, provedores |
| `dados/` | palavras, coletas, capturas e perfil do navegador (**fora do Git**) |
| `testes/` | página de exemplo e teste do coletor |
| `src/app/seo-lab/`, `src/components/seo-lab/` | painel e API local (no site, desligados em produção) |

## Testes

```bash
npm test                    # inclui análise, comparação e exportação (tests/seo-lab.test.mjs)
npm run seo:testar-coletor  # coletor de ponta a ponta, na página de exemplo (precisa do Playwright)
```

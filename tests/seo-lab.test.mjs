// Testes do Google SEO Research Lab (tools/google-seo-research/lib): análise, comparação e
// exportação. São funções puras; o coletor tem teste próprio (npm run seo:testar-coletor),
// porque precisa do Playwright.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { analisar, avaliarCobertura, classificarIntencao, detectarCanibalizacao } from "../tools/google-seo-research/lib/analise.ts";
import { comparar } from "../tools/google-seo-research/lib/comparar.ts";
import { linhasDaColeta, paraCsv, paraJson, paraXlsx } from "../tools/google-seo-research/lib/exportar.ts";
import { lerIndiceDoSite } from "../tools/google-seo-research/lib/indice-do-site.ts";
import { chave, cobertura, ehPergunta, palavras } from "../tools/google-seo-research/lib/texto.ts";

const bloco = (itens) => ({ status: itens.length ? "coletado" : "nao_encontrado", itens });

function coleta(palavra, partes = {}) {
  return {
    id: `2026-11-16-1500-${palavra.replace(/ /g, "-")}`,
    palavra,
    coletadaEm: "2026-11-16T18:00:00.000Z",
    provedor: "navegador-supervisionado",
    dispositivo: "computador",
    idioma: "pt-BR",
    pais: "BR",
    status: "coletado",
    autocompletar: bloco(partes.autocompletar ?? []),
    outrasPesquisas: bloco(partes.outrasPesquisas ?? []),
    perguntas: bloco(partes.perguntas ?? []),
    visaoDeIA: bloco(partes.visaoDeIA ?? []),
    organicos: bloco(partes.organicos ?? []),
    capturas: [],
  };
}

const organico = (posicao, titulo, url) => ({ posicao, titulo, url, dominio: new URL(url).hostname.replace(/^www\./, "") });

const PAGINAS = [
  {
    caminho: "/calculadoras/multa-rescisao-aluguel",
    tipo: "calculadora",
    titulo: "Calculadora de multa de rescisão de aluguel",
    tituloSeo: "Calculadora de multa de aluguel proporcional",
    descricao: "Calcule a multa proporcional do contrato de aluguel.",
    intertitulos: ["Como calcular a multa proporcional do aluguel?", "Quando o inquilino não paga multa?"],
    perguntas: ["A multa de 3 aluguéis é proporcional?"],
  },
  {
    caminho: "/artigos/reajuste-do-aluguel",
    tipo: "artigo",
    titulo: "Reajuste do aluguel: como funciona",
    tituloSeo: "Reajuste do aluguel",
    descricao: "IGP-M ou IPCA no reajuste do aluguel.",
    intertitulos: ["Qual índice vale?"],
    perguntas: [],
  },
];

test("texto: tira acento, palavras vazias e plural", () => {
  assert.deepEqual(palavras("Multa de 3 aluguéis proporcional?"), ["multa", "3", "aluguel", "proporcional"]);
  assert.equal(chave("multa proporcional do aluguel"), chave("Aluguel: multa proporcional"));
  assert.equal(cobertura("multa aluguel", "Como calcular a multa do aluguel"), 1);
  assert.equal(cobertura("multa aluguel fiador", "Como calcular a multa do aluguel"), 2 / 3);
  assert.ok(ehPergunta("como calcular a multa"));
  assert.ok(!ehPergunta("multa proporcional aluguel"));
});

test("intenção: calculadora é ferramenta; pergunta é informação; modelo é documento", () => {
  assert.equal(classificarIntencao(coleta("calculadora multa rescisão aluguel")).tipo, "ferramenta");
  assert.equal(classificarIntencao(coleta("quem paga a multa do aluguel")).tipo, "informacional");
  assert.equal(classificarIntencao(coleta("modelo carta rescisão aluguel")).tipo, "modelo");
  // Sem a palavra "calculadora", mas com a página de resultados dominada por calculadoras
  const serp = coleta("multa proporcional aluguel", {
    organicos: [1, 2, 3, 4, 5].map((n) => organico(n, n <= 3 ? "Calculadora de multa" : "Guia da multa", `https://s${n}.com.br/`)),
  });
  assert.equal(classificarIntencao(serp).tipo, "ferramenta");
});

test("cobertura: coberta, parcial e lacuna, com a página mais próxima", () => {
  const coberta = avaliarCobertura("Como calcular a multa proporcional do aluguel?", PAGINAS);
  assert.equal(coberta.situacao, "coberta");
  assert.equal(coberta.pagina.caminho, "/calculadoras/multa-rescisao-aluguel");
  assert.equal(avaliarCobertura("multa aluguel transferência de emprego", PAGINAS).situacao, "parcial");
  assert.equal(avaliarCobertura("usucapião de imóvel urbano", PAGINAS).situacao, "lacuna");
});

test("análise: separa melhoria em calculadora de artigo novo e conta repetições", () => {
  const coletas = [
    coleta("multa proporcional aluguel", {
      perguntas: [{ pergunta: "Como calcular a multa proporcional do aluguel?" }, { pergunta: "Fiador paga a multa do aluguel?" }],
      outrasPesquisas: [{ texto: "usucapião de imóvel urbano" }],
      autocompletar: [{ texto: "multa proporcional aluguel" }],
    }),
    coleta("multa de 3 aluguéis proporcional", { perguntas: [{ pergunta: "Fiador paga a multa do aluguel?" }] }),
  ];
  const analise = analisar(coletas, PAGINAS, "direitodeverdade.com.br");
  assert.equal(analise.coletasAnalisadas, 2);
  // A sugestão igual à própria busca não vira item
  assert.ok(!analise.lacunas.some((i) => i.texto === "multa proporcional aluguel"));
  const fiador = analise.perguntasFrequentes.find((i) => i.texto.startsWith("Fiador"));
  assert.equal(fiador.vezes, 2);
  assert.deepEqual(fiador.palavras, ["multa proporcional aluguel", "multa de 3 aluguéis proporcional"]);
  assert.ok(analise.melhoriasEmCalculadoras.some((i) => i.texto.startsWith("Fiador")));
  assert.deepEqual(analise.novosArtigos.map((i) => i.texto), ["usucapião de imóvel urbano"]);
  assert.ok(!analise.lacunas.some((i) => i.texto.startsWith("Como calcular")));
});

test("canibalização: duas páginas com a busca no título, ou duas do site no Google", () => {
  const duplicada = [...PAGINAS, { ...PAGINAS[0], caminho: "/artigos/multa-de-aluguel", tipo: "artigo", titulo: "Multa de aluguel proporcional: rescisão" }];
  const c = coleta("multa proporcional aluguel");
  assert.equal(detectarCanibalizacao(c, PAGINAS, "direitodeverdade.com.br").alerta, false);
  assert.equal(detectarCanibalizacao(c, duplicada, "direitodeverdade.com.br").alerta, true);
  const noGoogle = coleta("multa proporcional aluguel", {
    organicos: [
      organico(1, "A", "https://direitodeverdade.com.br/calculadoras/multa-rescisao-aluguel"),
      organico(4, "B", "https://www.direitodeverdade.com.br/artigos/reajuste-do-aluguel"),
    ],
  });
  const resultado = detectarCanibalizacao(noGoogle, PAGINAS, "direitodeverdade.com.br");
  assert.equal(resultado.alerta, true);
  assert.deepEqual(resultado.noGoogle.map((r) => r.posicao), [1, 4]);
});

test("visão de IA: diz se o site foi citado", () => {
  const visao = (url) => coleta("multa proporcional aluguel", { visaoDeIA: [{ texto: "A multa é proporcional.", fontes: [{ titulo: "Fonte", url }] }] });
  const [citado] = analisar([visao("https://direitodeverdade.com.br/x")], PAGINAS, "direitodeverdade.com.br").visibilidadeEmIA;
  assert.equal(citado.citaOSite, true);
  const [fora] = analisar([visao("https://outro.com.br/x")], PAGINAS, "direitodeverdade.com.br").visibilidadeEmIA;
  assert.equal(fora.exibida, true);
  assert.equal(fora.citaOSite, false);
  assert.deepEqual(fora.dominiosCitados, ["outro.com.br"]);
  const [sem] = analisar([coleta("multa proporcional aluguel")], PAGINAS, "direitodeverdade.com.br").visibilidadeEmIA;
  assert.equal(sem.exibida, false);
});

test("comparar: o que entrou, saiu e mudou de posição", () => {
  const a = coleta("multa proporcional aluguel", {
    perguntas: [{ pergunta: "Como calcular a multa?" }, { pergunta: "Fiador paga a multa?" }],
    organicos: [organico(1, "Um", "https://um.com.br/a"), organico(2, "Dois", "https://dois.com.br/b")],
  });
  const b = coleta("multa proporcional aluguel", {
    perguntas: [{ pergunta: "Como calcular a multa?" }, { pergunta: "Qual o valor da multa?" }],
    organicos: [organico(1, "Dois", "https://dois.com.br/b/"), organico(2, "Três", "https://tres.com.br/c")],
  });
  const comparacao = comparar(a, b);
  assert.deepEqual(comparacao.perguntas, {
    emComum: ["Como calcular a multa?"],
    soNaA: ["Fiador paga a multa?"],
    soNaB: ["Qual o valor da multa?"],
  });
  const dois = comparacao.organicos.find((r) => r.titulo === "Dois");
  assert.deepEqual([dois.posicaoA, dois.posicaoB], [2, 1]);
  assert.equal(comparacao.organicos.find((r) => r.titulo === "Um").posicaoB, undefined);
});

test("exportação: CSV seguro para o Excel, JSON e .xlsx válido", () => {
  const c = coleta('multa "proporcional"', {
    perguntas: [{ pergunta: "=SOMA(A1)?", resposta: "Linha 1\nLinha 2; com ponto e vírgula", fonteUrl: "https://x.com.br/" }],
    organicos: [organico(1, "Título", "https://x.com.br/")],
  });
  const linhas = linhasDaColeta(c);
  // Categorias sem itens viram uma linha com o status, para registrar o que não apareceu
  assert.equal(linhas.filter((l) => l.status === "não encontrado").length, 3);

  const csv = paraCsv([c]);
  assert.ok(csv.startsWith("﻿\"Palavra-chave\";"));
  assert.ok(csv.includes('"multa ""proporcional"""'));
  assert.ok(csv.includes("\"'=SOMA(A1)?\""), "fórmula desarmada");
  assert.ok(csv.includes('"Linha 1\nLinha 2; com ponto e vírgula"'));

  assert.equal(JSON.parse(paraJson([c])).coletas[0].palavra, 'multa "proporcional"');

  const xlsx = paraXlsx([c]);
  assert.deepEqual([...xlsx.slice(0, 4)], [0x50, 0x4b, 3, 4]);
  // O fim do ZIP declara os 11 arquivos: tipos, relações, pasta de trabalho, estilos e 6 abas
  const fim = new DataView(xlsx.buffer, xlsx.length - 22);
  assert.equal(fim.getUint32(0, true), 0x06054b50);
  assert.equal(fim.getUint16(10, true), 11);
  const texto = new TextDecoder().decode(xlsx);
  assert.ok(texto.includes('<sheet name="As pessoas também perguntam"'));
  assert.ok(texto.includes("=SOMA(A1)?"));
});

test("índice do site: lê título, intertítulos e perguntas de content/", () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "seo-lab-indice-"));
  fs.mkdirSync(path.join(raiz, "content", "calculadoras"), { recursive: true });
  fs.writeFileSync(
    path.join(raiz, "content", "calculadoras", "exemplo.md"),
    '---\ntitulo: "Calculadora de exemplo"\ndescricao: "Descrição"\nfaq:\n  - pergunta: "Pergunta um?"\n    resposta: "Sim."\n---\n\nLead.\n\n## Primeiro intertítulo\n\n### Segundo\n',
  );
  try {
    assert.deepEqual(lerIndiceDoSite(raiz), [
      {
        caminho: "/calculadoras/exemplo",
        tipo: "calculadora",
        titulo: "Calculadora de exemplo",
        tituloSeo: "Calculadora de exemplo",
        descricao: "Descrição",
        intertitulos: ["Primeiro intertítulo", "Segundo"],
        perguntas: ["Pergunta um?"],
      },
    ]);
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }
  // O índice real do site tem a calculadora de multa de aluguel
  assert.ok(lerIndiceDoSite().some((p) => p.caminho === "/calculadoras/multa-rescisao-aluguel"));
});

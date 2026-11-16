// Exportação das coletas em CSV, JSON e Excel (.xlsx), sem dependências: o .xlsx é um ZIP
// sem compressão com as planilhas em XML, montado aqui.
import { CATEGORIAS, NOME_DO_STATUS, type Coleta } from "./tipos.ts";

export type Linha = {
  palavra: string;
  coletadaEm: string;
  dispositivo: string;
  categoria: string;
  status: string;
  posicao: number | "";
  texto: string;
  detalhe: string;
  url: string;
};

const COLUNAS: { chave: keyof Linha; titulo: string }[] = [
  { chave: "palavra", titulo: "Palavra-chave" },
  { chave: "coletadaEm", titulo: "Coletada em" },
  { chave: "dispositivo", titulo: "Dispositivo" },
  { chave: "categoria", titulo: "Categoria" },
  { chave: "status", titulo: "Status" },
  { chave: "posicao", titulo: "Posição" },
  { chave: "texto", titulo: "Texto" },
  { chave: "detalhe", titulo: "Resposta ou trecho" },
  { chave: "url", titulo: "URL" },
];

// Uma linha por item coletado; categoria sem itens vira uma linha só com o status,
// para o arquivo registrar também o que não apareceu.
export function linhasDaColeta(coleta: Coleta): Linha[] {
  const base = { palavra: coleta.palavra, coletadaEm: coleta.coletadaEm, dispositivo: coleta.dispositivo };
  const linhas: Linha[] = [];
  const incluir = (
    chave: (typeof CATEGORIAS)[number]["chave"],
    itens: { texto: string; detalhe?: string; url?: string }[],
  ) => {
    const categoria = CATEGORIAS.find((c) => c.chave === chave)!.nome;
    const status = NOME_DO_STATUS[coleta[chave].status];
    if (itens.length === 0) {
      linhas.push({ ...base, categoria, status, posicao: "", texto: "", detalhe: coleta[chave].observacao ?? "", url: "" });
    }
    itens.forEach((item, i) =>
      linhas.push({ ...base, categoria, status, posicao: i + 1, texto: item.texto, detalhe: item.detalhe ?? "", url: item.url ?? "" }),
    );
  };
  incluir("autocompletar", coleta.autocompletar.itens);
  incluir("outrasPesquisas", coleta.outrasPesquisas.itens);
  incluir(
    "perguntas",
    coleta.perguntas.itens.map((p) => ({ texto: p.pergunta, detalhe: p.resposta, url: p.fonteUrl })),
  );
  incluir(
    "visaoDeIA",
    coleta.visaoDeIA.itens.flatMap((v) => [
      { texto: "Texto da visão de IA", detalhe: v.texto },
      ...v.fontes.map((f) => ({ texto: `Fonte citada: ${f.titulo}`, url: f.url })),
    ]),
  );
  incluir(
    "organicos",
    coleta.organicos.itens.map((r) => ({ texto: r.titulo, detalhe: r.trecho, url: r.url })),
  );
  return linhas;
}

// CSV com ponto e vírgula e marca de UTF-8, que é o que o Excel em português abre direto
export function paraCsv(coletas: Coleta[]): string {
  const celula = (valor: string | number) => {
    let texto = String(valor);
    // Texto que começa com =, +, - ou @ é lido como fórmula pelo Excel: o apóstrofo desarma
    if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const linhas = [
    COLUNAS.map((c) => celula(c.titulo)).join(";"),
    ...coletas.flatMap(linhasDaColeta).map((l) => COLUNAS.map((c) => celula(l[c.chave])).join(";")),
  ];
  return "﻿" + linhas.join("\r\n") + "\r\n";
}

export function paraJson(coletas: Coleta[]): string {
  return JSON.stringify({ exportadoEm: new Date().toISOString(), coletas }, null, 2);
}

// ---- Excel ----

const xml = (texto: string) =>
  texto
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function letraDaColuna(indice: number) {
  let letras = "";
  for (let n = indice + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letras = String.fromCharCode(65 + ((n - 1) % 26)) + letras;
  }
  return letras;
}

function planilha(linhas: (string | number)[][]) {
  const corpo = linhas
    .map((linha, l) => {
      const celulas = linha
        .map((valor, c) => {
          const ref = `${letraDaColuna(c)}${l + 1}`;
          if (typeof valor === "number") return `<c r="${ref}"><v>${valor}</v></c>`;
          if (valor === "") return "";
          // O Excel aceita até 32.767 caracteres por célula
          const texto = xml(valor.slice(0, 32000));
          return `<c r="${ref}" t="inlineStr"${l === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${texto}</t></is></c>`;
        })
        .join("");
      return `<row r="${l + 1}">${celulas}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${corpo}</sheetData></worksheet>`;
}

let tabelaCrc: number[] | undefined;
function crc32(bytes: Uint8Array) {
  tabelaCrc ??= Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = 0xffffffff;
  for (const b of bytes) crc = tabelaCrc[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ZIP sem compressão ("stored"): cabeçalho local de cada arquivo, diretório central e fim
export function zip(arquivos: { nome: string; conteudo: string }[]): Uint8Array {
  const codificar = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let posicao = 0;
  for (const arquivo of arquivos) {
    const nome = codificar.encode(arquivo.nome);
    const dados = codificar.encode(arquivo.conteudo);
    const crc = crc32(dados);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint32(14, crc, true);
    local.setUint32(18, dados.length, true);
    local.setUint32(22, dados.length, true);
    local.setUint16(26, nome.length, true);
    partes.push(new Uint8Array(local.buffer), nome, dados);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, dados.length, true);
    entrada.setUint32(24, dados.length, true);
    entrada.setUint16(28, nome.length, true);
    entrada.setUint32(42, posicao, true);
    central.push(new Uint8Array(entrada.buffer), nome);
    posicao += 30 + nome.length + dados.length;
  }
  const tamanhoCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, posicao, true);

  const tudo = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(tudo.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const parte of tudo) {
    saida.set(parte, i);
    i += parte.length;
  }
  return saida;
}

// Uma aba "Tudo" e uma aba por categoria
export function paraXlsx(coletas: Coleta[]): Uint8Array {
  const linhas = coletas.flatMap(linhasDaColeta);
  const cabecalho = COLUNAS.map((c) => c.titulo);
  const valores = (l: Linha) => COLUNAS.map((c) => l[c.chave]);
  const abas = [
    { nome: "Tudo", linhas: [cabecalho, ...linhas.map(valores)] },
    ...CATEGORIAS.map((c) => ({
      // Nome de aba do Excel: até 31 caracteres
      nome: c.nome.slice(0, 31),
      linhas: [cabecalho, ...linhas.filter((l) => l.categoria === c.nome).map(valores)],
    })),
  ];
  const cabecalhoXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zip([
    {
      nome: "[Content_Types].xml",
      conteudo: `${cabecalhoXml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    },
    {
      nome: "_rels/.rels",
      conteudo: `${cabecalhoXml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      nome: "xl/workbook.xml",
      conteudo: `${cabecalhoXml}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${abas.map((a, i) => `<sheet name="${xml(a.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    },
    {
      nome: "xl/_rels/workbook.xml.rels",
      conteudo: `${cabecalhoXml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      nome: "xl/styles.xml",
      conteudo: `${cabecalhoXml}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    },
    ...abas.map((a, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, conteudo: planilha(a.linhas) })),
  ]);
}

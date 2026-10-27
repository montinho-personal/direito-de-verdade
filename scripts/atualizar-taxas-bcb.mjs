// Atualiza as taxas médias de juros do Banco Central usadas pela calculadora de juros
// abusivos. Baixa cada série do SGS (api.bcb.gov.br), confere o formato e reescreve
// src/lib/juros/series-bcb.ts. Rodar à mão, depois da divulgação mensal do BC:
//     node scripts/atualizar-taxas-bcb.mjs
// Nunca completa um mês que falta nem troca uma série por outra: se uma série falhar, o
// arquivo não é reescrito.
import fs from "node:fs";

// Código SGS, nome oficial e página no portal de dados abertos do BC (conferidos em 27/10/2026)
const SERIES = {
  25464: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal não consignado",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25464-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25469: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal consignado total",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25469-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25466: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal consignado para trabalhadores do setor privado",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25466-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25467: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal consignado para trabalhadores do setor público",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25467-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25468: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal consignado para aposentados e pensionistas do INSS",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25468-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25471: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Aquisição de veículos",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25471-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---a",
  },
  25497: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos direcionados - Pessoas físicas - Financiamento imobiliário com taxas de mercado",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25497-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-direcionados---pessoas-fisic",
  },
  25498: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos direcionados - Pessoas físicas - Financiamento imobiliário com taxas reguladas",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25498-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-direcionados---pessoas-fisic",
  },
  25477: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Cartão de crédito rotativo",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25477-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25478: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Cartão de crédito parcelado",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25478-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
  25463: {
    nome: "Taxa média mensal de juros das operações de crédito com recursos livres - Pessoas físicas - Cheque especial",
    pagina: "https://dadosabertos.bcb.gov.br/dataset/25463-taxa-media-mensal-de-juros-das-operacoes-de-credito-com-recursos-livres---pessoas-fisicas---c",
  },
};
// A metodologia atual das séries de crédito começa em março de 2011; meses anteriores
// (que algumas séries trazem) ficam de fora para todas as modalidades serem comparáveis.
const INICIO = { ano: 2011, mes: 3 };

async function baixar(codigo) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (tentativa === 4) throw new Error(`série ${codigo}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 2000 * tentativa));
    }
  }
}

const saida = {};
for (const codigo of Object.keys(SERIES)) {
  const dados = await baixar(codigo);
  const meses = [];
  for (const { data, valor } of dados) {
    const [dia, mes, ano] = data.split("/").map(Number);
    if (dia !== 1 || !/^\d+(\.\d{1,2})?$/.test(valor)) throw new Error(`série ${codigo}: valor inesperado ${data} ${valor}`);
    if (ano * 12 + mes < INICIO.ano * 12 + INICIO.mes) continue;
    meses.push({ ano, mes, centesimos: Math.round(Number(valor) * 100) });
  }
  // Sem buracos: cada mês tem de seguir o anterior
  meses.forEach((m, i) => {
    if (i > 0 && m.ano * 12 + m.mes !== meses[i - 1].ano * 12 + meses[i - 1].mes + 1)
      throw new Error(`série ${codigo}: falta o mês anterior a ${m.mes}/${m.ano}`);
  });
  if (meses[0].ano !== INICIO.ano || meses[0].mes !== INICIO.mes) throw new Error(`série ${codigo}: não começa em 03/2011`);
  saida[codigo] = { fim: { ano: meses.at(-1).ano, mes: meses.at(-1).mes }, valores: meses.map((m) => m.centesimos) };
}

const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const linhas = [
  "// Gerado por scripts/atualizar-taxas-bcb.mjs: não editar à mão.",
  "// Taxas médias mensais de juros (% ao mês), em centésimos de ponto percentual (197 = 1,97%",
  "// a.m.), das novas operações de crédito a pessoas físicas, ponderadas pelo valor das",
  "// concessões. Fonte: Banco Central do Brasil, SGS (api.bcb.gov.br). Uma posição por mês, a",
  "// partir de março de 2011 (inicio) até fim.",
  "",
  `export const SERIES_ATUALIZADAS_EM = "${hoje}";`,
  `export const INICIO_DAS_SERIES = { ano: ${INICIO.ano}, mes: ${INICIO.mes} };`,
  "",
  "export const SERIES_BCB: Record<number, { nome: string; pagina: string; fim: { ano: number; mes: number }; valores: readonly number[] }> = {",
];
for (const [codigo, { fim, valores }] of Object.entries(saida)) {
  linhas.push(`  ${codigo}: {`);
  linhas.push(`    nome: ${JSON.stringify(SERIES[codigo].nome)},`);
  linhas.push(`    pagina: ${JSON.stringify(SERIES[codigo].pagina)},`);
  linhas.push(`    fim: { ano: ${fim.ano}, mes: ${fim.mes} },`);
  linhas.push(`    // prettier-ignore`);
  linhas.push(`    valores: [${valores.join(", ")}],`);
  linhas.push("  },");
}
linhas.push("};", "");
fs.writeFileSync(new URL("../src/lib/juros/series-bcb.ts", import.meta.url), linhas.join("\n"));
console.log(Object.entries(saida).map(([c, s]) => `${c}: até ${s.fim.mes}/${s.fim.ano}`).join("\n"));

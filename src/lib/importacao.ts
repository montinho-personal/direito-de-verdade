// Impostos de compra internacional de pessoa física pelos Correios ou por courier
// (Regime de Tributação Simplificada), com as regras em vigor desde 12/05/2026.
// Valores em centavos inteiros; a cotação do dólar em décimos de milésimo de real
// (R$ 5,4321 = 54321), para a conta não depender de ponto flutuante.
// Fontes: Receita Federal, "Novas Regras" (Portal Compras Internacionais, atualizado em
// 14/09/2026); Lei 15.502/2026; Portaria MF 1.342/2026. Ver
// docs/artigos/taxa-compras-internacionais.md.
import { dividirArredondando } from "./tributos/calculo.ts";

export const IMPORTACAO_2026 = {
  vigenteDesde: "2026-05-12",
  revisadoEm: "2026-10-20",
  limiteEmDolares: 3000,
  // Sites certificados no Programa Remessa Conforme
  remessaConforme: { ateDolares: 50, aliquotaAtePorMil: 0, aliquotaAcimaPorMil: 600, descontoEmDolares: 30 },
  // Fora do programa: 60% em qualquer valor, sem desconto
  foraDoPrograma: { aliquotaPorMil: 600 },
  icms: { minimoPorDezMil: 1700, maximoPorDezMil: 2000 },
} as const;

export type EntradaDaImportacao = {
  // Produtos + frete + seguro, em centavos
  valor: number;
  // Reais por dólar, em décimos de milésimo (5,00 = 50000)
  cotacao: number;
  remessaConforme: boolean;
  // ICMS do estado, em pontos-base (17% = 1700)
  icmsPorDezMil: number;
};

export type ResultadoDaImportacao = {
  ok: true;
  valor: number;
  valorEmCentavosDeDolar: number;
  faixa: "ate-50" | "acima-de-50" | "fora-do-programa";
  aliquotaPorMil: number;
  impostoDeImportacaoBruto: number;
  desconto: number;
  impostoDeImportacao: number;
  baseDoIcms: number;
  icms: number;
  impostos: number;
  total: number;
  // Impostos como parte do valor da compra, em décimos de ponto percentual
  pesoDosImpostosPorMil: number;
};

export type ErroDaImportacao = { ok: false; erros: { campo: string; mensagem: string }[] };

const P = IMPORTACAO_2026;

export function calcularImportacao(entrada: EntradaDaImportacao): ResultadoDaImportacao | ErroDaImportacao {
  const erros: ErroDaImportacao["erros"] = [];
  if (!(entrada.valor > 0)) erros.push({ campo: "valor", mensagem: "Digite o valor da compra." });
  if (!(entrada.cotacao >= 10000 && entrada.cotacao <= 500000)) {
    erros.push({ campo: "cotacao", mensagem: "Digite a cotação do dólar em reais, como 5,40." });
  }
  const a = entrada.icmsPorDezMil;
  if (!(a >= P.icms.minimoPorDezMil && a <= P.icms.maximoPorDezMil)) {
    erros.push({ campo: "icms", mensagem: "O ICMS das compras internacionais vai de 17% a 20%." });
  }
  if (erros.length) return { ok: false, erros };

  const { valor, cotacao } = entrada;
  // Valor em centavos de dólar e limites em centavos de real pela cotação
  const valorEmCentavosDeDolar = dividirArredondando(valor * 10000, cotacao);
  const emReais = (dolares: number) => dividirArredondando(dolares * cotacao, 100);
  if (valor > emReais(P.limiteEmDolares)) {
    return {
      ok: false,
      erros: [{ campo: "valor", mensagem: "Acima de US$ 3 mil, a compra sai do regime simplificado e tem outras regras." }],
    };
  }

  let faixa: ResultadoDaImportacao["faixa"];
  let aliquotaPorMil: number;
  let desconto = 0;
  if (!entrada.remessaConforme) {
    faixa = "fora-do-programa";
    aliquotaPorMil = P.foraDoPrograma.aliquotaPorMil;
  } else if (valor <= emReais(P.remessaConforme.ateDolares)) {
    faixa = "ate-50";
    aliquotaPorMil = P.remessaConforme.aliquotaAtePorMil;
  } else {
    faixa = "acima-de-50";
    aliquotaPorMil = P.remessaConforme.aliquotaAcimaPorMil;
    desconto = emReais(P.remessaConforme.descontoEmDolares);
  }
  const impostoDeImportacaoBruto = dividirArredondando(valor * aliquotaPorMil, 1000);
  const impostoDeImportacao = Math.max(0, impostoDeImportacaoBruto - desconto);
  // ICMS "por dentro": [(valor + II) / (1 − alíquota)] × alíquota
  const baseDoIcms = dividirArredondando((valor + impostoDeImportacao) * 10000, 10000 - a);
  const icms = dividirArredondando((valor + impostoDeImportacao) * a, 10000 - a);
  const impostos = impostoDeImportacao + icms;

  return {
    ok: true,
    valor,
    valorEmCentavosDeDolar,
    faixa,
    aliquotaPorMil,
    impostoDeImportacaoBruto,
    desconto: Math.min(desconto, impostoDeImportacaoBruto),
    impostoDeImportacao,
    baseDoIcms,
    icms,
    impostos,
    total: valor + impostos,
    pesoDosImpostosPorMil: dividirArredondando(impostos * 1000, valor),
  };
}

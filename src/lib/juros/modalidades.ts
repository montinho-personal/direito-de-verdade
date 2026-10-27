// Modalidades de crédito da calculadora de juros abusivos, a série do Banco Central que
// corresponde a cada uma e as regras próprias. Só mudar depois de conferir de novo com as
// fontes. Trechos e links em docs/calculadoras/juros-abusivos.md.
//
// - Cada modalidade só é comparada com a série da mesma modalidade. Sem série adequada
//   ("outro", imobiliário sem saber o tipo de taxa), não há comparação.
// - Cheque especial: juros limitados a 8% ao mês para pessoas físicas e MEI (Resolução CMN
//   4.765/2019, art. 3º, em vigor desde 06/01/2020).
// - Rotativo e parcelamento da fatura: juros e encargos não podem passar de 100% do valor
//   original da dívida, para dívidas contraídas a partir de 03/01/2024 (Lei 14.690/2023,
//   regulamentada pelo CMN; Secom/Presidência, 03/01/2024).
// - Consignado do INSS: o teto mensal é fixado pelo Conselho Nacional de Previdência
//   Social e muda com o tempo; a calculadora não embute o valor e manda conferir no INSS.
// - Imobiliário: as séries do BC separam taxas reguladas (SFH e afins) de taxas de mercado;
//   o contrato costuma ter, além dos juros, um indexador (TR, IPCA ou poupança).
import { INICIO_DAS_SERIES, SERIES_ATUALIZADAS_EM, SERIES_BCB } from "./series-bcb.ts";

export const MODALIDADES = [
  "pessoal",
  "consignado",
  "veiculo",
  "imobiliario",
  "rotativo",
  "parcelamento-fatura",
  "cheque-especial",
  "outro",
] as const;

export type Modalidade = (typeof MODALIDADES)[number];

export const NOME_DA_MODALIDADE: Record<Modalidade, string> = {
  pessoal: "Empréstimo pessoal",
  consignado: "Empréstimo consignado",
  veiculo: "Financiamento de veículo",
  imobiliario: "Financiamento imobiliário",
  rotativo: "Cartão de crédito rotativo",
  "parcelamento-fatura": "Parcelamento de fatura do cartão",
  "cheque-especial": "Cheque especial",
  outro: "Outro tipo de crédito",
};

// Rotativo e cheque especial não têm parcelas fixas: a conta é sobre a taxa do mês
export const EH_ROTATIVO: Record<Modalidade, boolean> = {
  pessoal: false,
  consignado: false,
  veiculo: false,
  imobiliario: false,
  rotativo: true,
  "parcelamento-fatura": false,
  "cheque-especial": true,
  outro: false,
};

export type Subtipo = { valor: string; nome: string; serie: number | null };

// Pergunta extra das modalidades que o BC divide em mais de uma série
export const SUBTIPOS: Partial<Record<Modalidade, { pergunta: string; ajuda?: string; opcoes: Subtipo[] }>> = {
  consignado: {
    pergunta: "Para quem é o consignado?",
    opcoes: [
      { valor: "inss", nome: "Aposentado ou pensionista do INSS", serie: 25468 },
      { valor: "privado", nome: "Trabalhador de empresa privada (CLT)", serie: 25466 },
      { valor: "publico", nome: "Servidor público", serie: 25467 },
      { valor: "nao-sei", nome: "Não sei", serie: 25469 },
    ],
  },
  imobiliario: {
    pergunta: "O financiamento tem taxa regulada ou de mercado?",
    ajuda:
      "Taxa regulada: Sistema Financeiro da Habitação (SFH), programas habitacionais, recursos da poupança com teto de juros. Taxa de mercado: livre, definida pelo banco. Está no contrato.",
    opcoes: [
      { valor: "reguladas", nome: "Taxa regulada (SFH ou programa habitacional)", serie: 25498 },
      { valor: "mercado", nome: "Taxa de mercado", serie: 25497 },
      { valor: "nao-sei", nome: "Não sei", serie: null },
    ],
  },
};

const SERIE_PADRAO: Record<Modalidade, number | null> = {
  pessoal: 25464,
  consignado: 25469,
  veiculo: 25471,
  imobiliario: null,
  rotativo: 25477,
  "parcelamento-fatura": 25478,
  "cheque-especial": 25463,
  outro: null,
};

export function serieDa(modalidade: Modalidade, subtipo?: string): number | null {
  const opcoes = SUBTIPOS[modalidade]?.opcoes;
  if (opcoes) return opcoes.find((o) => o.valor === subtipo)?.serie ?? null;
  return SERIE_PADRAO[modalidade];
}

// Quantos meses depois do último divulgado ainda aceitamos usar a última média, com aviso
export const DEFASAGEM_MAXIMA = 3;

export type Referencia =
  | {
      ok: true;
      serie: number;
      nome: string;
      mes: { ano: number; mes: number };
      // % ao mês como fração (0,0197)
      taxaMensal: number;
      // Mês do contrato ainda sem média divulgada: usamos a última, com aviso
      defasada: boolean;
      atualizadaEm: string;
    }
  | { ok: false; motivo: "sem-serie" | "antes-da-serie" | "ainda-nao-divulgada" | "data-invalida"; detalhe: string };

const ordem = (m: { ano: number; mes: number }) => m.ano * 12 + m.mes - 1;

export function referencia(modalidade: Modalidade, subtipo: string | undefined, dataDoContrato: { ano: number; mes: number }): Referencia {
  const codigo = serieDa(modalidade, subtipo);
  if (codigo === null)
    return {
      ok: false,
      motivo: "sem-serie",
      detalhe:
        modalidade === "imobiliario"
          ? "Sem saber se a taxa é regulada ou de mercado, não há uma média do Banco Central comparável."
          : "O Banco Central não divulga uma média para esse tipo de crédito em separado.",
    };
  const serie = SERIES_BCB[codigo];
  const inicio = ordem(INICIO_DAS_SERIES);
  const fim = ordem(serie.fim);
  const alvo = ordem(dataDoContrato);
  if (alvo < inicio)
    return { ok: false, motivo: "antes-da-serie", detalhe: "As médias do Banco Central usadas aqui começam em março de 2011." };
  if (alvo > fim + DEFASAGEM_MAXIMA)
    return {
      ok: false,
      motivo: "ainda-nao-divulgada",
      detalhe: "A média do mês do contrato ainda não foi divulgada pelo Banco Central.",
    };
  const usado = Math.min(alvo, fim);
  return {
    ok: true,
    serie: codigo,
    nome: serie.nome,
    mes: { ano: Math.floor(usado / 12), mes: (usado % 12) + 1 },
    taxaMensal: serie.valores[usado - inicio] / 10000,
    defasada: alvo > fim,
    atualizadaEm: SERIES_ATUALIZADAS_EM,
  };
}

export const TETO_CHEQUE_ESPECIAL = { taxaMensal: 0.08, desde: { ano: 2020, mes: 1, dia: 6 } } as const;
export const TETO_DO_ROTATIVO = { desde: { ano: 2024, mes: 1, dia: 3 } } as const;

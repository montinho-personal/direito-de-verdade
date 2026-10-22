// Parâmetros legais do FGTS usados pela calculadora. Valores em centavos e percentuais
// em milésimos (8% = 80). Só mudar depois de conferir de novo com as fontes, nunca
// automaticamente. Fontes e trechos em docs/calculadoras/fgts.md.
//
// - 8% da remuneração do mês, incluídos o 13º e as parcelas dos arts. 457 e 458 da CLT;
//   aprendiz, 2% (Lei 8.036/1990, art. 15, caput e § 7º). Fora da base, as parcelas do
//   art. 28, § 9º, da Lei 8.212/1991 (art. 15, § 6º): férias indenizadas com 1/3, abono de
//   férias, vale-transporte, PLR, diárias.
// - Prazo: dia 20 do mês seguinte desde a competência março/2024 (Lei 14.438/2022, art. 19;
//   FAQ do FGTS Digital); antes, dia 7. Quando o dia 20 não é dia útil, o vencimento é
//   antecipado (FAQ do FGTS Digital). Doméstico: DAE do eSocial, também dia 20 desde
//   março/2024 (notícia oficial do eSocial de 19/03/2024).
// - Doméstico: 8% de FGTS e, à parte, 3,2% de antecipação da indenização da dispensa,
//   em conta separada; não há multa de 40% (LC 150/2015, arts. 22 e 34).
// - Correção: TR + juros de 3% ao ano (Lei 8.036, art. 13), mais a distribuição anual de
//   resultados (art. 13, § 5º), que não entra na base da multa (§ 7º). Desde a ADI 5.090
//   (STF, 2024), a remuneração total deve chegar ao menos ao IPCA.
// - Multa: 40% de todos os depósitos do contrato, corrigidos e com juros, sem descontar
//   os saques (art. 18, § 1º; Decreto 99.684/1990, art. 9º, § 1º); 20% na culpa recíproca
//   ou força maior (art. 18, § 2º) e no acordo (CLT, art. 484-A, com saque de até 80%).
// - Saque-aniversário: tabela do Anexo da Lei 8.036 (Lei 13.932/2019); saque até o último
//   dia útil do 2º mês seguinte (art. 20, § 23); volta ao saque-rescisão no 1º dia do 25º
//   mês seguinte ao pedido (art. 20-C, § 1º, I).
import { REGRAS_DA_RESCISAO } from "../trabalhista/parametros.ts";

export type Vinculo = "clt" | "aprendiz" | "domestico";

export const FGTS_2026 = {
  revisadoEm: "2026-10-22",
  aliquotaPorMil: { clt: REGRAS_DA_RESCISAO.fgtsPorMil, aprendiz: 20, domestico: REGRAS_DA_RESCISAO.fgtsPorMil },
  // Só no emprego doméstico (LC 150, art. 22)
  indenizacaoDomesticoPorMil: 32,
  multaSemJustaCausaPorMil: REGRAS_DA_RESCISAO.multaSemJustaCausaPorMil,
  multaReduzidaPorMil: 200,
  multaAcordoPorMil: REGRAS_DA_RESCISAO.multaAcordoPorMil,
  saqueNoAcordoPorMil: REGRAS_DA_RESCISAO.saqueNoAcordoPorMil,
  // Competência a partir da qual o prazo é o dia 20 (antes, dia 7)
  prazoNovoDesde: { ano: 2024, mes: 3 },
  diaDoPrazoNovo: 20,
  diaDoPrazoAntigo: 7,
  // Juros de 3% ao ano, em taxa mensal equivalente: 1,03^(1/12) − 1 = 0,0024662698...
  // (dez casas, em décimos de bilionésimo)
  jurosMensaisPorDezBilhoes: 24_662_698,
  // Saque-aniversário (Anexo da Lei 8.036): até o limite da faixa, alíquota e parcela adicional
  saqueAniversario: [
    { ate: 50_000, aliquotaPorMil: 500, adicional: 0 },
    { ate: 100_000, aliquotaPorMil: 400, adicional: 5_000 },
    { ate: 500_000, aliquotaPorMil: 300, adicional: 15_000 },
    { ate: 1_000_000, aliquotaPorMil: 200, adicional: 65_000 },
    { ate: 1_500_000, aliquotaPorMil: 150, adicional: 115_000 },
    { ate: 2_000_000, aliquotaPorMil: 100, adicional: 190_000 },
    { ate: Infinity, aliquotaPorMil: 50, adicional: 290_000 },
  ],
  // Saque de conta sem movimentação por 1 ano com saldo abaixo deste valor (art. 20, XXI)
  saldoPequeno: 8_000,
} as const;

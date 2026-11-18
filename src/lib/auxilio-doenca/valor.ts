// Valor do auxílio-doença (auxílio por incapacidade temporária) do INSS. Recebe e devolve
// centavos inteiros; as telas convertem reais ↔ centavos na borda.
//
// Regras (conferidas em 18/11/2026):
// - salário de benefício = média de 100% dos salários de contribuição desde julho de 1994,
//   corrigidos (EC 103/2019, artigo 26), entre o salário mínimo e o teto do INSS
//   (Lei 8.213/1991, artigo 29, § 2º);
// - renda = 91% do salário de benefício (artigo 61);
// - não pode passar da média dos 12 últimos salários de contribuição (artigo 29, § 10);
// - não pode ser menor que o salário mínimo (artigo 33).
// Salário mínimo e teto de 2026 vêm de src/lib/tributos/parametros-2026.ts.
import { PARAMETROS_2026, type ParametrosTributarios } from "../tributos/parametros-2026.ts";

export type AvisoDoAuxilio = "piso" | "limite-12" | "teto";

export type ResultadoDoAuxilio = {
  salarioDeBeneficio: number;
  noventaEUmPorCento: number;
  // Média dos 12 últimos, quando informada
  limiteDos12: number | null;
  valor: number;
  avisos: AvisoDoAuxilio[];
};

export function tetoDoInss(parametros: ParametrosTributarios = PARAMETROS_2026) {
  return parametros.inss[parametros.inss.length - 1].ate;
}

// 91% arredondado ao centavo mais próximo (meio centavo para cima)
function noventaEUm(centavos: number) {
  return Math.floor((centavos * 91 * 2 + 100) / 200);
}

export function calcularAuxilioDoenca(
  entrada: { mediaGeral: number; mediaDos12?: number | null },
  parametros: ParametrosTributarios = PARAMETROS_2026,
): ResultadoDoAuxilio {
  const minimo = parametros.salarioMinimo;
  const teto = tetoDoInss(parametros);
  const avisos: AvisoDoAuxilio[] = [];

  let salarioDeBeneficio = entrada.mediaGeral;
  if (salarioDeBeneficio > teto) {
    salarioDeBeneficio = teto;
    avisos.push("teto");
  }
  if (salarioDeBeneficio < minimo) salarioDeBeneficio = minimo;

  const noventaEUmPorCento = noventaEUm(salarioDeBeneficio);
  let valor = noventaEUmPorCento;

  const limiteDos12 = entrada.mediaDos12 ?? null;
  if (limiteDos12 !== null && limiteDos12 < valor) {
    valor = limiteDos12;
    avisos.push("limite-12");
  }
  if (valor < minimo) {
    valor = minimo;
    avisos.push("piso");
  }
  return { salarioDeBeneficio, noventaEUmPorCento, limiteDos12, valor, avisos };
}

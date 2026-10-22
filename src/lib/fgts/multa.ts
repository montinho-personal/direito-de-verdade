// Multa rescisória do FGTS (indenização compensatória) e o que dá para sacar na saída.
//
// Base: todos os depósitos do contrato, corrigidos e com juros, sem descontar saques
// (Lei 8.036, art. 18, § 1º; Decreto 99.684, art. 9º, § 1º; OJ 42 do TST), mais os
// depósitos do mês da rescisão e do anterior que ainda não estejam no extrato (§ 3º). A
// distribuição de resultados não entra (art. 13, § 7º). No extrato, é o valor "para fins
// rescisórios".
//
// Doméstico: não há multa de 40%; a indenização são os 3,2% depositados todo mês em conta
// separada, que ficam com o empregado ou voltam ao empregador conforme o motivo
// (LC 150/2015, art. 22).
import { dividirArredondando } from "../tributos/calculo.ts";
import { FGTS_2026 as P, type Vinculo } from "./parametros.ts";

export type Motivo =
  | "sem-justa-causa" // inclui a rescisão indireta (art. 20, I)
  | "acordo" // CLT, art. 484-A
  | "culpa-reciproca" // ou força maior, reconhecida pela Justiça do Trabalho
  | "termo-antecipado" // contrato a prazo encerrado antes pela empresa, sem justa causa
  | "termo-normal" // contrato a prazo que chegou ao fim (inclui temporário e experiência)
  | "pedido" // pedido de demissão
  | "justa-causa";

export type EntradaDaMulta = {
  vinculo: Vinculo;
  motivo: Motivo;
  // Valor "para fins rescisórios" do extrato, ou a estimativa da calculadora
  base: number;
  // Depósitos da rescisão ainda fora do extrato (mês da saída, anterior, aviso, 13º)
  depositosDaRescisao?: number;
  // Saldo atual da conta deste contrato (para mostrar o que dá para sacar)
  saldoAtual?: number;
  // Total dos 3,2% do doméstico, se conhecido
  indenizacaoDomestico?: number;
  saqueAniversario?: boolean;
};

export type ResultadoDaMulta = {
  ok: true;
  base: number;
  percentualPorMil: number;
  multa: number;
  // O que o trabalhador pode sacar da conta na saída
  saque: "tudo" | "80%" | "so-multa" | "nada";
  // Valor sacável, quando o saldo foi informado
  valorSacavel: number | null;
  // Doméstico: destino dos 3,2%
  indenizacaoDomestico: { valor: number; paraOEmpregado: number; paraOEmpregador: number; destinoIncerto: boolean } | null;
  restricoes: string[];
};

export type ErroDaMulta = { ok: false; erros: { campo: string; mensagem: string }[] };

const PERCENTUAL: Record<Motivo, number> = {
  "sem-justa-causa": P.multaSemJustaCausaPorMil,
  acordo: P.multaAcordoPorMil,
  "culpa-reciproca": P.multaReduzidaPorMil,
  "termo-antecipado": P.multaSemJustaCausaPorMil,
  "termo-normal": 0,
  pedido: 0,
  "justa-causa": 0,
};

// Saque da conta pela rescisão (Lei 8.036, art. 20, I, I-A e IX)
const SAQUE: Record<Motivo, ResultadoDaMulta["saque"]> = {
  "sem-justa-causa": "tudo",
  acordo: "80%",
  "culpa-reciproca": "tudo",
  "termo-antecipado": "tudo",
  "termo-normal": "tudo",
  pedido: "nada",
  "justa-causa": "nada",
};

export function calcularMulta(e: EntradaDaMulta): ResultadoDaMulta | ErroDaMulta {
  const domestico = e.vinculo === "domestico";
  if (!domestico && !(e.base >= 0)) return { ok: false, erros: [{ campo: "base", mensagem: "Digite os depósitos do contrato." }] };
  const base = domestico ? 0 : e.base + (e.depositosDaRescisao ?? 0);
  const percentualPorMil = domestico ? 0 : PERCENTUAL[e.motivo];
  const multa = dividirArredondando(base * percentualPorMil, 1000);
  const restricoes: string[] = [];

  let saque = SAQUE[e.motivo];
  if (e.saqueAniversario && saque !== "nada") {
    // No saque-aniversário, a rescisão não libera o saldo (art. 20-A, § 2º, II); a multa da
    // dispensa sem justa causa, sim (art. 20-D, § 6º)
    saque = percentualPorMil > 0 ? "so-multa" : "nada";
    restricoes.push(
      "Quem aderiu ao saque-aniversário não saca o saldo na saída: ele fica na conta. Dá para sacar a multa, quando ela existe, e continuar com os saques anuais.",
    );
    if (e.motivo === "acordo") {
      restricoes.push("No acordo, a lei não diz expressamente se a multa de 20% pode ser sacada no saque-aniversário: confira no app FGTS.");
    }
  }
  if (e.motivo === "acordo") restricoes.push("No acordo, não há seguro-desemprego (CLT, art. 484-A, § 2º).");
  if (e.motivo === "culpa-reciproca") restricoes.push("A multa de 20% vale quando a culpa recíproca ou a força maior é reconhecida pela Justiça do Trabalho.");
  if (e.motivo === "termo-antecipado") {
    restricoes.push("No contrato a prazo encerrado antes pela empresa, há também a indenização da CLT, art. 479: metade dos salários até o fim previsto.");
  }

  const saldo = e.saldoAtual;
  const valorSacavel =
    saldo === undefined
      ? null
      : saque === "tudo"
        ? saldo + multa
        : saque === "80%"
          ? dividirArredondando(base * P.saqueNoAcordoPorMil, 1000) + multa
          : saque === "so-multa"
            ? multa
            : 0;
  if (saque === "80%" && saldo !== undefined) {
    restricoes.push("No acordo, o saque é de até 80% dos depósitos; o resto fica na conta.");
  }

  let indenizacaoDomestico: ResultadoDaMulta["indenizacaoDomestico"] = null;
  if (domestico) {
    const valor = e.indenizacaoDomestico ?? 0;
    // LC 150, art. 22: dispensa sem justa causa ou por culpa do empregador → empregado;
    // justa causa, pedido, fim do contrato a prazo → empregador; culpa recíproca → metade
    const doEmpregado =
      e.motivo === "sem-justa-causa" || e.motivo === "termo-antecipado"
        ? valor
        : e.motivo === "culpa-reciproca"
          ? dividirArredondando(valor, 2)
          : 0;
    indenizacaoDomestico = { valor, paraOEmpregado: doEmpregado, paraOEmpregador: valor - doEmpregado, destinoIncerto: e.motivo === "acordo" };
    restricoes.push("No emprego doméstico não há multa de 40%: a indenização são os 3,2% depositados todo mês em conta separada.");
    if (e.motivo === "acordo") restricoes.push("O acordo do art. 484-A da CLT no emprego doméstico não tem regra própria na LC 150: confira com o sindicato ou a Defensoria.");
  }

  return { ok: true, base, percentualPorMil, multa, saque, valorSacavel, indenizacaoDomestico, restricoes };
}

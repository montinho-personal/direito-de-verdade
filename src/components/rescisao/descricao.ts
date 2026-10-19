// Textos da memória de cálculo da rescisão: nome, quantidade, fórmula e explicação de
// cada verba e de cada desconto, a partir dos números do motor.
import { reais } from "@/lib/dinheiro";
import { formatarData } from "@/lib/trabalhista/datas.ts";
import type { Desconto, ResultadoDaRescisao, Verba } from "@/lib/trabalhista/rescisao.ts";

export type LinhaDaMemoria = {
  nome: string;
  quantidade: string;
  formula: string;
  valor: number;
  explicacao: string;
};

export function descreverVerba(v: Verba, r: ResultadoDaRescisao): LinhaDaMemoria {
  const base = reais(v.base);
  const comMedia = r.usouMediaVariaveis && v.id !== "saldo" && v.id !== "terco" ? " (salário + média informada)" : "";
  switch (v.id) {
    case "saldo":
      return {
        nome: "Saldo de salário",
        quantidade: `${v.quantidade} dias`,
        formula: `${base} ÷ 30 × ${v.quantidade}`,
        valor: v.valor,
        explicacao: "Os dias trabalhados no mês da saída, contando o mês como 30 dias.",
      };
    case "aviso":
      return {
        nome: r.motivo === "acordo" ? "Metade do aviso prévio indenizado" : "Aviso prévio indenizado",
        quantidade: `${v.quantidade} dias`,
        formula: `${base}${comMedia} ÷ 30 × ${v.quantidade}${v.divisor === 60 ? " ÷ 2" : ""}`,
        valor: v.valor,
        explicacao: `30 dias + 3 por ano completo de empresa (${r.datas.anosDeServico} ${r.datas.anosDeServico === 1 ? "ano" : "anos"}), até 90.${r.motivo === "acordo" ? " No acordo, a empresa paga a metade." : ""} Sem INSS e sem imposto de renda.`,
      };
    case "decimo-proporcional":
      return {
        nome: "13º salário proporcional",
        quantidade: `${v.quantidade}/12`,
        formula: `${base}${comMedia} ÷ 12 × ${v.quantidade}`,
        valor: v.valor,
        explicacao: "1/12 por mês do ano com 15 dias ou mais de trabalho.",
      };
    case "decimo-aviso":
      return {
        nome: "13º sobre a projeção do aviso",
        quantidade: `${v.quantidade}/12`,
        formula: `${base}${comMedia} ÷ 12 × ${v.quantidade}`,
        valor: v.valor,
        explicacao: "Os dias do aviso indenizado contam como tempo de serviço e somam meses ao 13º.",
      };
    case "ferias-vencidas": {
      const periodos = v.periodos ?? [];
      const dobro = periodos.filter((p) => p.emDobro).length;
      return {
        nome: "Férias vencidas",
        quantidade: `${periodos.length} período${periodos.length > 1 ? "s" : ""}${dobro ? `, ${dobro} em dobro` : ""}`,
        formula: `${base}${comMedia} × ${v.quantidade}`,
        valor: v.valor,
        explicacao: periodos
          .map(
            (p) =>
              `${formatarData(p.inicio)} a ${formatarData(p.fim)}: ${p.emDobro ? "em dobro, porque o prazo de 12 meses para a empresa dar as férias acabou antes da saída" : "simples, ainda dentro do prazo para tirar"}`,
          )
          .join("; ") + ". Sem INSS e sem imposto de renda.",
      };
    }
    case "ferias-proporcionais":
      return {
        nome: "Férias proporcionais",
        quantidade: `${v.quantidade}/12`,
        formula: `${base}${comMedia} ÷ 12 × ${v.quantidade}`,
        valor: v.valor,
        explicacao: `1/12 por mês do período de férias em curso (desde ${v.periodos ? formatarData(v.periodos[0].inicio) : "o último aniversário de contrato"}), contando a fração acima de 14 dias. Sem INSS e sem imposto de renda.`,
      };
    case "ferias-aviso":
      return {
        nome: "Férias sobre a projeção do aviso",
        quantidade: `${v.quantidade}/12`,
        formula: `${base}${comMedia} ÷ 12 × ${v.quantidade}`,
        valor: v.valor,
        explicacao: "Os dias do aviso indenizado também somam meses às férias.",
      };
    case "terco":
      return {
        nome: "1/3 das férias",
        quantidade: "1/3",
        formula: `${reais(v.base)} ÷ 3`,
        valor: v.valor,
        explicacao: "O terço constitucional sobre todas as férias, inclusive as em dobro.",
      };
  }
}

export function descreverDesconto(d: Desconto): { nome: string; explicacao: string } {
  switch (d.id) {
    case "inss-saldo":
      return { nome: "INSS sobre o saldo de salário", explicacao: `Tabela de 2026 sobre ${reais(d.base ?? 0)}.` };
    case "inss-13":
      return { nome: "INSS sobre o 13º", explicacao: `Calculado à parte, sobre ${reais(d.base ?? 0)}.` };
    case "ir-saldo":
      return { nome: "Imposto de renda sobre o saldo", explicacao: "Tabela de 2026, com a isenção até R$ 5 mil." };
    case "ir-13":
      return { nome: "Imposto de renda sobre o 13º", explicacao: "Calculado à parte, com a mesma isenção." };
    case "aviso-nao-cumprido":
      return {
        nome: "Desconto do aviso não cumprido",
        explicacao: `${d.base} dias que faltaram para os 30 dias do aviso (CLT, art. 487, § 2º), até um mês de remuneração.`,
      };
    case "adiantamento-13":
      return { nome: "1ª parcela do 13º já recebida", explicacao: "Informada por você." };
    case "outros":
      return { nome: "Outros descontos", explicacao: "Informados por você (adiantamentos e descontos autorizados)." };
  }
}

const NOMES_DO_MOTIVO = {
  "sem-justa-causa": "demissão sem justa causa",
  pedido: "pedido de demissão",
  acordo: "acordo com a empresa",
  "justa-causa": "demissão por justa causa",
} as const;

export function nomeDoMotivo(r: Pick<ResultadoDaRescisao, "motivo">) {
  return NOMES_DO_MOTIVO[r.motivo];
}

export function resumoEmTexto(r: ResultadoDaRescisao) {
  return [
    `Simulação de rescisão (${nomeDoMotivo(r)}), estimativa com as regras de 2026`,
    ...r.verbas.map((v) => {
      const d = descreverVerba(v, r);
      return `${d.nome} (${d.quantidade}): ${reais(v.valor)}`;
    }),
    `Total bruto: ${reais(r.bruto)}`,
    `Descontos: ${reais(r.totalDeDescontos)}`,
    `Líquido estimado a receber da empresa: ${reais(r.liquido)}`,
    `Prazo para a empresa pagar: até ${formatarData(r.datas.prazoDePagamento)}`,
    ...(r.fgts.multa > 0 ? [`Multa do FGTS (depositada no FGTS): ${reais(r.fgts.multa)}`] : []),
    "Valores estimados; podem variar conforme documentos e convenção coletiva.",
    "Calculado em https://direitodeverdade.com.br/calculadoras/rescisao",
  ].join("\n");
}

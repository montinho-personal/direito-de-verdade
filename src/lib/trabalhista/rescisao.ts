// Motor da rescisão de quem tem carteira assinada e contrato sem prazo: demissão sem
// justa causa, pedido de demissão, acordo (CLT, art. 484-A) e justa causa. Valores em
// centavos inteiros; cada verba é arredondada ao centavo (meio centavo para cima).
// Não sabe nada de tela: a memória de cálculo sai em dados, e a interface escreve.
//
// Regras e fontes: src/lib/trabalhista/parametros.ts e docs/calculadoras/rescisao.md.
import { calcularInss, calcularIrrf, dividirArredondando } from "../tributos/calculo.ts";
import {
  anosCompletos,
  compararDatas,
  type Data,
  diasDoMes,
  lerData,
  numeroDoDia,
  somarDias,
  somarMeses,
} from "./datas.ts";
import { REGRAS_DA_RESCISAO as R } from "./parametros.ts";

export type Motivo = "sem-justa-causa" | "pedido" | "acordo" | "justa-causa";

// Situação do aviso prévio. Na demissão e no acordo: "indenizado" ou "trabalhado".
// No pedido: "trabalhado" (cumprido), "parcial", "nao-cumprido" ou "dispensado"
// (a empresa abriu mão). Na justa causa não há aviso.
export type Aviso = "indenizado" | "trabalhado" | "parcial" | "nao-cumprido" | "dispensado";

export type EntradaDaRescisao = {
  motivo: Motivo;
  // Salário mensal fixo, em centavos
  salario: number;
  // AAAA-MM-DD
  admissao: string;
  // Último dia trabalhado (no aviso indenizado, o dia em que a dispensa foi comunicada)
  saida: string;
  aviso?: Aviso;
  // Dias de aviso trabalhados, quando o pedido teve aviso cumprido em parte
  diasDeAvisoCumpridos?: number;
  // Períodos de 12 meses completos sem férias tiradas (0, 1 ou 2)
  feriasVencidas?: number;
  // Modo detalhado
  mediaVariaveis?: number; // média mensal de horas extras, comissões e adicionais
  adiantamento13?: number; // 1ª parcela do 13º já recebida no ano
  outrosDescontos?: number; // adiantamentos e descontos autorizados
  dependentes?: number;
  // FGTS: base para a multa (todos os depósitos do contrato, com correção, mesmo os já
  // sacados). Sem ela, a calculadora estima pelos salários.
  fgtsParaFinsRescisorios?: number;
  saldoAtualDoFgts?: number;
  saqueAniversario?: boolean;
};

export type Origem = "calculado" | "estimado" | "informado";

export type IdDaVerba =
  | "saldo"
  | "aviso"
  | "decimo-proporcional"
  | "decimo-aviso"
  | "ferias-vencidas"
  | "ferias-proporcionais"
  | "ferias-aviso"
  | "terco";

export type Verba = {
  id: IdDaVerba;
  // Remuneração usada na conta
  base: number;
  // Quantidade (dias ou avos) e o divisor: base × quantidade ÷ divisor × multiplicador
  quantidade: number;
  divisor: number;
  multiplicador: number;
  valor: number;
  incideInss: boolean;
  incideIr: boolean;
  // Detalhes de cada verba que a memória de cálculo mostra
  periodos?: { inicio: Data; fim: Data; emDobro: boolean }[];
};

export type IdDoDesconto =
  | "inss-saldo"
  | "inss-13"
  | "ir-saldo"
  | "ir-13"
  | "aviso-nao-cumprido"
  | "adiantamento-13"
  | "outros";

export type Desconto = { id: IdDoDesconto; valor: number; origem: Origem; base?: number };

export type ResultadoDaRescisao = {
  ok: true;
  motivo: Motivo;
  aviso: Aviso | null;
  datas: {
    admissao: Data;
    saida: Data;
    anosDeServico: number;
    diasDeAviso: number; // dias do aviso proporcional (0 quando não se aplica)
    fimProjetado: Data | null; // fim do contrato com a projeção do aviso indenizado
    prazoDePagamento: Data;
  };
  remuneracao: number;
  verbas: Verba[];
  bruto: number;
  descontos: Desconto[];
  totalDeDescontos: number;
  // O que a empresa paga (verbas − descontos), nunca negativo
  liquido: number;
  // Descontos maiores que as verbas: a diferença que não coube na rescisão
  descontoQueSobrou: number;
  fgts: {
    depositosDaRescisao: number; // 8% sobre saldo, aviso indenizado e 13º
    base: number; // base da multa usada (informada ou estimada) + depósitos da rescisão
    origemDaBase: "informado" | "estimado";
    percentualDaMultaPorMil: number;
    multa: number;
    // Saque: "tudo", "ate-80" (acordo), "so-multa" (saque-aniversário) ou "nao"
    saque: "tudo" | "ate-80" | "so-multa" | "nao";
    // Valor estimado que pode ser sacado, quando o saldo atual foi informado
    saqueEstimado: number | null;
  };
  podeTerSeguroDesemprego: boolean;
  usouMediaVariaveis: boolean;
};

export type ErroDaRescisao = { ok: false; erros: { campo: string; mensagem: string }[] };

// Avos de 13º: meses do ano com 15 dias ou mais de trabalho (Lei 4.090/1962, art. 1º, § 2º)
function avosDe13(ano: number, inicio: Data, fim: Data) {
  let avos = 0;
  for (let mes = 1; mes <= 12; mes++) {
    const primeiro = numeroDoDia({ ano, mes, dia: 1 });
    const ultimo = numeroDoDia({ ano, mes, dia: diasDoMes(ano, mes) });
    const de = Math.max(primeiro, numeroDoDia(inicio));
    const ate = Math.min(ultimo, numeroDoDia(fim));
    if (ate - de + 1 >= 15) avos++;
  }
  return avos;
}

// Avos de férias a partir do início do período aquisitivo: 1/12 por mês de serviço ou
// fração acima de 14 dias (CLT, art. 146, parágrafo único). Pode passar de 12 quando
// a projeção do aviso completa um período e começa outro.
function avosDeFerias(inicio: Data, fim: Data) {
  let meses = 0;
  while (compararDatas(somarDias(somarMeses(inicio, meses + 1), -1), fim) <= 0) meses++;
  const restante = numeroDoDia(fim) - numeroDoDia(somarMeses(inicio, meses)) + 1;
  return meses + (restante > 14 ? 1 : 0);
}

function parte(valor: number, quantidade: number, divisor: number) {
  return dividirArredondando(valor * quantidade, divisor);
}

export function calcularRescisao(
  entrada: EntradaDaRescisao,
): ResultadoDaRescisao | ErroDaRescisao {
  const erros: ErroDaRescisao["erros"] = [];
  const admissao = lerData(entrada.admissao);
  const saida = lerData(entrada.saida);
  if (!(entrada.salario > 0)) erros.push({ campo: "salario", mensagem: "Digite um salário maior que zero." });
  if (!admissao) erros.push({ campo: "admissao", mensagem: "Informe uma data de admissão válida." });
  if (!saida) erros.push({ campo: "saida", mensagem: "Informe uma data de saída válida." });
  if (admissao && saida && compararDatas(saida, admissao) < 0) {
    erros.push({ campo: "saida", mensagem: "A saída não pode ser antes da admissão." });
  }
  if (admissao && saida && saida.ano - admissao.ano > 60) {
    erros.push({ campo: "admissao", mensagem: "Confira o ano da admissão." });
  }
  const vencidas = Math.floor(entrada.feriasVencidas ?? 0);
  if (admissao && saida && compararDatas(saida, admissao) >= 0) {
    const anos = anosCompletos(admissao, saida);
    if (vencidas > Math.min(2, anos)) {
      erros.push({
        campo: "feriasVencidas",
        mensagem:
          anos === 0
            ? "Com menos de 1 ano de empresa, ainda não há férias vencidas."
            : `Com ${anos} ano${anos > 1 ? "s" : ""} completo${anos > 1 ? "s" : ""}, o máximo de períodos vencidos é ${Math.min(2, anos)}.`,
      });
    }
  }
  const motivo = entrada.motivo;
  const aviso: Aviso | null =
    motivo === "justa-causa"
      ? null
      : motivo === "pedido"
        ? entrada.aviso && ["trabalhado", "parcial", "nao-cumprido", "dispensado"].includes(entrada.aviso)
          ? entrada.aviso
          : "trabalhado"
        : entrada.aviso === "trabalhado"
          ? "trabalhado"
          : "indenizado";
  const cumpridos = Math.floor(entrada.diasDeAvisoCumpridos ?? 0);
  if (aviso === "parcial" && !(cumpridos >= 1 && cumpridos <= 29)) {
    erros.push({ campo: "diasDeAvisoCumpridos", mensagem: "Informe de 1 a 29 dias cumpridos." });
  }
  if (erros.length || !admissao || !saida) return { ok: false, erros };

  const salario = entrada.salario;
  const media = Math.max(0, entrada.mediaVariaveis ?? 0);
  const remuneracao = salario + media;
  const anos = anosCompletos(admissao, saida);
  const diasDoAvisoProporcional = Math.min(R.aviso.maximo, R.aviso.base + R.aviso.porAno * anos);

  const empresaEncerrou = motivo === "sem-justa-causa" || motivo === "acordo";
  const avisoIndenizado = empresaEncerrou && aviso === "indenizado";
  // O aviso indenizado conta como tempo de serviço (CLT, art. 487, § 1º; Súmula 371
  // do TST): o contrato se projeta até o fim dele. No acordo a projeção é discutida;
  // a conta não projeta (ver docs/calculadoras/rescisao.md).
  const projeta = avisoIndenizado && motivo === "sem-justa-causa";
  const fimProjetado = projeta ? somarDias(saida, diasDoAvisoProporcional) : null;
  const fim = fimProjetado ?? saida;

  const verbas: Verba[] = [];
  const adicionar = (verba: Omit<Verba, "valor"> & { valor?: number }) => {
    const valor =
      verba.valor ??
      dividirArredondando(verba.base * verba.quantidade * verba.multiplicador, verba.divisor);
    if (valor > 0) verbas.push({ ...verba, valor });
  };

  // Saldo de salário: dias trabalhados no mês da saída (mês comercial de 30 dias);
  // o mês inteiro trabalhado vale o salário cheio
  const inicioDoMes = { ano: saida.ano, mes: saida.mes, dia: 1 };
  const desde = compararDatas(admissao, inicioDoMes) > 0 ? admissao : inicioDoMes;
  const mesInteiro = desde.dia === 1 && saida.dia === diasDoMes(saida.ano, saida.mes);
  const diasNoMes = mesInteiro ? 30 : Math.min(30, saida.dia - desde.dia + 1);
  adicionar({
    id: "saldo",
    base: salario,
    quantidade: diasNoMes,
    divisor: 30,
    multiplicador: 1,
    incideInss: true,
    incideIr: true,
  });

  // Aviso prévio indenizado (inteiro na demissão, metade no acordo)
  if (avisoIndenizado) {
    adicionar({
      id: "aviso",
      base: remuneracao,
      quantidade: diasDoAvisoProporcional,
      divisor: motivo === "acordo" ? 60 : 30,
      multiplicador: 1,
      incideInss: false,
      incideIr: false,
    });
  }

  // 13º: não é devido na justa causa (Lei 4.090/1962, art. 3º)
  if (motivo !== "justa-causa") {
    let avosAteSaida = 0;
    let avosComProjecao = 0;
    for (let ano = saida.ano; ano <= fim.ano; ano++) {
      avosAteSaida += ano === saida.ano ? avosDe13(ano, admissao, saida) : 0;
      avosComProjecao += avosDe13(ano, admissao, fim);
    }
    adicionar({
      id: "decimo-proporcional",
      base: remuneracao,
      quantidade: avosAteSaida,
      divisor: 12,
      multiplicador: 1,
      incideInss: true,
      incideIr: true,
    });
    adicionar({
      id: "decimo-aviso",
      base: remuneracao,
      quantidade: avosComProjecao - avosAteSaida,
      divisor: 12,
      multiplicador: 1,
      incideInss: true,
      incideIr: true,
    });
  }

  // Férias vencidas: os períodos completos mais recentes antes do período em curso.
  // Em dobro quando o prazo para a empresa conceder (12 meses depois do período,
  // CLT, art. 134) terminou antes da saída (art. 137); a dobra vale também para o terço.
  const periodosVencidos: { inicio: Data; fim: Data; emDobro: boolean }[] = [];
  for (let i = 0; i < vencidas; i++) {
    const indice = anos - 1 - i;
    const inicio = somarMeses(admissao, 12 * indice);
    const proximo = somarMeses(admissao, 12 * (indice + 1));
    const fimDoPrazo = somarDias(somarMeses(proximo, 12), -1);
    periodosVencidos.unshift({
      inicio,
      fim: somarDias(proximo, -1),
      emDobro: compararDatas(fimDoPrazo, saida) < 0,
    });
  }
  const emDobro = periodosVencidos.filter((p) => p.emDobro).length;
  if (vencidas > 0) {
    adicionar({
      id: "ferias-vencidas",
      base: remuneracao,
      quantidade: vencidas + emDobro,
      divisor: 1,
      multiplicador: 1,
      incideInss: false,
      incideIr: false,
      periodos: periodosVencidos,
    });
  }

  // Férias proporcionais: só não são devidas na justa causa (Súmula 171 do TST);
  // no pedido de demissão, também com menos de 1 ano (Súmula 261)
  if (motivo !== "justa-causa") {
    const inicioDoPeriodo = somarMeses(admissao, 12 * anos);
    const avosAteSaida = avosDeFerias(inicioDoPeriodo, saida);
    const avosComProjecao = avosDeFerias(inicioDoPeriodo, fim);
    adicionar({
      id: "ferias-proporcionais",
      base: remuneracao,
      quantidade: avosAteSaida,
      divisor: 12,
      multiplicador: 1,
      incideInss: false,
      incideIr: false,
      periodos: [{ inicio: inicioDoPeriodo, fim: saida, emDobro: false }],
    });
    adicionar({
      id: "ferias-aviso",
      base: remuneracao,
      quantidade: avosComProjecao - avosAteSaida,
      divisor: 12,
      multiplicador: 1,
      incideInss: false,
      incideIr: false,
    });
  }

  // 1/3 constitucional sobre todas as férias, inclusive a dobra (Súmula 328 do TST)
  const totalDeFerias = verbas
    .filter((v) => v.id.startsWith("ferias"))
    .reduce((soma, v) => soma + v.valor, 0);
  adicionar({
    id: "terco",
    base: totalDeFerias,
    quantidade: 1,
    divisor: 3,
    multiplicador: 1,
    incideInss: false,
    incideIr: false,
  });

  const bruto = verbas.reduce((soma, v) => soma + v.valor, 0);
  const valorDe = (id: IdDaVerba) => verbas.find((v) => v.id === id)?.valor ?? 0;

  // INSS e IR: saldo de salário (tabela mensal) e 13º (à parte, com a redução da
  // Lei 15.270 também no 13º). Aviso indenizado e férias indenizadas não têm INSS nem IR.
  const saldo = valorDe("saldo");
  const decimo = valorDe("decimo-proporcional") + valorDe("decimo-aviso");
  const dependentes = Math.max(0, Math.floor(entrada.dependentes ?? 0));
  const inssSaldo = calcularInss(saldo).total;
  const inss13 = calcularInss(decimo).total;
  const irSaldo = calcularIrrf({ rendimentos: saldo, previdencia: inssSaldo, dependentes }).imposto;
  const ir13 = decimo > 0 ? calcularIrrf({ rendimentos: decimo, previdencia: inss13, dependentes }).imposto : 0;

  const descontos: Desconto[] = [];
  const descontar = (desconto: Desconto) => {
    if (desconto.valor > 0) descontos.push(desconto);
  };
  descontar({ id: "inss-saldo", valor: inssSaldo, origem: "calculado", base: saldo });
  descontar({ id: "inss-13", valor: inss13, origem: "calculado", base: decimo });
  descontar({ id: "ir-saldo", valor: irSaldo, origem: "calculado", base: saldo });
  descontar({ id: "ir-13", valor: ir13, origem: "calculado", base: decimo });
  // Aviso não cumprido no pedido: desconto dos dias que faltaram de 30 (art. 487,
  // § 2º), até um mês de remuneração (art. 477, § 5º)
  if (motivo === "pedido" && (aviso === "nao-cumprido" || aviso === "parcial")) {
    const faltaram = aviso === "parcial" ? R.aviso.base - cumpridos : R.aviso.base;
    descontar({
      id: "aviso-nao-cumprido",
      valor: Math.min(remuneracao, parte(remuneracao, faltaram, R.aviso.base)),
      origem: "calculado",
      base: faltaram,
    });
  }
  descontar({ id: "adiantamento-13", valor: Math.max(0, entrada.adiantamento13 ?? 0), origem: "informado" });
  descontar({ id: "outros", valor: Math.max(0, entrada.outrosDescontos ?? 0), origem: "informado" });
  const totalDeDescontos = descontos.reduce((soma, d) => soma + d.valor, 0);

  // FGTS
  const depositosDaRescisao = parte(saldo + valorDe("aviso") + decimo, R.fgtsPorMil, 1000);
  let baseInformada = entrada.fgtsParaFinsRescisorios;
  let origemDaBase: "informado" | "estimado" = "informado";
  if (baseInformada === undefined) {
    // Estimativa: 8% da remuneração atual por mês de contrato, com o 13º e o terço das
    // férias, sem correção nem juros (o valor real costuma ser maior)
    origemDaBase = "estimado";
    const dias = numeroDoDia(saida) - numeroDoDia(admissao) + 1;
    // meses = dias ÷ 30,436875 (mês médio); fator (1 + 1/12 + 1/36) = 40/36
    baseInformada = Math.round(((remuneracao * R.fgtsPorMil) / 1000) * (dias / 30.436875) * (40 / 36));
  }
  const base = baseInformada + depositosDaRescisao;
  const percentualDaMultaPorMil =
    motivo === "sem-justa-causa" ? R.multaSemJustaCausaPorMil : motivo === "acordo" ? R.multaAcordoPorMil : 0;
  const multa = parte(base, percentualDaMultaPorMil, 1000);
  const saque =
    motivo === "sem-justa-causa"
      ? entrada.saqueAniversario
        ? "so-multa"
        : "tudo"
      : motivo === "acordo"
        ? "ate-80"
        : "nao";
  const saldoAtual = entrada.saldoAtualDoFgts;
  const saqueEstimado =
    saldoAtual === undefined
      ? saque === "so-multa"
        ? multa
        : null
      : saque === "tudo"
        ? saldoAtual + depositosDaRescisao + multa
        : saque === "so-multa"
          ? multa
          : null;

  return {
    ok: true,
    motivo,
    aviso,
    datas: {
      admissao,
      saida,
      anosDeServico: anos,
      // No pedido de demissão, a conta usa 30 dias (ver docs/calculadoras/rescisao.md)
      diasDeAviso: empresaEncerrou ? diasDoAvisoProporcional : motivo === "pedido" ? R.aviso.base : 0,
      fimProjetado,
      prazoDePagamento: somarDias(saida, R.prazoDePagamentoEmDias),
    },
    remuneracao,
    verbas,
    bruto,
    descontos,
    totalDeDescontos,
    liquido: Math.max(0, bruto - totalDeDescontos),
    descontoQueSobrou: Math.max(0, totalDeDescontos - bruto),
    fgts: {
      depositosDaRescisao,
      base,
      origemDaBase,
      percentualDaMultaPorMil,
      multa,
      saque,
      saqueEstimado,
    },
    podeTerSeguroDesemprego: motivo === "sem-justa-causa",
    usouMediaVariaveis: media > 0,
  };
}

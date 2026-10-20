// Motor do 13º salário de quem tem carteira assinada e recebe por mês. Valores em
// centavos inteiros, cada etapa arredondada ao centavo (meio centavo para cima).
// Regras e fontes: DECIMO_TERCEIRO_2026 em ./parametros.ts e docs/calculadoras/13-salario.md.
import {
  calcularInss,
  calcularIrrf,
  type DetalheDoInss,
  type DetalheDoIrrf,
  dividirArredondando,
} from "../tributos/calculo.ts";
import { compararDatas, type Data, diasDoMes, lerData, numeroDoDia } from "./datas.ts";
import { DECIMO_TERCEIRO_2026 as P } from "./parametros.ts";

export type EntradaDo13 = {
  // Salário mensal fixo, em centavos
  salario: number;
  // Meses do ano com 15 dias ou mais de trabalho (1 a 12). Ignorado quando há datas.
  meses?: number;
  // Modo detalhado: datas (AAAA-MM-DD). Sem admissão, conta desde 1º de janeiro;
  // sem saída, até 31 de dezembro.
  admissao?: string;
  saida?: string;
  // Média mensal de horas extras, comissões e adicionais habituais
  mediaVariaveis?: number;
  // Ou os variáveis mês a mês (janeiro a dezembro; null = não informado, vale zero)
  variaveisMensais?: (number | null)[];
  // Reajuste no ano: novo salário e mês em que passou a valer (1 a 12)
  reajuste?: { salario: number; mes: number };
  // Mês do pagamento da 1ª parcela (2 a 11; padrão: novembro)
  mesDoAdiantamento?: number;
  // 1ª parcela já recebida (por exemplo, nas férias); substitui a projeção
  adiantamentoRecebido?: number;
  dependentes?: number;
  // Pensão alimentícia judicial descontada do 13º (deduz do IR)
  pensao?: number;
  // Meses que deixam de contar: faltas sem justificativa que deixaram o mês com menos
  // de 15 dias, e meses de afastamento pelo INSS por doença (o INSS paga essa parte)
  mesesComFaltas?: number;
  mesesAfastadoPeloInss?: number;
  // Motivo do afastamento: muda só o aviso (no acidente de trabalho a Súmula 46 do TST
  // pode garantir a diferença entre o abono do INSS e o 13º desses meses)
  motivoDoAfastamento?: "doenca" | "acidente";
};

export type ResultadoDo13 = {
  ok: true;
  ano: number;
  avos: number;
  avosDoPeriodo: number; // antes de tirar faltas e afastamentos
  mesesDescontados: { faltas: number; inss: number };
  // 13º bruto que os meses de afastamento valeriam, para comparar com o abono do INSS
  afastamento: { motivo: "doenca" | "acidente"; valorDosMeses: number } | null;
  salarioDeDezembro: number;
  mediaVariavel: number;
  origemDaMedia: "informada" | "mensal" | "nenhuma";
  remuneracao: number;
  bruto: number;
  primeira: {
    valor: number;
    origem: "projetado" | "informado";
    // "metade-do-salario" (ano todo, art. 78) ou "proporcional" (§ 4º)
    regra: "metade-do-salario" | "proporcional";
    base: number;
    avos: number;
    mes: number;
  };
  inss: DetalheDoInss;
  irrf: DetalheDoIrrf;
  pensao: number;
  // 2ª parcela (ou o 13º pago na rescisão, quando há saída no ano)
  segunda: number;
  // Descontos e adiantamento maiores que o 13º: o que não coube na 2ª parcela
  faltouDescontar: number;
  totalLiquido: number;
  // Ajuste de janeiro dos variáveis (positivo: a receber), quando dezembro foi informado
  ajusteDeJaneiro: number | null;
  temVariavelSemAjuste: boolean;
  saiuNoAno: boolean;
};

export type ErroDo13 = { ok: false; erros: { campo: string; mensagem: string }[] };

const INICIO_DO_ANO: Data = { ano: P.ano, mes: 1, dia: 1 };
const FIM_DO_ANO: Data = { ano: P.ano, mes: 12, dia: 31 };

// Dias de trabalho em cada mês do ano, entre o início e o fim
function diasPorMes(inicio: Data, fim: Data) {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const primeiro = numeroDoDia({ ano: P.ano, mes, dia: 1 });
    const ultimo = numeroDoDia({ ano: P.ano, mes, dia: diasDoMes(P.ano, mes) });
    const de = Math.max(primeiro, numeroDoDia(inicio));
    const ate = Math.min(ultimo, numeroDoDia(fim));
    return Math.max(0, ate - de + 1);
  });
}

export function calcular13(entrada: EntradaDo13): ResultadoDo13 | ErroDo13 {
  const erros: ErroDo13["erros"] = [];
  if (!(entrada.salario > 0)) erros.push({ campo: "salario", mensagem: "Digite um salário maior que zero." });

  // Período trabalhado no ano: pelas datas, ou pelos meses informados (contados até
  // dezembro, como quem foi contratado no começo do mês)
  let dias: number[] | null = null;
  const usaDatas = Boolean(entrada.admissao || entrada.saida);
  if (usaDatas) {
    const admissao = entrada.admissao ? lerData(entrada.admissao) : INICIO_DO_ANO;
    const saida = entrada.saida ? lerData(entrada.saida) : FIM_DO_ANO;
    if (!admissao) erros.push({ campo: "admissao", mensagem: "Informe uma data de admissão válida." });
    if (!saida) erros.push({ campo: "saida", mensagem: "Informe uma data de saída válida." });
    if (admissao && saida) {
      if (compararDatas(admissao, FIM_DO_ANO) > 0) {
        erros.push({ campo: "admissao", mensagem: `A admissão precisa ser até 31/12/${P.ano}.` });
      } else if (compararDatas(saida, INICIO_DO_ANO) < 0) {
        erros.push({ campo: "saida", mensagem: `A saída precisa ser em ${P.ano}.` });
      } else if (compararDatas(saida, admissao) < 0) {
        erros.push({ campo: "saida", mensagem: "A saída não pode ser antes da admissão." });
      } else {
        const inicio = compararDatas(admissao, INICIO_DO_ANO) > 0 ? admissao : INICIO_DO_ANO;
        const fim = compararDatas(saida, FIM_DO_ANO) < 0 ? saida : FIM_DO_ANO;
        dias = diasPorMes(inicio, fim);
      }
    }
  } else {
    const meses = Math.floor(entrada.meses ?? 12);
    if (!(meses >= 1 && meses <= 12)) erros.push({ campo: "meses", mensagem: "Escolha de 1 a 12 meses." });
    else dias = Array.from({ length: 12 }, (_, i) => (i + 1 > 12 - meses ? 30 : 0));
  }

  const faltas = Math.max(0, Math.floor(entrada.mesesComFaltas ?? 0));
  const afastado = Math.max(0, Math.floor(entrada.mesesAfastadoPeloInss ?? 0));
  const mesDoAdiantamento = Math.floor(entrada.mesDoAdiantamento ?? 11);
  if (!(mesDoAdiantamento >= 2 && mesDoAdiantamento <= 11)) {
    erros.push({ campo: "mesDoAdiantamento", mensagem: "A 1ª parcela é paga de fevereiro a novembro." });
  }
  if (entrada.reajuste && !(entrada.reajuste.salario > 0 && entrada.reajuste.mes >= 1 && entrada.reajuste.mes <= 12)) {
    erros.push({ campo: "reajuste", mensagem: "Informe o novo salário e o mês do reajuste." });
  }
  const avosDoPeriodo = dias ? dias.filter((d) => d >= 15).length : 0;
  if (dias && avosDoPeriodo === 0) {
    erros.push({ campo: "admissao", mensagem: "Nenhum mês do ano tem 15 dias de trabalho: não há 13º." });
  }
  if (dias && avosDoPeriodo > 0 && faltas + afastado >= avosDoPeriodo) {
    erros.push({ campo: "mesesComFaltas", mensagem: "Os meses descontados não podem ser todos os meses trabalhados." });
  }
  if (erros.length || !dias) return { ok: false, erros };

  const avos = avosDoPeriodo - faltas - afastado;
  const saiuNoAno = Boolean(entrada.saida) && compararDatas(lerData(entrada.saida!)!, FIM_DO_ANO) < 0;

  // Salário de cada mês (com o reajuste a partir do mês em que passou a valer)
  const salarioNoMes = (mes: number) =>
    entrada.reajuste && mes >= entrada.reajuste.mes ? entrada.reajuste.salario : entrada.salario;
  // O 13º usa a remuneração de dezembro (art. 76); quem sai no ano, a do mês da saída (art. 82)
  const mesDaBase = saiuNoAno ? lerData(entrada.saida!)!.mes : 12;
  const salarioDeDezembro = salarioNoMes(mesDaBase);

  // Variáveis: média informada ou mês a mês (1/11 da soma até novembro, art. 77)
  let mediaVariavel = 0;
  let origemDaMedia: ResultadoDo13["origemDaMedia"] = "nenhuma";
  let ajusteDeJaneiro: number | null = null;
  const trabalhados = dias.map((d) => d >= 15);
  const mensais = entrada.variaveisMensais;
  if (mensais && mensais.some((v) => v !== null && v > 0)) {
    origemDaMedia = "mensal";
    const ate = saiuNoAno ? mesDaBase : 11;
    const meses = trabalhados.slice(0, ate).map((t, i) => (t ? (mensais[i] ?? 0) : null)).filter((v) => v !== null) as number[];
    const soma = meses.reduce((a, b) => a + b, 0);
    mediaVariavel = meses.length ? dividirArredondando(soma, meses.length) : 0;
    if (!saiuNoAno && trabalhados[11] && mensais[11] !== null && mensais[11] !== undefined) {
      const todos = trabalhados.map((t, i) => (t ? (mensais[i] ?? 0) : null)).filter((v) => v !== null) as number[];
      const mediaDoAno = dividirArredondando(todos.reduce((a, b) => a + b, 0), todos.length);
      ajusteDeJaneiro =
        dividirArredondando((salarioDeDezembro + mediaDoAno) * avos, 12) -
        dividirArredondando((salarioDeDezembro + mediaVariavel) * avos, 12);
    }
  } else if ((entrada.mediaVariaveis ?? 0) > 0) {
    origemDaMedia = "informada";
    mediaVariavel = entrada.mediaVariaveis!;
  }

  const remuneracao = salarioDeDezembro + mediaVariavel;
  const bruto = dividirArredondando(remuneracao * avos, 12);

  // 1ª parcela: metade do salário do mês anterior ao pagamento, para quem esteve à
  // disposição o ano todo (art. 78); senão, metade de 1/12 por mês de serviço ou
  // fração superior a 15 dias até o pagamento (§ 4º). A conta supõe o pagamento no
  // fim do mês escolhido.
  const anoTodo = avosDoPeriodo === 12 && faltas === 0 && afastado === 0;
  const baseDaPrimeira = salarioNoMes(Math.max(1, mesDoAdiantamento - 1)) + mediaVariavel;
  const avosAtePagamento = Math.max(
    0,
    Math.min(dias.slice(0, mesDoAdiantamento).filter((d) => d > 15).length, avos),
  );
  const primeiraProjetada = anoTodo
    ? dividirArredondando(baseDaPrimeira, 2)
    : dividirArredondando(baseDaPrimeira * avosAtePagamento, 24);
  const recebido = entrada.adiantamentoRecebido;
  const primeira = {
    valor: recebido !== undefined ? recebido : saiuNoAno && mesDaBase <= mesDoAdiantamento ? 0 : primeiraProjetada,
    origem: (recebido !== undefined ? "informado" : "projetado") as "informado" | "projetado",
    regra: (anoTodo ? "metade-do-salario" : "proporcional") as "metade-do-salario" | "proporcional",
    base: baseDaPrimeira,
    avos: anoTodo ? 12 : avosAtePagamento,
    mes: mesDoAdiantamento,
  };

  // INSS sobre o 13º, separado do salário; IR exclusivo na fonte, com as mesmas
  // deduções do mês, o desconto simplificado e a redução da Lei 15.270 (art. 3º-A, § 3º)
  const inss = calcularInss(bruto);
  const pensao = Math.max(0, entrada.pensao ?? 0);
  const irrf = calcularIrrf({
    rendimentos: bruto,
    previdencia: inss.total,
    dependentes: entrada.dependentes,
    pensaoAlimenticia: pensao,
  });
  const restante = bruto - primeira.valor - inss.total - irrf.imposto - pensao;

  return {
    ok: true,
    ano: P.ano,
    avos,
    avosDoPeriodo,
    mesesDescontados: { faltas, inss: afastado },
    afastamento: afastado
      ? {
          motivo: entrada.motivoDoAfastamento ?? "doenca",
          valorDosMeses: dividirArredondando(remuneracao * afastado, 12),
        }
      : null,
    salarioDeDezembro,
    mediaVariavel,
    origemDaMedia,
    remuneracao,
    bruto,
    primeira,
    inss,
    irrf,
    pensao,
    segunda: Math.max(0, restante),
    faltouDescontar: Math.max(0, -restante),
    totalLiquido: primeira.valor + Math.max(0, restante),
    ajusteDeJaneiro,
    temVariavelSemAjuste: origemDaMedia !== "nenhuma" && ajusteDeJaneiro === null && !saiuNoAno,
    saiuNoAno,
  };
}

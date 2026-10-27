// Motor da calculadora de multa por quebra de contrato de aluguel. Valores em centavos e
// datas em texto AAAA-MM-DD; nada aqui depende da tela. Textos e links das regras em
// docs/calculadoras/multa-rescisao-aluguel.md.
//
// Regras (Lei 8.245/1991, texto da Câmara conferido em 27/10/2026):
// - Art. 4º: durante o prazo, o locador não pode reaver o imóvel; o locatário pode
//   devolvê-lo "pagando a multa pactuada, proporcional ao período de cumprimento do
//   contrato, ou, na sua falta, a que for judicialmente estipulada". Parágrafo único:
//   dispensa da multa na transferência pelo empregador, privado ou público, para outra
//   localidade, com notificação escrita de no mínimo 30 dias.
// - Art. 54-A, § 2º: na locação não residencial sob medida (built to suit), vale a multa
//   convencionada, limitada à soma dos aluguéis a receber até o fim do contrato.
// - Art. 6º: no prazo indeterminado, o locatário sai com aviso escrito de 30 dias; sem o
//   aviso, o locador pode exigir um mês de aluguel e encargos.
// - Arts. 46, 47, 56 e 57: fim do prazo, prorrogação por prazo indeterminado e retomada.
// - Art. 9º: desfazimento por acordo, infração, falta de pagamento ou reparos urgentes.
// - Código Civil, art. 413: o juiz reduz a multa manifestamente excessiva ou se a obrigação
//   foi cumprida em parte.
//
// Proporção: multa integral × tempo que falta ÷ prazo total. O tempo é contado em meses e
// fração de mês: meses completos, mais os dias que sobram divididos pelos dias daquele mês
// do contrato. Assim, datas no mesmo dia do mês dão meses exatos (20 de 30 → 1/3).
import { compararDatas, type Data, deNumero, formatarData, lerData, numeroDoDia, somarMeses } from "../trabalhista/datas.ts";
import { dividirArredondando } from "../tributos/calculo.ts";
import { reais } from "../dinheiro.ts";

export const REGRAS_DA_MULTA = {
  revisadoEm: "2026-10-27",
  avisoDias: 30,
  prazoDoArtigo46Meses: 30,
  maximoDeMeses: 600,
  maximoDeAlugueisNaMulta: 24,
} as const;

export type Perfil = "inquilino" | "proprietario" | "corretor";
export type Situacao =
  | "sair-antes"
  | "contrato-terminou"
  | "proprietario-pediu"
  | "transferencia"
  | "clausula"
  | "descumprimento"
  | "outro";
export type TipoDeLocacao = "residencial" | "nao-residencial" | "sob-medida";
export type FormaDaMulta = "alugueis" | "fixa" | "sem-multa" | "outra";
export type SimNao = "sim" | "nao" | "nao-sei" | "";

export type EncargosInformados = {
  alugueisPendentes: number;
  condominio: number;
  iptu: number;
  contas: number;
  outros: number;
  jaPagos: number;
};

export type EntradaDaMulta = {
  perfil: Perfil;
  situacao: Situacao;
  tipo: TipoDeLocacao;
  aluguel: number;
  inicio: string;
  // Término previsto; se vazio, usa o prazo em meses
  termino: string;
  prazoMeses: number;
  devolucao: string;
  forma: FormaDaMulta;
  // Multa em aluguéis, em décimos (30 = 3 aluguéis); ou valor fixo em centavos
  alugueisDeMultaDecimos: number;
  multaFixa: number;
  // A cláusula já diz como reduzir? Se diz "multa integral, sem desconto", avisamos
  clausulaSemProporcao: boolean;
  // Perguntas da etapa 4
  transferenciaPeloEmpregador: SimNao;
  outraLocalidade: SimNao;
  avisoEscrito30Dias: SimNao;
  acordo: SimNao;
  valorDoAcordo: number;
  // Encargos mensais (condomínio etc.) para a regra do art. 6º, em centavos
  encargosMensais: number;
  encargos: EncargosInformados | null;
  hoje: string;
};

export type CampoDaMulta =
  | "aluguel"
  | "inicio"
  | "termino"
  | "prazoMeses"
  | "devolucao"
  | "alugueisDeMulta"
  | "multaFixa"
  | "valorDoAcordo"
  | "encargos";

export type ErroDaMulta = { campo: CampoDaMulta; mensagem: string };

export type Periodo = { meses: number; dias: number; diasDoMes: number; fracao: number };

export type Desfecho =
  | "multa-proporcional"
  | "multa-sob-medida"
  | "sem-multa-transferencia"
  | "sem-multa-prazo-terminou"
  | "aviso-de-30-dias"
  | "acordo"
  | "sem-valor-no-contrato"
  | "clausula-a-analisar"
  | "retomada-pelo-proprietario"
  | "descumprimento";

export type Aviso =
  | "transferencia-incompleta"
  | "clausula-sem-proporcao"
  | "multa-alta"
  | "contrato-prorrogado"
  | "sem-aviso-um-aluguel"
  | "artigo-46"
  | "artigo-47"
  | "locacao-nao-residencial"
  | "caucao"
  | "acordo-maior-que-a-multa";

export type ResultadoDaMulta =
  | { ok: false; erros: ErroDaMulta[] }
  | {
      ok: true;
      desfecho: Desfecho;
      inicio: Data;
      termino: Data;
      devolucao: Data;
      prazoTotal: Periodo;
      cumprido: Periodo;
      restante: Periodo;
      // null quando a lei ou o contrato não dão um número
      multaIntegral: number | null;
      multaEstimada: number | null;
      // Fim do prazo com aviso faltando: até um mês de aluguel e encargos (art. 6º)
      valorSemAviso: number | null;
      encargos: { itens: { nome: string; valor: number }[]; soma: number; jaPagos: number; total: number } | null;
      avisos: Aviso[];
      memoria: string[];
    };

// Meses completos e fração de mês entre duas datas (a ≤ b)
export function periodoEntre(a: Data, b: Data): Periodo {
  if (compararDatas(b, a) <= 0) return { meses: 0, dias: 0, diasDoMes: 30, fracao: 0 };
  let meses = Math.max(0, (b.ano - a.ano) * 12 + (b.mes - a.mes) - 1);
  while (compararDatas(somarMeses(a, meses + 1), b) <= 0) meses += 1;
  const base = somarMeses(a, meses);
  const proximo = somarMeses(a, meses + 1);
  const dias = numeroDoDia(b) - numeroDoDia(base);
  const diasDoMes = numeroDoDia(proximo) - numeroDoDia(base);
  return { meses, dias, diasDoMes, fracao: meses + dias / diasDoMes };
}

export const periodoEmTexto = (p: Periodo) =>
  `${p.meses} ${p.meses === 1 ? "mês" : "meses"}${p.dias ? ` e ${p.dias} ${p.dias === 1 ? "dia" : "dias"}` : ""}`;

const fracaoEmTexto = (x: number) => x.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function validar(e: EntradaDaMulta) {
  const erros: ErroDaMulta[] = [];
  const hoje = lerData(e.hoje)!;
  const ler = (texto: string, campo: CampoDaMulta, obrigatorio: boolean) => {
    if (!texto) {
      if (obrigatorio) erros.push({ campo, mensagem: "Informe a data." });
      return null;
    }
    const d = lerData(texto);
    if (!d || d.ano < 1990 || d.ano > hoje.ano + 60) {
      erros.push({ campo, mensagem: "Data inválida." });
      return null;
    }
    return d;
  };
  const inicio = ler(e.inicio, "inicio", true);
  let termino = ler(e.termino, "termino", false);
  const devolucao = ler(e.devolucao, "devolucao", true);
  if (!e.termino) {
    if (!Number.isInteger(e.prazoMeses) || e.prazoMeses < 1 || e.prazoMeses > REGRAS_DA_MULTA.maximoDeMeses)
      erros.push({ campo: "prazoMeses", mensagem: "Informe a data de término ou o prazo em meses." });
    else if (inicio) termino = somarMeses(inicio, e.prazoMeses);
  }
  if (inicio && termino && compararDatas(termino, inicio) <= 0)
    erros.push({ campo: "termino", mensagem: "O término tem de ser depois do início." });
  if (inicio && devolucao && compararDatas(devolucao, inicio) < 0)
    erros.push({ campo: "devolucao", mensagem: "A devolução não pode ser antes do início do contrato." });
  if (!Number.isInteger(e.aluguel) || e.aluguel <= 0) erros.push({ campo: "aluguel", mensagem: "Informe o valor do aluguel." });
  if (e.forma === "alugueis") {
    const d = e.alugueisDeMultaDecimos;
    if (!Number.isInteger(d) || d < 0 || d > REGRAS_DA_MULTA.maximoDeAlugueisNaMulta * 10)
      erros.push({ campo: "alugueisDeMulta", mensagem: `Use de 0 a ${REGRAS_DA_MULTA.maximoDeAlugueisNaMulta} aluguéis.` });
  }
  if (e.forma === "fixa" && (!Number.isInteger(e.multaFixa) || e.multaFixa < 0))
    erros.push({ campo: "multaFixa", mensagem: "Informe o valor da multa." });
  if (e.acordo === "sim" && (!Number.isInteger(e.valorDoAcordo) || e.valorDoAcordo < 0))
    erros.push({ campo: "valorDoAcordo", mensagem: "Valor inválido." });
  if (e.encargos && Object.values(e.encargos).some((v) => !Number.isInteger(v) || v < 0))
    erros.push({ campo: "encargos", mensagem: "Confira os valores dos encargos." });
  return { erros, inicio, termino, devolucao };
}

export function calcularMultaDoAluguel(e: EntradaDaMulta): ResultadoDaMulta {
  const { erros, inicio, termino, devolucao } = validar(e);
  if (erros.length || !inicio || !termino || !devolucao) return { ok: false, erros };

  const prazoTotal = periodoEntre(inicio, termino);
  const cumprido = periodoEntre(inicio, compararDatas(devolucao, termino) < 0 ? devolucao : termino);
  const restante = periodoEntre(devolucao, termino);
  const memoria: string[] = [];
  const avisos: Aviso[] = [];

  memoria.push(
    `Contrato de ${formatarData(inicio)} a ${formatarData(termino)}: prazo de ${periodoEmTexto(prazoTotal)}.`,
    `Devolução em ${formatarData(devolucao)}: ${periodoEmTexto(cumprido)} cumpridos; ${restante.fracao > 0 ? `faltam ${periodoEmTexto(restante)}` : "o prazo já terminou"}.`,
  );

  const multaIntegral =
    e.forma === "alugueis"
      ? dividirArredondando(e.aluguel * e.alugueisDeMultaDecimos, 10)
      : e.forma === "fixa"
        ? e.multaFixa
        : null;
  if (multaIntegral !== null)
    memoria.push(
      e.forma === "alugueis"
        ? `Multa integral do contrato: ${fracaoEmTexto(e.alugueisDeMultaDecimos / 10)} × ${reais(e.aluguel)} = ${reais(multaIntegral)}.`
        : `Multa integral do contrato (valor fixo): ${reais(multaIntegral)}.`,
    );
  if (multaIntegral !== null && e.forma === "alugueis" && e.alugueisDeMultaDecimos > 30) avisos.push("multa-alta");
  if (e.tipo !== "residencial") avisos.push("locacao-nao-residencial");

  const proporcional = () => {
    if (multaIntegral === null) return null;
    // Uma divisão só, com as frações exatas; arredonda o resultado final ao centavo
    const valor = Math.round((multaIntegral * restante.fracao) / prazoTotal.fracao);
    memoria.push(
      `Multa proporcional: ${reais(multaIntegral)} × ${fracaoEmTexto(restante.fracao)} ÷ ${fracaoEmTexto(prazoTotal.fracao)} meses = ${reais(valor)}.`,
    );
    if (restante.dias || prazoTotal.dias)
      memoria.push("Meses incompletos entram como fração: os dias que sobram divididos pelos dias daquele mês do contrato.");
    return valor;
  };

  let desfecho: Desfecho;
  let multaEstimada: number | null = null;
  let valorSemAviso: number | null = null;
  const terminou = compararDatas(devolucao, termino) >= 0;

  if (e.situacao === "proprietario-pediu") {
    desfecho = "retomada-pelo-proprietario";
    memoria.push(
      terminou
        ? "O pedido de desocupação veio depois do fim do prazo: valem as regras de retomada do contrato por prazo indeterminado, não a multa do inquilino."
        : "Durante o prazo do contrato, o proprietário não pode reaver o imóvel (art. 4º), salvo nos casos do art. 9º. A multa do art. 4º é do inquilino que decide sair, não se aplica a quem foi pedido para sair.",
    );
    if (terminou) avisos.push(prazoTotal.fracao >= REGRAS_DA_MULTA.prazoDoArtigo46Meses ? "artigo-46" : "artigo-47");
  } else if (e.situacao === "descumprimento") {
    desfecho = "descumprimento";
    multaEstimada = terminou ? 0 : proporcional();
    memoria.push(
      "Quando a locação termina por falta de pagamento ou infração, a multa e os demais valores dependem do contrato e da decisão judicial; a proporção acima é só uma referência.",
    );
  } else if (terminou) {
    desfecho = "sem-multa-prazo-terminou";
    multaEstimada = 0;
    memoria.push("Na data da devolução, o prazo do contrato já terminou: não há multa por devolução antecipada (art. 4º).");
    if (compararDatas(devolucao, termino) > 0) {
      // Ficou depois do prazo: em regra, prorrogação por prazo indeterminado (arts. 46, 47 e 56)
      avisos.push("contrato-prorrogado");
      desfecho = "aviso-de-30-dias";
      if (e.avisoEscrito30Dias === "nao") {
        avisos.push("sem-aviso-um-aluguel");
        valorSemAviso = e.aluguel + e.encargosMensais;
        memoria.push(
          `Sem o aviso escrito de 30 dias, o proprietário pode exigir um mês de aluguel e encargos (art. 6º, parágrafo único): ${reais(e.aluguel)}${e.encargosMensais ? ` + ${reais(e.encargosMensais)}` : ""} = ${reais(valorSemAviso)}.`,
        );
      }
    }
  } else if (e.situacao === "transferencia" && e.transferenciaPeloEmpregador === "sim" && e.outraLocalidade === "sim" && e.avisoEscrito30Dias === "sim") {
    desfecho = "sem-multa-transferencia";
    multaEstimada = 0;
    memoria.push(
      "Transferência pelo empregador para outra localidade, com aviso escrito de 30 dias: o inquilino fica dispensado da multa (art. 4º, parágrafo único).",
    );
  } else if (e.acordo === "sim") {
    desfecho = "acordo";
    multaEstimada = e.valorDoAcordo;
    const referencia = proporcional();
    memoria.push(`Valor combinado entre as partes: ${reais(e.valorDoAcordo)}. A locação pode ser desfeita por acordo (art. 9º, I).`);
    if (referencia !== null && e.valorDoAcordo > referencia) avisos.push("acordo-maior-que-a-multa");
  } else if (e.tipo === "sob-medida") {
    desfecho = "multa-sob-medida";
    if (multaIntegral !== null) {
      const teto = Math.round(e.aluguel * restante.fracao);
      multaEstimada = Math.min(multaIntegral, teto);
      memoria.push(
        `Locação sob medida (art. 54-A): vale a multa do contrato, limitada aos aluguéis que faltam (${reais(e.aluguel)} × ${fracaoEmTexto(restante.fracao)} = ${reais(teto)}): ${reais(multaEstimada)}.`,
      );
    }
  } else if (e.forma === "sem-multa") {
    desfecho = "sem-valor-no-contrato";
    memoria.push("O contrato não prevê multa: na falta dela, a multa é a que o juiz fixar (art. 4º). Não há um número a calcular.");
  } else if (e.forma === "outra") {
    desfecho = "clausula-a-analisar";
    memoria.push("A cláusula do contrato usa outra forma de multa: a calculadora não a converte sozinha. Leia a cláusula e, na dúvida, peça orientação.");
  } else {
    desfecho = "multa-proporcional";
    multaEstimada = proporcional();
    if (e.situacao === "transferencia") avisos.push("transferencia-incompleta");
  }
  if (e.clausulaSemProporcao && multaIntegral !== null && desfecho === "multa-proporcional") avisos.push("clausula-sem-proporcao");
  if (e.situacao !== "proprietario-pediu" && !terminou && e.tipo === "residencial" && desfecho === "multa-proporcional")
    memoria.push("Com o aviso por escrito, o inquilino comunica a saída; a lei não exige aviso de 30 dias durante o prazo, mas o contrato pode exigir.");

  let encargos = null;
  if (e.encargos) {
    const itens = [
      { nome: "Aluguéis pendentes", valor: e.encargos.alugueisPendentes },
      { nome: "Condomínio pendente", valor: e.encargos.condominio },
      { nome: "IPTU a cargo do inquilino pelo contrato", valor: e.encargos.iptu },
      { nome: "Contas de consumo (luz, água, gás)", valor: e.encargos.contas },
      { nome: "Outros encargos comprovados", valor: e.encargos.outros },
    ].filter((i) => i.valor > 0);
    const soma = itens.reduce((s, i) => s + i.valor, 0);
    const total = (multaEstimada ?? 0) + (valorSemAviso ?? 0) + soma - e.encargos.jaPagos;
    encargos = { itens, soma, jaPagos: e.encargos.jaPagos, total };
    memoria.push(
      `Outros valores informados: ${reais(soma)}${e.encargos.jaPagos ? `; já pagos: ${reais(e.encargos.jaPagos)}` : ""}. Total estimado: ${reais(Math.max(0, total))}${total < 0 ? ` (os pagamentos superam os valores em ${reais(-total)})` : ""}.`,
    );
  }
  avisos.push("caucao");

  return {
    ok: true,
    desfecho,
    inicio,
    termino,
    devolucao,
    prazoTotal,
    cumprido,
    restante,
    multaIntegral,
    multaEstimada: multaEstimada === null ? null : Math.max(0, multaEstimada),
    valorSemAviso,
    encargos,
    avisos,
    memoria,
  };
}

// Data limite do aviso de 30 dias antes de uma devolução
export const avisoAte = (devolucao: Data) => deNumero(numeroDoDia(devolucao) - REGRAS_DA_MULTA.avisoDias);

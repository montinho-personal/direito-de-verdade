// Motor da calculadora de cobrança indevida. Valores em centavos inteiros e datas em
// texto AAAA-MM-DD; nada aqui depende da tela. Regras e fontes em ./regras.ts.
//
// Para cada pagamento: pago a mais = pago − valor correto (nunca negativo). A restituição
// simples devolve o que foi pago a mais; a restituição em dobro, o dobro (CDC, art. 42,
// parágrafo único). As duas são cenários alternativos, nunca somados. O que a empresa já
// devolveu é abatido de cada cenário. A correção pelo IPCA vem à parte, e os juros não
// entram na conta (ver regras.ts).
import { dividirArredondando } from "../tributos/calculo.ts";
import { reais } from "../dinheiro.ts";
import { compararDatas, type Data, formatarData, lerData, somarMeses } from "../trabalhista/datas.ts";
import { IPCA_NUMERO_INDICE_X100, PRIMEIRO_MES_DO_IPCA, ULTIMO_MES_DO_IPCA } from "./ipca.ts";
import { ehServicoPublico, REGRAS_DA_COBRANCA as R, type TipoDeProblema } from "./regras.ts";

export type SituacaoDoPagamento = "integral" | "parcial" | "nao" | "incerto";

export type Mes = { ano: number; mes: number };

// Uma linha do formulário: uma cobrança, ou a mesma cobrança repetida todo mês
export type LinhaDeCobranca = {
  data: string;
  cobrado: number;
  // Quanto deveria ter sido cobrado (0 quando nada era devido)
  devido: number;
  // Quanto foi pago; ignorado quando o pagamento é "integral" (vale o cobrado) ou "nao"
  pago: number;
  // Quantas vezes, uma por mês a partir da data (1 = só esta)
  repeticoes: number;
};

export type EntradaDaCobranca = {
  tipo: TipoDeProblema;
  pagamento: SituacaoDoPagamento;
  linhas: LinhaDeCobranca[];
  // O que a empresa já devolveu, em centavos, e quando
  devolvido: number;
  dataDaDevolucao: string;
  hoje: string;
};

export type CampoComErro = "linhas" | "data" | "cobrado" | "devido" | "pago" | "repeticoes" | "devolvido" | "dataDaDevolucao";

export type ErroDaCobranca = { linha: number | null; campo: CampoComErro; mensagem: string };

export type Parcela = {
  linha: number;
  data: Data;
  cobrado: number;
  devido: number;
  pago: number;
  excesso: number;
  // Fator do IPCA do mês seguinte ao pagamento até o último divulgado (1 quando não há)
  fator: number;
  // Pagamento no último mês com IPCA divulgado ou depois: ainda não há correção
  semIpca: boolean;
  corrigidoSimples: number;
  corrigidoDobro: number;
};

export type Cenario = { principal: number; correcao: number; total: number };

export type Aviso =
  | "tema-929"
  | "modulacao"
  | "modulacao-telefonia-fixa"
  | "indice-antes-da-lei-14905"
  | "mais-de-5-anos"
  | "mais-de-10-anos"
  | "devolvido-maior-que-excesso"
  | "pagamento-incerto"
  | "sem-ipca-ainda";

export type ResultadoDaCobranca =
  | { ok: false; erros: ErroDaCobranca[] }
  | {
      ok: true;
      situacao: "sem-pagamento" | "sem-excesso" | "com-excesso";
      cobrado: number;
      devido: number;
      pago: number;
      // Cobrado acima do correto: o que dá para contestar, pago ou não
      contestavel: number;
      excesso: number;
      devolvido: number;
      parcelas: Parcela[];
      simples: Cenario;
      dobro: Cenario;
      ultimoIpca: Mes;
      avisos: Aviso[];
      memoria: string[];
    };

const MAXIMO_DE_PARCELAS = 240;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const nomeDoMes = (m: Mes) => `${MESES[m.mes - 1]}/${m.ano}`;

const ordemDoMes = (m: Mes) => m.ano * 12 + m.mes - 1;

function indiceDoMes(m: Mes) {
  return IPCA_NUMERO_INDICE_X100[ordemDoMes(m) - ordemDoMes(PRIMEIRO_MES_DO_IPCA)];
}

const INDICE_FINAL = indiceDoMes(ULTIMO_MES_DO_IPCA);

// Valor corrigido pelo IPCA: inflação do mês seguinte ao da data até o último mês
// divulgado (índice final ÷ índice do mês da data). Sem IPCA divulgado depois da data,
// ou com inflação acumulada negativa, o valor fica como está: nunca abaixo do nominal.
export function corrigirPeloIpca(centavos: number, data: Data) {
  const mes = { ano: data.ano, mes: data.mes };
  if (ordemDoMes(mes) >= ordemDoMes(ULTIMO_MES_DO_IPCA)) return centavos;
  const inicial = indiceDoMes(mes);
  if (INDICE_FINAL <= inicial) return centavos;
  return dividirArredondando(centavos * INDICE_FINAL, inicial);
}

export function fatorDoIpca(data: Data) {
  const mes = { ano: data.ano, mes: data.mes };
  if (ordemDoMes(mes) >= ordemDoMes(ULTIMO_MES_DO_IPCA)) return 1;
  return Math.max(1, INDICE_FINAL / indiceDoMes(mes));
}

function validar(entrada: EntradaDaCobranca, hoje: Data) {
  const erros: ErroDaCobranca[] = [];
  const primeiro = lerData(R.primeiroPagamentoAceito)!;
  const lerDataDoPagamento = (texto: string, linha: number | null, campo: CampoComErro) => {
    const data = lerData(texto);
    if (!data) erros.push({ linha, campo, mensagem: texto ? "Data inválida." : "Informe a data." });
    else if (compararDatas(data, primeiro) < 0)
      erros.push({ linha, campo, mensagem: "Use uma data a partir de 01/01/2010: antes disso, passa de qualquer prazo." });
    else if (compararDatas(data, hoje) > 0) erros.push({ linha, campo, mensagem: "A data não pode ser depois de hoje." });
    else return data;
    return null;
  };

  if (entrada.linhas.length === 0) erros.push({ linha: null, campo: "linhas", mensagem: "Informe ao menos uma cobrança." });
  if (entrada.linhas.length > R.maximoDeLinhas)
    erros.push({ linha: null, campo: "linhas", mensagem: `Use no máximo ${R.maximoDeLinhas} linhas.` });

  const parcelas: { linha: number; data: Data; cobrado: number; devido: number; pago: number }[] = [];
  entrada.linhas.forEach((l, i) => {
    const data = lerDataDoPagamento(l.data, i, "data");
    if (!Number.isInteger(l.cobrado) || l.cobrado <= 0)
      erros.push({ linha: i, campo: "cobrado", mensagem: "Informe o valor cobrado." });
    if (!Number.isInteger(l.devido) || l.devido < 0)
      erros.push({ linha: i, campo: "devido", mensagem: "Valor inválido." });
    else if (l.devido > l.cobrado && l.cobrado > 0)
      erros.push({ linha: i, campo: "devido", mensagem: "O valor correto não pode ser maior que o cobrado." });
    const pago = entrada.pagamento === "integral" ? l.cobrado : entrada.pagamento === "nao" ? 0 : l.pago;
    if (entrada.pagamento !== "integral" && entrada.pagamento !== "nao") {
      if (!Number.isInteger(pago) || pago < 0) erros.push({ linha: i, campo: "pago", mensagem: "Valor inválido." });
      else if (pago > l.cobrado && l.cobrado > 0)
        erros.push({
          linha: i,
          campo: "pago",
          mensagem: "O valor pago não pode passar do cobrado. Pagou a mesma conta duas vezes? Informe as duas cobranças.",
        });
    }
    if (!Number.isInteger(l.repeticoes) || l.repeticoes < 1 || l.repeticoes > R.maximoDeRepeticoes)
      erros.push({ linha: i, campo: "repeticoes", mensagem: `Use de 1 a ${R.maximoDeRepeticoes} meses.` });
    else if (data) {
      const ultima = somarMeses(data, l.repeticoes - 1);
      if (compararDatas(ultima, hoje) > 0)
        erros.push({
          linha: i,
          campo: "repeticoes",
          mensagem: `A última repetição cairia em ${formatarData(ultima)}, depois de hoje.`,
        });
      else
        for (let k = 0; k < l.repeticoes; k++)
          parcelas.push({ linha: i, data: somarMeses(data, k), cobrado: l.cobrado, devido: l.devido, pago });
    }
  });
  if (parcelas.length > MAXIMO_DE_PARCELAS)
    erros.push({ linha: null, campo: "linhas", mensagem: `Use no máximo ${MAXIMO_DE_PARCELAS} cobranças no total.` });

  let dataDaDevolucao: Data | null = null;
  if (entrada.pagamento !== "nao" && entrada.devolvido !== 0) {
    if (!Number.isInteger(entrada.devolvido) || entrada.devolvido < 0)
      erros.push({ linha: null, campo: "devolvido", mensagem: "Valor inválido." });
    dataDaDevolucao = lerDataDoPagamento(entrada.dataDaDevolucao, null, "dataDaDevolucao");
    const primeiraParcela = parcelas.reduce<Data | null>(
      (menor, p) => (!menor || compararDatas(p.data, menor) < 0 ? p.data : menor),
      null,
    );
    if (dataDaDevolucao && primeiraParcela && compararDatas(dataDaDevolucao, primeiraParcela) < 0) {
      erros.push({ linha: null, campo: "dataDaDevolucao", mensagem: "A devolução não pode ser antes do primeiro pagamento." });
      dataDaDevolucao = null;
    }
  }
  return { erros, parcelas, dataDaDevolucao };
}

export function calcularCobrancaIndevida(entrada: EntradaDaCobranca): ResultadoDaCobranca {
  const hoje = lerData(entrada.hoje);
  if (!hoje) return { ok: false, erros: [{ linha: null, campo: "linhas", mensagem: "Data de hoje inválida." }] };
  const { erros, parcelas: brutas, dataDaDevolucao } = validar(entrada, hoje);
  if (erros.length > 0) return { ok: false, erros };

  const parcelas: Parcela[] = brutas
    .map((p) => {
      const excesso = Math.max(0, p.pago - p.devido);
      return {
        ...p,
        excesso,
        fator: excesso > 0 ? fatorDoIpca(p.data) : 1,
        semIpca: ordemDoMes(p.data) >= ordemDoMes(ULTIMO_MES_DO_IPCA),
        corrigidoSimples: corrigirPeloIpca(excesso, p.data),
        corrigidoDobro: corrigirPeloIpca(2 * excesso, p.data),
      };
    })
    .sort((a, b) => compararDatas(a.data, b.data) || a.linha - b.linha);

  const soma = (campo: "cobrado" | "devido" | "pago" | "excesso" | "corrigidoSimples" | "corrigidoDobro") =>
    parcelas.reduce((total, p) => total + p[campo], 0);
  const cobrado = soma("cobrado");
  const devido = soma("devido");
  const pago = soma("pago");
  const excesso = soma("excesso");
  const contestavel = parcelas.reduce((total, p) => total + p.cobrado - p.devido, 0);
  const devolvido = entrada.pagamento === "nao" ? 0 : entrada.devolvido;
  const devolvidoCorrigido = dataDaDevolucao ? corrigirPeloIpca(devolvido, dataDaDevolucao) : devolvido;

  // Principal = nominal menos o devolvido; correção = o que o IPCA acrescenta, nunca negativa
  const cenario = (bruto: number, corrigido: number): Cenario => {
    const principal = Math.max(0, bruto - devolvido);
    const total = Math.max(principal, corrigido - devolvidoCorrigido);
    return { principal, correcao: total - principal, total };
  };
  const simples = cenario(excesso, soma("corrigidoSimples"));
  const dobro = cenario(2 * excesso, soma("corrigidoDobro"));

  const situacao: Extract<ResultadoDaCobranca, { ok: true }>["situacao"] = entrada.pagamento === "nao" || pago === 0 ? "sem-pagamento" : excesso === 0 ? "sem-excesso" : "com-excesso";

  const avisos: Aviso[] = [];
  const comExcesso = parcelas.filter((p) => p.excesso > 0);
  if (situacao === "com-excesso") {
    avisos.push("tema-929");
    const publicacao = lerData(R.publicacaoDoEaresp676608)!;
    if (!ehServicoPublico(entrada.tipo) && comExcesso.some((p) => compararDatas(p.data, publicacao) <= 0)) {
      avisos.push("modulacao");
      if (entrada.tipo === "telecom") avisos.push("modulacao-telefonia-fixa");
    }
    const lei14905 = lerData(R.vigenciaDaLei14905)!;
    if (comExcesso.some((p) => compararDatas(p.data, lei14905) < 0)) avisos.push("indice-antes-da-lei-14905");
    const limite = (anos: number) => somarMeses(hoje, -12 * anos);
    if (comExcesso.some((p) => compararDatas(p.data, limite(R.prazoGeral)) < 0)) avisos.push("mais-de-10-anos");
    else if (comExcesso.some((p) => compararDatas(p.data, limite(R.prazoDeAtencao)) < 0)) avisos.push("mais-de-5-anos");
    if (devolvido > excesso) avisos.push("devolvido-maior-que-excesso");
    if (comExcesso.some((p) => p.semIpca)) avisos.push("sem-ipca-ainda");
  }
  if (entrada.pagamento === "incerto") avisos.push("pagamento-incerto");

  const resultado = {
    ok: true as const,
    situacao,
    cobrado,
    devido,
    pago,
    contestavel,
    excesso,
    devolvido,
    parcelas,
    simples,
    dobro,
    ultimoIpca: ULTIMO_MES_DO_IPCA,
    avisos,
    memoria: [] as string[],
  };
  resultado.memoria = montarMemoria(resultado, dataDaDevolucao);
  return resultado;
}

const fatorEmTexto = (fator: number) => fator.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

function montarMemoria(r: Extract<ResultadoDaCobranca, { ok: true }>, dataDaDevolucao: Data | null) {
  const m: string[] = [];
  m.push(`Cobranças consideradas: ${r.parcelas.length}.`);
  for (const p of r.parcelas) {
    const base = `${formatarData(p.data)}: cobrado ${reais(p.cobrado)}, valor correto ${reais(p.devido)}`;
    if (r.situacao === "sem-pagamento") {
      m.push(`${base}; não pago. Valor a contestar: ${reais(p.cobrado - p.devido)}.`);
      continue;
    }
    let texto = `${base}, pago ${reais(p.pago)}. Pago a mais: ${reais(p.excesso)}`;
    if (p.excesso > 0)
      texto +=
        p.fator > 1
          ? `; corrigido pelo IPCA (fator ${fatorEmTexto(p.fator)}): ${reais(p.corrigidoSimples)}`
          : p.semIpca
            ? "; sem correção (ainda não há IPCA divulgado depois deste mês)"
            : "; sem correção (a inflação acumulada no período ficou negativa)";
    m.push(`${texto}.`);
  }
  if (r.situacao === "sem-pagamento") {
    m.push(`Total cobrado acima do correto: ${reais(r.contestavel)}. Sem pagamento, não há valor a restituir: o caminho é contestar.`);
    return m;
  }
  m.push(`Total pago a mais: ${reais(r.excesso)}.`);
  if (r.devolvido > 0)
    m.push(`Já devolvido pela empresa${dataDaDevolucao ? ` em ${formatarData(dataDaDevolucao)}` : ""}: ${reais(r.devolvido)}, abatido de cada cenário.`);
  m.push(
    `Restituição simples: ${reais(r.excesso)}${r.devolvido > 0 ? ` − ${reais(r.devolvido)}` : ""} = ${reais(r.simples.principal)}; com correção pelo IPCA (${reais(r.simples.correcao)}): ${reais(r.simples.total)}.`,
  );
  m.push(
    `Restituição em dobro: 2 × ${reais(r.excesso)}${r.devolvido > 0 ? ` − ${reais(r.devolvido)}` : ""} = ${reais(r.dobro.principal)}; com correção pelo IPCA (${reais(r.dobro.correcao)}): ${reais(r.dobro.total)}.`,
  );
  m.push("Os dois cenários são alternativos: não se somam.");
  m.push(
    `Correção: IPCA do mês seguinte a cada pagamento até ${nomeDoMes(r.ultimoIpca)}, último índice divulgado pelo IBGE. Nunca reduz o valor.`,
  );
  m.push("Juros: não incluídos. Dependem de quando a empresa ficou em mora (em geral, a citação no processo) e da taxa legal.");
  return m;
}

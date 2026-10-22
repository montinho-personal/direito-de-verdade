// Quando dá para sacar o FGTS (Lei 8.036, art. 20) e o valor do saque-aniversário
// (Anexo da Lei 8.036, incluído pela Lei 13.932/2019). Não promete liberação: a Caixa
// confere os requisitos e os documentos de cada caso.
import { dividirArredondando } from "../tributos/calculo.ts";
import type { Data } from "../trabalhista/datas.ts";
import { type Competencia, somarMesesNaCompetencia, ultimoDiaUtil } from "./competencias.ts";
import { FGTS_2026 as P } from "./parametros.ts";

export type ValorDoSaqueAniversario = { saldo: number; aliquotaPorMil: number; adicional: number; valor: number };

// Alíquota da faixa sobre o saldo de todas as contas + parcela adicional (art. 20-D)
export function saqueAniversario(saldo: number): ValorDoSaqueAniversario {
  if (!(saldo > 0)) return { saldo: 0, aliquotaPorMil: 0, adicional: 0, valor: 0 };
  const faixa = P.saqueAniversario.find((f) => saldo <= f.ate)!;
  return {
    saldo,
    aliquotaPorMil: faixa.aliquotaPorMil,
    adicional: faixa.adicional,
    valor: dividirArredondando(saldo * faixa.aliquotaPorMil, 1000) + faixa.adicional,
  };
}

// Janela do saque-aniversário: do 1º dia do mês do aniversário até o último dia útil do
// 2º mês seguinte (art. 20, § 23). Feriados estaduais e municipais não são conferidos.
export function janelaDoSaqueAniversario(ano: number, mesDoAniversario: number): { inicio: Data; fim: Data } {
  const ate = somarMesesNaCompetencia({ ano, mes: mesDoAniversario }, 2);
  return { inicio: { ano, mes: mesDoAniversario, dia: 1 }, fim: ultimoDiaUtil(ate.ano, ate.mes) };
}

// Pedido de volta ao saque-rescisão: vale no 1º dia do 25º mês seguinte ao do pedido
// (art. 20-C, § 1º, I), se não houver antecipação (empréstimo) em aberto
export function retornoAoSaqueRescisao(pedido: Competencia): Data {
  const c = somarMesesNaCompetencia(pedido, 25);
  return { ano: c.ano, mes: c.mes, dia: 1 };
}

export type Situacao =
  | "sem-justa-causa"
  | "acordo"
  | "termo-normal"
  | "pedido"
  | "justa-causa"
  | "aposentadoria"
  | "tres-anos-fora"
  | "doenca-grave"
  | "setenta-anos"
  | "imovel"
  | "calamidade"
  | "saldo-pequeno"
  | "falecimento";

export type HipoteseDeSaque = {
  situacao: Situacao;
  nome: string;
  // Inciso do art. 20 da Lei 8.036
  base: string;
  // Sem saque-aniversário / com saque-aniversário
  saqueRescisao: string;
  saqueAniversario: string;
  // Pode sacar com saque-aniversário?
  liberaNoAniversario: "sim" | "nao" | "so-multa";
  liberaNaRescisao: "sim" | "nao" | "parcial";
  requisitos?: string;
};

// O saque-aniversário bloqueia só as hipóteses ligadas ao fim do contrato (incisos I, I-A,
// II, IX e X, art. 20-A, § 2º, II); as demais valem nas duas sistemáticas
export const HIPOTESES: HipoteseDeSaque[] = [
  {
    situacao: "sem-justa-causa",
    nome: "Fui demitido sem justa causa (ou rescisão indireta)",
    base: "art. 20, I",
    saqueRescisao: "Saca todo o saldo da conta do contrato, mais a multa de 40%.",
    saqueAniversario: "Saca só a multa de 40%. O saldo fica na conta, e os saques anuais continuam.",
    liberaNoAniversario: "so-multa",
    liberaNaRescisao: "sim",
  },
  {
    situacao: "acordo",
    nome: "Saí por acordo com a empresa (art. 484-A da CLT)",
    base: "art. 20, I-A",
    saqueRescisao: "Saca até 80% dos depósitos, mais a multa de 20%. Não há seguro-desemprego.",
    saqueAniversario: "O saldo fica na conta. Confira no app se a multa de 20% pode ser sacada.",
    liberaNoAniversario: "nao",
    liberaNaRescisao: "parcial",
  },
  {
    situacao: "termo-normal",
    nome: "Meu contrato a prazo terminou (experiência, temporário)",
    base: "art. 20, IX",
    saqueRescisao: "Saca todo o saldo da conta do contrato. Não há multa.",
    saqueAniversario: "O saldo fica na conta; seguem os saques anuais.",
    liberaNoAniversario: "nao",
    liberaNaRescisao: "sim",
  },
  {
    situacao: "pedido",
    nome: "Pedi demissão",
    base: "não está no art. 20",
    saqueRescisao: "Não saca nada agora. O saldo fica na conta e rende até outra hipótese de saque.",
    saqueAniversario: "Não saca o saldo; seguem os saques anuais.",
    liberaNoAniversario: "nao",
    liberaNaRescisao: "nao",
  },
  {
    situacao: "justa-causa",
    nome: "Fui demitido por justa causa",
    base: "não está no art. 20",
    saqueRescisao: "Não saca nada agora e não há multa. O saldo fica na conta.",
    saqueAniversario: "Não saca o saldo; seguem os saques anuais.",
    liberaNoAniversario: "nao",
    liberaNaRescisao: "nao",
  },
  {
    situacao: "aposentadoria",
    nome: "Me aposentei pelo INSS",
    base: "art. 20, III",
    saqueRescisao: "Saca todo o saldo.",
    saqueAniversario: "Saca todo o saldo.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
  },
  {
    situacao: "tres-anos-fora",
    nome: "Estou há 3 anos sem carteira assinada",
    base: "art. 20, VIII",
    saqueRescisao: "Saca o saldo das contas depois de 3 anos seguidos fora do regime do FGTS.",
    saqueAniversario: "Saca o saldo.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
  },
  {
    situacao: "doenca-grave",
    nome: "Tenho câncer, HIV, doença rara ou doença grave em estágio terminal (eu ou dependente)",
    base: "art. 20, XI, XIII, XIV e XXII",
    saqueRescisao: "Saca o saldo, com laudo médico.",
    saqueAniversario: "Saca o saldo, com laudo médico.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
    requisitos: "Laudo ou atestado médico; a Caixa lista os documentos de cada caso.",
  },
  {
    situacao: "setenta-anos",
    nome: "Tenho 70 anos ou mais",
    base: "art. 20, XV",
    saqueRescisao: "Saca o saldo.",
    saqueAniversario: "Saca o saldo.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
  },
  {
    situacao: "imovel",
    nome: "Vou comprar ou financiar a casa própria",
    base: "art. 20, V, VI e VII",
    saqueRescisao: "Usa o saldo na compra, na entrada ou nas prestações, pelas regras do Sistema Financeiro da Habitação.",
    saqueAniversario: "Usa o saldo que não estiver bloqueado por antecipação.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
    requisitos: "Pelo menos 3 anos de trabalho com FGTS (somando empresas) e regras do imóvel e do financiamento.",
  },
  {
    situacao: "calamidade",
    nome: "Minha cidade teve desastre natural com calamidade reconhecida",
    base: "art. 20, XVI",
    saqueRescisao: "Saca até o limite fixado em regulamento, se morar na área atingida.",
    saqueAniversario: "Pode sacar, nas mesmas condições.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
    requisitos: "Situação de emergência ou calamidade reconhecida pelo governo federal; o pedido vai até 90 dias depois do reconhecimento.",
  },
  {
    situacao: "saldo-pequeno",
    nome: "Tenho uma conta com menos de R$ 80 parada há 1 ano",
    base: "art. 20, XXI",
    saqueRescisao: "Saca o saldo, se não houve depósito nem saque por pelo menos 1 ano.",
    saqueAniversario: "Saca o saldo.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
  },
  {
    situacao: "falecimento",
    nome: "O trabalhador faleceu (saque pela família)",
    base: "art. 20, IV",
    saqueRescisao: "Os dependentes habilitados no INSS (ou, sem eles, os herdeiros) sacam o saldo.",
    saqueAniversario: "Os dependentes sacam o saldo.",
    liberaNoAniversario: "sim",
    liberaNaRescisao: "sim",
  },
];

// Ferramentas que podem entrar no meio de um artigo ou de uma página de calculadora.
// No texto, a linha <!-- ferramenta: calculadora-13-salario --> marca o lugar, no
// parágrafo em que ela responde à dúvida que o texto acabou de levantar; logo depois
// do lead, ela aparece antes do sumário. Cada ferramenta entra uma vez por página.
export const FERRAMENTAS = [
  "calculadora-13-salario",
  "calculadora-ir-salario",
  "calculadora-rescisao",
  "calculadora-pedido-de-demissao",
  "calculadora-acordo-de-demissao",
  "calculadora-seguro-desemprego",
  "comparador-de-salario",
  "conferir-holerite",
  "comparador-de-rescisao",
  "conferir-trct",
  "conferir-13",
  "comparador-13",
  "calculadora-ferias",
  "calculadora-compra-internacional",
  "calculadora-horas-extras",
  "calculadora-fgts",
] as const;

export type IdDaFerramenta = (typeof FERRAMENTAS)[number];

export function ehFerramenta(id: string): id is IdDaFerramenta {
  return (FERRAMENTAS as readonly string[]).includes(id);
}

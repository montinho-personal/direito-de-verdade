// Ferramentas que podem entrar no meio de um artigo ou de uma página de calculadora.
// No texto, a linha <!-- ferramenta: calculadora-13-salario --> marca o lugar. Uma
// por página, no parágrafo em que ela responde à dúvida que o texto acabou de
// levantar; logo depois do lead, ela aparece antes do sumário.
export const FERRAMENTAS = ["calculadora-13-salario", "calculadora-ir-salario"] as const;

export type IdDaFerramenta = (typeof FERRAMENTAS)[number];

export function ehFerramenta(id: string): id is IdDaFerramenta {
  return (FERRAMENTAS as readonly string[]).includes(id);
}

// Ferramentas que podem entrar no meio de um artigo. No texto, a linha
// <!-- ferramenta: calculadora-13-salario --> marca o lugar. Uma por artigo,
// no parágrafo em que ela responde à dúvida que o texto acabou de levantar.
export const FERRAMENTAS = ["calculadora-13-salario"] as const;

export type IdDaFerramenta = (typeof FERRAMENTAS)[number];

export function ehFerramenta(id: string): id is IdDaFerramenta {
  return (FERRAMENTAS as readonly string[]).includes(id);
}

// Funções de texto usadas pela análise: tirar acento, separar em palavras, comparar.

const VAZIAS = new Set(
  "a o as os um uma uns umas de da do das dos em no na nos nas por para pra com sem e ou que se ao aos à às é são ser foi como qual quais quando quanto quanta quantos quantas onde quem pode posso tem ter meu minha meus minhas seu sua seus suas eu ele ela isso este esta esse essa já não sim mais menos muito sobre entre até também me te lhe o que".split(
    " ",
  ),
);

export function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

// "Multa de 3 aluguéis proporcional?" → ["multa", "3", "aluguel", "proporcional"]
export function palavras(texto: string): string[] {
  return semAcento(texto)
    .replace(/[^a-z0-9%]+/g, " ")
    .split(" ")
    .filter((p) => p && !VAZIAS.has(p))
    .map(raiz);
}

// Junta singular e plural e as formas mais comuns do mesmo verbo (calcular, cálculo,
// calculadora ficam separados de propósito: indicam intenções diferentes)
function raiz(palavra: string) {
  if (palavra.length <= 3) return palavra;
  if (palavra.endsWith("eis")) return palavra.slice(0, -3) + "el";
  if (palavra.endsWith("oes") || palavra.endsWith("aes")) return palavra.slice(0, -3) + "ao";
  if (palavra.endsWith("ais")) return palavra.slice(0, -3) + "al";
  if (palavra.endsWith("res") || palavra.endsWith("zes")) return palavra.slice(0, -2);
  if (palavra.endsWith("s") && !palavra.endsWith("ss")) return palavra.slice(0, -1);
  return palavra;
}

// Chave para reconhecer a mesma pergunta escrita de jeitos parecidos
export function chave(texto: string) {
  return [...new Set(palavras(texto))].sort().join(" ");
}

// Parte das palavras de "procurado" que aparecem em "onde" (0 a 1)
export function cobertura(procurado: string, onde: string) {
  const alvo = [...new Set(palavras(procurado))];
  if (alvo.length === 0) return 0;
  const tem = new Set(palavras(onde));
  return alvo.filter((p) => tem.has(p)).length / alvo.length;
}

export function dominioDe(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ehPergunta(texto: string) {
  const t = semAcento(texto).trim();
  return (
    t.endsWith("?") ||
    /^(como|o que|qual|quais|quanto|quanta|quantos|quantas|quando|onde|quem|posso|pode|e |tem |por que|porque|precisa|devo)\b/.test(
      t,
    )
  );
}

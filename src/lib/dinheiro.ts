// Leitura e exibição de valores em reais para as calculadoras. Os valores circulam
// em centavos inteiros; aqui ficam só a conversão do que a pessoa digita e a
// formatação para a tela.

// Maior valor aceito nos campos (R$ 10 milhões): acima disso é quase certo erro de digitação
export const MAXIMO_EM_CENTAVOS = 1_000_000_000;

export type LeituraDeValor =
  | { tipo: "vazio" }
  | { tipo: "valido"; centavos: number }
  | { tipo: "invalido"; mensagem: string };

// Aceita "2.500,50", "2500,50", "2500.50", "R$ 2.500" e "2500"
export function lerReais(texto: string): LeituraDeValor {
  const limpo = texto.replace(/R\$|\s/g, "");
  if (!limpo) return { tipo: "vazio" };
  if (!/^[\d.,]+$/.test(limpo)) {
    return { tipo: "invalido", mensagem: "Use só números, com vírgula para os centavos." };
  }
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo.replace(/\.(?=\d{3}(\.|$))/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) {
    return { tipo: "invalido", mensagem: "Confira o valor: use até 2 casas depois da vírgula." };
  }
  const [inteiros, decimais = ""] = normalizado.split(".");
  const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, "0"));
  if (centavos > MAXIMO_EM_CENTAVOS) {
    return { tipo: "invalido", mensagem: "Valor alto demais. Confira se digitou certo." };
  }
  return { tipo: "valido", centavos };
}

export type LeituraDeQuantidade =
  | { tipo: "valido"; quantidade: number }
  | { tipo: "invalido"; mensagem: string };

// Quantidade inteira (dependentes, por exemplo); vazio vale zero
export function lerQuantidade(texto: string, maximo: number): LeituraDeQuantidade {
  const limpo = texto.trim();
  if (!limpo) return { tipo: "valido", quantidade: 0 };
  if (!/^\d+$/.test(limpo)) return { tipo: "invalido", mensagem: "Use um número inteiro." };
  const quantidade = Number(limpo);
  if (quantidade > maximo) return { tipo: "invalido", mensagem: `O máximo é ${maximo}.` };
  return { tipo: "valido", quantidade };
}

const formatoDeReais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function reais(centavos: number) {
  return formatoDeReais.format(centavos / 100);
}

// 75 → "7,5%"; 1000 → "100%"
export function percentualPorMil(porMil: number) {
  return `${(porMil / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

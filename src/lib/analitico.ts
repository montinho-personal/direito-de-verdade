// Eventos do Google Analytics 4 disparados pelas ferramentas. Só nomes e categorias
// fixas (modo, canal, destino): nunca salário, horas, valores ou dados do holerite.
// Sem o Analytics configurado (site.googleAnalytics vazio), não faz nada.
type Parametro = string | number | boolean;

export function registrarEvento(nome: string, parametros: Record<string, Parametro> = {}) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...argumentos: unknown[]) => void }).gtag;
  gtag?.("event", nome, parametros);
}

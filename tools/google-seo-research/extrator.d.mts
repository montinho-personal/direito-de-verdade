// Tipos do extrator para o painel (o arquivo .mjs roda também dentro do navegador do coletor)
export function extrairAutocompletar(): { texto: string }[];
export function extrairDaPagina(doc?: Document): Record<string, unknown>;

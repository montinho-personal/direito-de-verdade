// Google SEO Research Lab: ferramenta interna de pesquisa, de uso LOCAL.
//
// O painel (/seo-lab) e a API dele só respondem quando o servidor de desenvolvimento é
// aberto com `npm run seo:lab`, que define SEO_LAB=1. Em produção (Vercel, inclusive as
// prévias) a resposta é sempre 404: não há autenticação nem armazenamento para publicar isso.
// O código da ferramenta fica em tools/google-seo-research/.
export function labAtivo() {
  return process.env.NODE_ENV !== "production" && process.env.SEO_LAB === "1";
}

// Domínio do site nos resultados do Google (site.url aponta para localhost fora da Vercel)
export const DOMINIO_DO_SITE = "direitodeverdade.com.br";

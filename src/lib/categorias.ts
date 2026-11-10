export type Categoria = {
  slug: string;
  nome: string;
  // O <title> da página da categoria (até ~40 caracteres; o nome do site entra depois)
  tituloSeo: string;
  descricao: string;
};

// Uma categoria só aparece no site depois que tiver pelo menos um artigo publicado.
export const categorias: Categoria[] = [
  {
    slug: "trabalho",
    nome: "Trabalho",
    tituloSeo: "Direitos trabalhistas explicados",
    descricao:
      "Direitos de quem trabalha, com ou sem carteira assinada: rescisão, férias, horas extras, FGTS e mais.",
  },
  {
    slug: "consumidor",
    nome: "Consumidor",
    tituloSeo: "Direitos do consumidor explicados",
    descricao:
      "Compras, trocas, produto com defeito, cobrança indevida, bancos, planos de saúde e golpes: seus direitos e como reclamar.",
  },
  {
    slug: "familia",
    nome: "Família",
    tituloSeo: "Direito de família explicado",
    descricao:
      "Divórcio, pensão alimentícia, guarda dos filhos, união estável e inventário: como funciona, prazos e onde buscar ajuda gratuita.",
  },
  {
    slug: "previdencia",
    nome: "Previdência e INSS",
    tituloSeo: "INSS e aposentadoria: seus direitos",
    descricao:
      "Aposentadoria, auxílio-doença, BPC, pensão por morte e outros benefícios do INSS: quem tem direito, valores, como pedir e o que fazer se o pedido for negado.",
  },
  {
    slug: "moradia",
    nome: "Moradia e Aluguel",
    tituloSeo: "Aluguel e moradia: seus direitos",
    descricao:
      "Aluguel, reajuste, multa por sair antes, fiador, condomínio, usucapião e problemas com vizinhos: o que a lei diz e como resolver.",
  },
  {
    slug: "transito",
    nome: "Trânsito",
    tituloSeo: "Multas e CNH: seus direitos",
    descricao: "Multas, pontos na CNH, recurso de multa, suspensão e CNH sem autoescola: prazos, valores e o passo a passo para se defender.",
  },
  {
    slug: "ajuda-juridica",
    nome: "Onde buscar ajuda",
    tituloSeo: "Advogado e ajuda jurídica gratuita",
    descricao:
      "Como escolher um advogado e onde encontrar atendimento jurídico gratuito na sua região: Defensoria, OAB, Juizados e Justiça do Trabalho.",
  },
];

export function categoriaPorSlug(slug: string) {
  return categorias.find((categoria) => categoria.slug === slug);
}

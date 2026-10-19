export type Categoria = {
  slug: string;
  nome: string;
  descricao: string;
};

// Uma categoria só aparece no site depois que tiver pelo menos um artigo publicado.
export const categorias: Categoria[] = [
  {
    slug: "trabalho",
    nome: "Trabalho",
    descricao:
      "Direitos de quem trabalha, com ou sem carteira assinada: rescisão, férias, horas extras, FGTS e mais.",
  },
  {
    slug: "consumidor",
    nome: "Consumidor",
    descricao:
      "Compras, trocas, cobranças indevidas, bancos, planos de saúde e serviços.",
  },
  {
    slug: "familia",
    nome: "Família",
    descricao:
      "Divórcio, pensão alimentícia, guarda dos filhos, união estável e herança.",
  },
  {
    slug: "previdencia",
    nome: "Previdência e INSS",
    descricao:
      "Aposentadoria, auxílio por incapacidade, BPC e outros benefícios do INSS.",
  },
  {
    slug: "moradia",
    nome: "Moradia e Aluguel",
    descricao:
      "Aluguel, condomínio, compra de imóvel e problemas com vizinhos.",
  },
  {
    slug: "transito",
    nome: "Trânsito",
    descricao: "Multas, CNH, recursos e acidentes de trânsito.",
  },
];

export function categoriaPorSlug(slug: string) {
  return categorias.find((categoria) => categoria.slug === slug);
}

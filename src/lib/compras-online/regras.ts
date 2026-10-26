// Regras e fontes do simulador de direitos em compras online. Só mudar depois de
// conferir de novo com as fontes, nunca automaticamente. Trechos em
// docs/calculadoras/simulador-direitos-compras-online.md.
//
// - Oferta: o anúncio obriga e integra o contrato (CDC, art. 30). Recusa de cumprimento:
//   o consumidor escolhe entre exigir o cumprimento, aceitar equivalente ou rescindir com
//   restituição atualizada e perdas e danos (art. 35). No comércio eletrônico, o prazo de
//   entrega deve ser informado antes da compra (Decreto 7.962/2013, art. 2º, V) e cumprido
//   (art. 6º); deixar de estipular prazo é prática abusiva (CDC, art. 39, XII).
// - Arrependimento: 7 dias da assinatura ou do recebimento, em contratação fora do
//   estabelecimento, com devolução imediata e atualizada (CDC, art. 49). O fornecedor deve
//   comunicar o cartão para não lançar ou estornar (Decreto 7.962, art. 5º, § 3º). A lei não
//   lista exceções; a lista de personalizados e perecíveis é entendimento de Procon.
// - Vício: fornecedores respondem solidariamente; 30 dias para sanar e, depois, troca,
//   restituição ou abatimento à escolha do consumidor; uso imediato dessas opções quando a
//   troca de partes comprometer o produto ou se for produto essencial (CDC, art. 18, §§ 1º e
//   3º). Disparidade com a embalagem ou a publicidade também é vício (art. 18, caput); falta
//   de quantidade, art. 19.
// - Prazo para reclamar: 30 dias (não durável) ou 90 dias (durável), da entrega ou, no vício
//   oculto, de quando ele aparece; a reclamação comprovada obsta o prazo até a resposta
//   negativa (CDC, art. 26). O CDC não diz se os dias são corridos: o simulador conta corridos.
// - Atendimento no comércio eletrônico: resposta em até 5 dias (Decreto 7.962, art. 4º, V e
//   parágrafo único). O Decreto 11.034/2022 (SAC, 7 dias) vale só para serviços regulados
//   pelo Poder Executivo federal, não para lojas em geral.
// - Golpe no Pix: contestação no app aciona o MED; pedido em até 80 dias do Pix; análise em
//   até 7 dias (Guia do MED, Banco Central).

export const REGRAS_DAS_COMPRAS = {
  revisadoEm: "2026-10-26",
  arrependimentoDias: 7,
  prazoDoConsertoDias: 30,
  reclamacaoNaoDuravelDias: 30,
  reclamacaoDuravelDias: 90,
  respostaDaLojaDias: 5,
  medDias: 80,
  medAnaliseDias: 7,
  consumidorGovRespostaDias: 10,
} as const;

export const FONTES = {
  cdc: {
    curto: "CDC",
    nome: "Código de Defesa do Consumidor (Lei 8.078/1990), texto atualizado (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-normaatualizada-pl.html",
  },
  decreto7962: {
    curto: "Decreto 7.962/2013",
    nome: "Decreto 7.962/2013, comércio eletrônico (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/decret/2013/decreto-7962-15-marco-2013-775557-publicacaooriginal-139266-pe.html",
  },
  proconSpInternet: {
    curto: "Procon-SP",
    nome: "Procon-SP: compras pela internet",
    url: "https://www.procon.sp.gov.br/compras-pela-internet/",
  },
  proconSpMarketplace: {
    curto: "Procon-SP",
    nome: "Procon-SP: plataformas respondem solidariamente por falhas (26/02/2026)",
    url: "https://www.procon.sp.gov.br/procon-sp-autua-empresa-responsavel-pela-shopee-em-r-14-mi-por-clausulas-abusivas-e-falhas-de-informacao-ao-consumidor/",
  },
  proconSpGuia: {
    curto: "Procon-SP",
    nome: "Procon-SP: Guia de Comércio Eletrônico (2024)",
    url: "https://www.procon.sp.gov.br/wp-content/uploads/2024/08/Guia_de_Comercio_Eletronico.pdf",
  },
  proconSpEviteSites: {
    curto: "Procon-SP",
    nome: "Procon-SP: lista Evite esses sites",
    url: "https://sistemas.procon.sp.gov.br/evitesite/list/evitesites.php",
  },
  proconScArrependimento: {
    curto: "Procon-SC",
    nome: "Procon-SC: direito de arrependimento vale por 7 dias em compras online",
    url: "https://www.procon.sc.gov.br/procon-sc-explica-direito-de-arrependimento-vale-por-7-dias-para-compras-online/",
  },
  stjVicioOculto: {
    curto: "STJ",
    nome: "STJ: fornecedor responde por defeito oculto que aparece depois da garantia (11/04/2022)",
    url: "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/11042022-Fornecedor-pode-ser-responsabilizado-por-defeito-oculto-apresentado-em-produto-fora-do-prazo-de-garantia.aspx",
  },
  guiaMed: {
    curto: "Banco Central",
    nome: "Banco Central: Guia do MED (Mecanismo Especial de Devolução do Pix)",
    url: "https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Guia_MED.pdf",
  },
  consumidorGov: {
    curto: "Consumidor.gov.br",
    nome: "Consumidor.gov.br",
    url: "https://www.consumidor.gov.br/pages/conteudo/publico/1",
  },
  juizados: {
    curto: "Lei 9.099/1995",
    nome: "Lei 9.099/1995, Juizados Especiais (Planalto)",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm",
  },
} as const;

export type IdDaFonte = keyof typeof FONTES;

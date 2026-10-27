// Regras e fontes do simulador de direitos do passageiro aéreo, com vigência. Só mudar
// depois de conferir de novo com as fontes. Trechos em
// docs/calculadoras/simulador-direitos-voo-atrasado-cancelado.md.
//
// - Resolução ANAC 400/2016 (texto original, cópia oficial do Procon-GO): arts. 11, 12,
//   17, 18, 20 a 34.
// - Resolução ANAC 813/2026 (publicada em 25/09/2026), com a vigência dada pela Resolução
//   819/2026 (publicada em 26/10/2026):
//   - desde 26/10/2026: art. 27 novo (assistência "no território nacional"; alimentação
//     depois de 2 horas; hospedagem com pernoite e transporte depois de 4 horas; fim das
//     facilidades de comunicação depois de 1 hora); arts. 25-A, 25-B, 26 par. único,
//     27-A e 27-B (reembolso de despesas em até 7 dias quando faltar estrutura);
//   - desde 25/11/2026: art. 20 novo (informação por canais digitais, com as opções e a
//     data e hora da última atualização; sai a atualização a cada 30 minutos).
// - Código Brasileiro de Aeronáutica: art. 251-A (dano extrapatrimonial depende de prova do
//   prejuízo), art. 256, § 1º, II e § 3º (força maior no atraso: mau tempo com restrição do
//   controle do espaço aéreo, infraestrutura, determinação de autoridade).
// - STF: Tema 210 (convenções internacionais prevalecem sobre o CDC nos danos materiais do
//   transporte aéreo internacional) e Tema 1.240 (não se aplicam aos danos morais).

export const REGRAS_DO_VOO = {
  revisadoEm: "2026-10-27",
  // A partir deste dia (data do voo), vale o art. 27 da Resolução 813
  vigenciaDoNovoArt27: "2026-10-26",
  vigenciaDoNovoArt20: "2026-11-25",
  minutosComunicacao: 60,
  minutosAlimentacao: 120,
  minutosHospedagem: 240,
  alteracaoAvisoHoras: 72,
  alteracaoDomesticoMinutos: 30,
  alteracaoInternacionalMinutos: 60,
  reembolsoDias: 7,
  bagagemDomesticoDias: 7,
  bagagemInternacionalDias: 21,
  protestoAvariaDias: 7,
  preterimentoDomesticoDes: 250,
  preterimentoInternacionalDes: 500,
  limiteBagagemDes: 1131,
} as const;

export const FONTES = {
  r400: {
    curto: "Resolução ANAC 400",
    nome: "Resolução ANAC 400/2016, texto original (cópia oficial do Procon-GO)",
    url: "https://goias.gov.br/procon/wp-content/uploads/sites/19/2017/03/resolucao-400-anac.pdf",
  },
  r813: {
    curto: "Resolução ANAC 813",
    nome: "Resolução ANAC 813/2026, que altera a Resolução 400 (texto compilado, ANAC)",
    url: "https://www.anac.gov.br/assuntos/legislacao/legislacao-1/resolucoes/2026/resolucao-813",
  },
  r819: {
    curto: "Resolução ANAC 819",
    nome: "Resolução ANAC 819/2026: vigência das novas regras de informação em 25/11/2026 (ANAC)",
    url: "https://www.anac.gov.br/assuntos/legislacao/legislacao-1/resolucoes/2026/resolucao-819",
  },
  cba: {
    curto: "Código Brasileiro de Aeronáutica",
    nome: "Código Brasileiro de Aeronáutica (Lei 7.565/1986), arts. 251-A e 256 (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/lei/1980-1987/lei-7565-19-dezembro-1986-368177-normaatualizada-pl.html",
  },
  cdc: {
    curto: "CDC",
    nome: "Código de Defesa do Consumidor (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-normaatualizada-pl.html",
  },
  stf1240: {
    curto: "STF, Tema 1.240",
    nome: "STF: convenções internacionais não se aplicam a dano moral em transporte internacional (Tema 1.240)",
    url: "https://noticias.stf.jus.br/postsnoticias/convencoes-internacionais-nao-se-aplicam-a-dano-moral-em-transporte-internacional-de-passageiros/",
  },
  stf210: {
    curto: "STF, Tema 210",
    nome: "STF: transporte aéreo internacional segue as convenções no extravio de bagagem (Tema 210)",
    url: "https://noticias.stf.jus.br/postsnoticias/transporte-aereo-deve-seguir-convencoes-internacionais-sobre-extravio-de-bagagens/",
  },
  consumidorGov: { curto: "Consumidor.gov.br", nome: "Consumidor.gov.br", url: "https://www.consumidor.gov.br/pages/conteudo/publico/1" },
  juizados: { curto: "Lei 9.099/1995", nome: "Lei 9.099/1995, Juizados Especiais (Planalto)", url: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm" },
} as const;

export type IdDaFonte = keyof typeof FONTES;

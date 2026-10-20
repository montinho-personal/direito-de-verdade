// Regras fixas em lei usadas na rescisão. As tabelas de INSS e IR, que mudam todo
// ano, ficam em src/lib/tributos/parametros-AAAA.ts.
//
// Fontes (conferidas em 19/10/2026, texto atualizado no Planalto e na Câmara):
// - Aviso: 30 dias + 3 por ano completo, até 90 (Lei 12.506/2011); 1 ano = 33 dias
//   (Nota Técnica MTE 184/2012 e TST, RR-20892-88.2014.5.04.0005)
// - Contagem do aviso: exclui o dia do começo (Súmula 380 do TST)
// - Prazo de pagamento: 10 dias contados do término do contrato (CLT, art. 477, § 6º)
// - Desconto do aviso não cumprido pelo empregado (CLT, art. 487, § 2º), limitado a
//   um mês de remuneração (CLT, art. 477, § 5º)
// - FGTS: 8% (Lei 8.036/1990, art. 15); multa de 40% (art. 18, § 1º) e 20% no
//   acordo (CLT, art. 484-A); saque de até 80% no acordo (art. 484-A, § 1º)

export const REGRAS_DA_RESCISAO = {
  // Data da última conferência destas regras com as fontes. Só mudar depois de
  // conferir de novo, nunca automaticamente.
  revisadoEm: "2026-10-19",
  aviso: { base: 30, porAno: 3, maximo: 90 },
  prazoDePagamentoEmDias: 10,
  // Em milésimos (8% = 80)
  fgtsPorMil: 80,
  multaSemJustaCausaPorMil: 400,
  multaAcordoPorMil: 200,
  saqueNoAcordoPorMil: 800,
} as const;

// Prazos e regras do 13º salário. Fontes (conferidas em 20/10/2026): Lei 4.090/1962,
// Lei 4.749/1965 e Decreto 10.854/2021, arts. 76 a 82 (Diário Oficial da União).
// - 13º = 1/12 da remuneração de dezembro por mês de serviço; 15 dias ou mais
//   contam como mês (art. 76, §§ 1º e 2º)
// - Variáveis: 1/11 da soma até novembro, revista até 10 de janeiro para 1/12 do ano
//   (art. 77)
// - 1ª parcela entre fevereiro e novembro: metade do salário do mês anterior ao
//   pagamento (art. 78); admitido no ano: metade de 1/12 por mês de serviço ou
//   fração superior a 15 dias (§ 4º); descontada da gratificação (§ 3º)
// - 2026: o prazo de 20/12 cai num domingo; a 2ª parcela sai até sexta, 18/12
//   (docs/artigos/13-salario.md, 2 veículos)
export const DECIMO_TERCEIRO_2026 = {
  ano: 2026,
  revisadoEm: "2026-10-20",
  primeiraParcelaAte: "2026-11-30",
  segundaParcelaAte: "2026-12-18",
  prazoLegalDaSegunda: "2026-12-20",
  ajusteDeVariaveisAte: "2027-01-10",
} as const;

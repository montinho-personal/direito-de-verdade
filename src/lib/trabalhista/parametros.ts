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

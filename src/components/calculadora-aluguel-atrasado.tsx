"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Campo, Escolha, Linha } from "@/components/partes-da-calculadora";
import { calcularAtraso, dataValida, type Aviso, type Indice } from "@/lib/aluguel/atraso";
import { ULTIMO_MES_DO_IGPM } from "@/lib/aluguel/igpm";
import { ULTIMO_MES_DO_IPCA } from "@/lib/cobranca-indevida/ipca";
import { lerReais, reais } from "@/lib/dinheiro";

type EscolhaDoIndice = Indice | "nao-diz";

const INDICES: { valor: EscolhaDoIndice; nome: string }[] = [
  { valor: "igpm", nome: "IGP-M" },
  { valor: "ipca", nome: "IPCA" },
  { valor: "nao-diz", nome: "O contrato não diz (vale o IPCA)" },
  { valor: "nenhum", nome: "Sem correção" },
];

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesAno = ({ ano, mes }: { ano: number; mes: number }) => `${MESES[mes - 1]}/${ano}`;

// "10" → 100 (décimos de ponto); "2,5" → 25. Vazio = 0; inválido = null
function lerPercentual(texto: string, escala: number): number | null {
  const limpo = texto.replace("%", "").trim().replace(",", ".");
  if (!limpo) return 0;
  if (!/^\d{1,3}(\.\d{1,3})?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * escala);
}

function hoje() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const TEXTO_DO_AVISO: Record<Aviso, React.ReactNode> = {
  "sem-atraso": "Pagamento no vencimento ou antes: não há multa, juros nem correção.",
  "juros-pela-taxa-legal": (
    <>
      O contrato não fixa juros: vale a <strong>taxa legal</strong>, a Selic menos o IPCA,
      que o Banco Central divulga todo mês (Código Civil, artigo 406). Ela muda mês a mês,
      então a calculadora deixou os juros de fora. Faça essa parte na{" "}
      <a
        href="https://www3.bcb.gov.br/CALCIDADAO/publico/exibirFormCorrecaoValores.do?method=exibirFormCorrecaoValores"
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2"
      >
        Calculadora do Cidadão do Banco Central
      </a>
      .
    </>
  ),
  "indice-incompleto": `O índice dos últimos meses ainda não foi divulgado (IGP-M até ${mesAno(ULTIMO_MES_DO_IGPM)}; IPCA até ${mesAno(ULTIMO_MES_DO_IPCA)}): a correção desses meses ficou de fora.`,
  "correcao-negativa":
    "O índice caiu no período (deflação). A calculadora não reduz a dívida: a correção ficou em zero.",
  "multa-alta":
    "Multa acima de 10%. A Lei do Inquilinato não fixa limite, mas o juiz pode reduzir a multa manifestamente excessiva (Código Civil, artigo 413).",
  "juros-altos":
    "Juros acima de 1% ao mês. Confira a cláusula do contrato: juros fora do comum podem ser questionados.",
};

// Aluguel atrasado: multa, correção e juros pelo contrato
export function CalculadoraAluguelAtrasado({ nivelDoTitulo = 2 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [multa, setMulta] = useState("10");
  const [juros, setJuros] = useState("1");
  const [jurosNoContrato, setJurosNoContrato] = useState<"sim" | "nao">("sim");
  const [indice, setIndice] = useState<EscolhaDoIndice>("igpm");

  const leituraDoValor = lerReais(valor);
  const multaPorMil = lerPercentual(multa, 10);
  const jurosPorCemMil = lerPercentual(juros, 1000);
  const erros = {
    valor: leituraDoValor.tipo === "invalido" ? leituraDoValor.mensagem : undefined,
    vencimento: vencimento && !dataValida(vencimento) ? "Data inválida." : undefined,
    pagamento: pagamento && !dataValida(pagamento) ? "Data inválida." : undefined,
    multa: multaPorMil === null || (multaPorMil ?? 0) > 1000 ? "Use um percentual de 0 a 100." : undefined,
    juros:
      jurosNoContrato === "sim" && (jurosPorCemMil === null || (jurosPorCemMil ?? 0) > 100_000)
        ? "Use um percentual de 0 a 100."
        : undefined,
  };

  const resultado =
    leituraDoValor.tipo === "valido" &&
    vencimento &&
    !Object.values(erros).some(Boolean)
      ? calcularAtraso({
          valorEmCentavos: leituraDoValor.centavos,
          vencimento,
          // Em branco: hoje (só calcula no navegador, depois que a pessoa digita o valor)
          pagamento: pagamento || hoje(),
          multaPorMil: multaPorMil ?? 0,
          jurosAoMesPorCemMil: jurosNoContrato === "sim" ? (jurosPorCemMil ?? 0) : null,
          indice: indice === "nao-diz" ? "ipca" : indice,
        })
      : null;

  const nomeDoIndice = indice === "igpm" ? "IGP-M" : indice === "nenhum" ? "" : "IPCA";

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule o aluguel atrasado com multa, juros e correção
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-valor`}
          rotulo="Valor em atraso (R$)"
          dica="O aluguel do mês, ou o boleto inteiro com condomínio e IPTU, se for o caso."
          exemplo="Ex.: 2.000,00"
          valor={valor}
          aoMudar={setValor}
          erro={erros.valor}
        />
        <Campo
          id={`${id}-vencimento`}
          rotulo="Data de vencimento"
          tipo="date"
          valor={vencimento}
          aoMudar={setVencimento}
          erro={erros.vencimento}
        />
        <Campo
          id={`${id}-pagamento`}
          rotulo="Data do pagamento"
          dica="Em branco, a calculadora usa a data de hoje."
          tipo="date"
          valor={pagamento}
          aoMudar={setPagamento}
          erro={erros.pagamento}
        />
        <Campo
          id={`${id}-multa`}
          rotulo="Multa por atraso do contrato (%)"
          dica="Está na cláusula de atraso. Sem multa no contrato, use 0."
          exemplo="Ex.: 10"
          valor={multa}
          aoMudar={setMulta}
          erro={erros.multa}
        />
        <Escolha
          id={`${id}-tem-juros`}
          rotulo="O contrato fixa os juros de atraso?"
          valor={jurosNoContrato}
          opcoes={[
            { valor: "sim", nome: "Sim" },
            { valor: "nao", nome: "Não diz" },
          ]}
          aoMudar={setJurosNoContrato}
        />
        {jurosNoContrato === "sim" && (
          <Campo
            id={`${id}-juros`}
            rotulo="Juros de atraso do contrato (% ao mês)"
            exemplo="Ex.: 1"
            valor={juros}
            aoMudar={setJuros}
            erro={erros.juros}
          />
        )}
        <Escolha
          id={`${id}-indice`}
          rotulo="Índice de correção do contrato"
          dica="O mesmo do reajuste anual, em geral. Se o contrato não disser, vale o IPCA."
          valor={indice}
          opcoes={INDICES}
          aoMudar={setIndice}
        />
      </div>

      <div aria-live="polite" className="mt-6">
        {resultado ? (
          <>
            <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
              <Linha nome="Dias de atraso" valor={String(resultado.diasDeAtraso)} />
              <Linha
                nome={
                  nomeDoIndice
                    ? `Correção (${nomeDoIndice}, ${resultado.mesesCorrigidos} ${resultado.mesesCorrigidos === 1 ? "mês" : "meses"})`
                    : "Correção"
                }
                valor={reais(resultado.correcaoEmCentavos)}
              />
              <Linha nome="Multa por atraso" valor={reais(resultado.multaEmCentavos)} />
              <Linha
                nome="Juros de atraso"
                valor={resultado.jurosEmCentavos === null ? "ver aviso" : reais(resultado.jurosEmCentavos)}
              />
              <Linha nome="Total a pagar" valor={reais(resultado.totalEmCentavos)} destaque />
            </dl>
            {resultado.avisos.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm leading-6">
                {resultado.avisos.map((aviso) => (
                  <li key={aviso} className="rounded-lg border border-border bg-white px-4 py-3">
                    {TEXTO_DO_AVISO[aviso]}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o valor em atraso e as datas para ver a multa, os juros, a correção e o total.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com os percentuais do contrato: multa sobre o valor em atraso, correção
        pelos meses completos de atraso e juros simples proporcionais aos dias. O contrato
        pode prever outra forma de cálculo. Se houver ação de despejo, entram também custas e
        honorários. Veja{" "}
        <Link href="/artigos/despejo-por-falta-de-pagamento" className="text-accent underline underline-offset-2">
          o que acontece no despejo por falta de pagamento
        </Link>
        .
      </p>
    </section>
  );
}

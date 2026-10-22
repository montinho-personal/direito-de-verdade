"use client";

import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { lerReais, reais } from "@/lib/dinheiro";
import { calcularImportacao, IMPORTACAO_2026 as P, type ResultadoDaImportacao } from "@/lib/importacao.ts";

const ICMS = [
  { valor: "1700", nome: "17%" },
  { valor: "1800", nome: "18%" },
  { valor: "1900", nome: "19%" },
  { valor: "2000", nome: "20%" },
];

// "5,40", "5.4321" ou "R$ 5,40" em décimos de milésimo de real (5,40 = 54000)
function lerCotacao(texto: string): number | null {
  const limpo = texto.replace(/R\$|\s/g, "").replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,4})?$/.test(limpo)) return null;
  const [inteiros, decimais = ""] = limpo.split(".");
  return Number(inteiros) * 10000 + Number(decimais.padEnd(4, "0"));
}

const dolares = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(centavos / 100);

// Imposto de importação e ICMS de compras em sites estrangeiros (Shein, AliExpress,
// Temu, Shopee internacional), com as regras da Receita desde 12/05/2026
export function CalculadoraCompraInternacional({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [valor, setValor] = useState("");
  const [cotacao, setCotacao] = useState("");
  const [programa, setPrograma] = useState<"sim" | "nao">("sim");
  const [icms, setIcms] = useState("1700");

  const leitura = lerReais(valor);
  const cot = cotacao ? lerCotacao(cotacao) : null;
  const errosDeLeitura: Record<string, string> = {};
  if (leitura.tipo === "invalido") errosDeLeitura.valor = leitura.mensagem;
  if (cotacao && cot === null) errosDeLeitura.cotacao = "Digite a cotação com vírgula, como 5,40.";
  const calculo =
    leitura.tipo === "valido" && cot !== null && !Object.keys(errosDeLeitura).length
      ? calcularImportacao({
          valor: leitura.centavos,
          cotacao: cot,
          remessaConforme: programa === "sim",
          icmsPorDezMil: Number(icms),
        })
      : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) => errosDeLeitura[campo] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const r = calculo?.ok ? calculo : null;
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/taxa-de-importacao"}`;

  return (
    <section
      id="calculadora-de-compra-internacional"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule o imposto da sua compra internacional
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-valor`}
          rotulo="Valor da compra com frete (R$)"
          exemplo="Ex.: 230,00"
          valor={valor}
          aoMudar={setValor}
          erro={erro("valor")}
          dica="Produtos + frete + seguro, se houver, antes dos impostos."
        />
        <Campo
          id={`${id}-cotacao`}
          rotulo="Cotação do dólar (R$)"
          exemplo="Ex.: 5,40"
          valor={cotacao}
          aoMudar={setCotacao}
          erro={erro("cotacao")}
          dica="A do dia. Ela define se a compra passa de US$ 50."
        />
        <Escolha
          id={`${id}-programa`}
          rotulo="O site está no Remessa Conforme?"
          valor={programa}
          opcoes={[
            { valor: "sim", nome: "Sim (Shein, AliExpress, Shopee, Temu e outros)" },
            { valor: "nao", nome: "Não, ou não sei" },
          ]}
          aoMudar={setPrograma}
          dica="Sites do programa cobram os impostos na hora da compra."
        />
        <Escolha
          id={`${id}-icms`}
          rotulo="ICMS do seu estado"
          valor={icms}
          opcoes={ICMS}
          aoMudar={setIcms}
          dica="Vai de 17% a 20%. Na dúvida, veja no fechamento da compra."
        />
      </div>

      <div className="mt-6">
        {r ? (
          <Resultado r={r} endereco={endereco} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o valor da compra e a cotação do dólar para ver os impostos.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {r ? `Impostos estimados: ${reais(r.impostos)}. Total: ${reais(r.total)}.` : ""}
        </p>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com as regras da Receita Federal em vigor desde 12/05/2026, revisadas em
        21/10/2026, para compras de pessoa física até US$ 3 mil. O valor final depende da
        cotação usada na declaração e da alíquota de ICMS do seu estado.
      </p>
    </section>
  );
}

function Resultado({ r, endereco }: { r: ResultadoDaImportacao; endereco: string }) {
  const nomeDaFaixa = {
    "ate-50": "até US$ 50 no Remessa Conforme: imposto federal zero",
    "acima-de-50": "acima de US$ 50 no Remessa Conforme: 60% menos US$ 30",
    "fora-do-programa": "site fora do Remessa Conforme: 60%, sem desconto",
  }[r.faixa];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Impostos da compra</p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.impostos)}</p>
          <p className="mt-1 text-sm text-muted">
            Compra de {dolares(r.valorEmCentavosDeDolar)}: {nomeDaFaixa}.
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha nome="Valor da compra" valor={reais(r.valor)} />
          <Linha
            nome={`Imposto de importação (${r.aliquotaPorMil / 10}%${r.desconto ? " menos US$ 30" : ""})`}
            valor={reais(r.impostoDeImportacao)}
          />
          <Linha nome="ICMS (estadual)" valor={reais(r.icms)} />
          <Linha nome="Total com impostos" valor={reais(r.total)} destaque />
        </dl>
      </div>

      <ul className="space-y-2 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
        <li>
          Os impostos somam {(r.pesoDosImpostosPorMil / 10).toLocaleString("pt-BR")}% do valor da compra.
        </li>
        {r.faixa === "acima-de-50" && (
          <li>
            Passou de US$ 50: se der para separar em compras menores de verdade, cada uma até
            US$ 50 paga só o ICMS. A lei permite ao governo barrar a divisão artificial de
            pedidos.
          </li>
        )}
        {r.faixa === "fora-do-programa" && (
          <li>
            Fora do Remessa Conforme, os impostos são cobrados quando o pacote chega ao Brasil,
            antes da entrega, pelos Correios ou pela transportadora. Eles podem cobrar também um
            serviço pelo despacho, que não é imposto e não entra nesta conta.
          </li>
        )}
        <li>
          No cartão de crédito, a compra cobrada em moeda estrangeira tem também IOF e o
          câmbio do banco, que não entram nesta conta.
        </li>
      </ul>

      <details className="group rounded-xl border border-border bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Entenda a conta
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <ol className="list-decimal space-y-2 border-t border-border py-4 pl-9 pr-4 text-sm leading-6 tabular-nums">
          <li>
            <strong>Valor da compra:</strong> {reais(r.valor)} = {dolares(r.valorEmCentavosDeDolar)}.
          </li>
          <li>
            <strong>Imposto de importação:</strong>{" "}
            {r.aliquotaPorMil === 0
              ? "alíquota zero até US$ 50 em site do Remessa Conforme."
              : `${r.aliquotaPorMil / 10}% de ${reais(r.valor)} = ${reais(r.impostoDeImportacaoBruto)}${
                  r.desconto ? ` − ${reais(r.desconto)} (US$ ${P.remessaConforme.descontoEmDolares})` : ""
                } = ${reais(r.impostoDeImportacao)}.`}
          </li>
          <li>
            <strong>ICMS &quot;por dentro&quot;:</strong> ({reais(r.valor)} + {reais(r.impostoDeImportacao)}) ÷ (1 −
            alíquota) = {reais(r.baseDoIcms)} de base; × alíquota = {reais(r.icms)}.
          </li>
          <li>
            <strong>Total:</strong> {reais(r.valor)} + {reais(r.impostos)} = {reais(r.total)}.
          </li>
        </ol>
        <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted">
          Fórmulas da Receita Federal (Portal Compras Internacionais, &quot;Novas Regras&quot;). Cada
          etapa é arredondada ao centavo.
        </p>
      </details>
      <Compartilhar
        texto={[
          "Simulação de imposto de compra internacional (regras de 12/05/2026)",
          `Compra: ${reais(r.valor)} (${dolares(r.valorEmCentavosDeDolar)})`,
          `Imposto de importação: ${reais(r.impostoDeImportacao)} · ICMS: ${reais(r.icms)}`,
          `Total com impostos: ${reais(r.total)}`,
          `Calculado em ${endereco}`,
        ].join("\n")}
      />
    </div>
  );
}

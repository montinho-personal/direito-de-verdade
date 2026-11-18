"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Campo, Linha } from "@/components/partes-da-calculadora";
import { calcularAuxilioDoenca, tetoDoInss, type AvisoDoAuxilio } from "@/lib/auxilio-doenca/valor";
import { lerReais, reais } from "@/lib/dinheiro";
import { PARAMETROS_2026 } from "@/lib/tributos/parametros-2026.ts";

const TEXTO_DO_AVISO: Record<AvisoDoAuxilio, string> = {
  piso: `91% da sua média dá menos que o salário mínimo: o auxílio-doença fica em ${reais(PARAMETROS_2026.salarioMinimo)}, o piso de 2026.`,
  "limite-12":
    "O valor ficou limitado à média dos seus 12 últimos salários de contribuição, porque ela é menor que 91% da média geral (Lei 8.213, artigo 29, § 10).",
  teto: `A sua média passou do teto do INSS (${reais(tetoDoInss())}): o cálculo usa o teto, e o auxílio-doença fica no máximo de 2026.`,
};

// Auxílio-doença: 91% do salário de benefício, com o limite dos 12 últimos, o piso e o teto
export function CalculadoraAuxilioDoenca({ nivelDoTitulo = 2 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [media, setMedia] = useState("");
  const [media12, setMedia12] = useState("");

  const leituraDaMedia = lerReais(media);
  const leituraDos12 = lerReais(media12);
  const erros = {
    media: leituraDaMedia.tipo === "invalido" ? leituraDaMedia.mensagem : undefined,
    media12: leituraDos12.tipo === "invalido" ? leituraDos12.mensagem : undefined,
  };

  const resultado =
    leituraDaMedia.tipo === "valido" && leituraDaMedia.centavos > 0 && !erros.media12
      ? calcularAuxilioDoenca({
          mediaGeral: leituraDaMedia.centavos,
          mediaDos12: leituraDos12.tipo === "valido" ? leituraDos12.centavos : null,
        })
      : null;

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule o valor do auxílio-doença em 2026
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-media`}
          rotulo="Média dos seus salários de contribuição (R$)"
          dica="A média de todos os salários desde julho de 1994, corrigidos. Sem esse número, use o salário dos últimos anos como estimativa."
          exemplo="Ex.: 3.200,00"
          valor={media}
          aoMudar={setMedia}
          erro={erros.media}
        />
        <Campo
          id={`${id}-media12`}
          rotulo="Média dos 12 últimos salários (R$, opcional)"
          dica="Some os 12 últimos salários de contribuição e divida por 12. Em branco, a calculadora não aplica esse limite."
          exemplo="Ex.: 3.000,00"
          valor={media12}
          aoMudar={setMedia12}
          erro={erros.media12}
        />
      </div>

      <div aria-live="polite" className="mt-6">
        {resultado ? (
          <>
            <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
              <Linha nome="Salário de benefício" valor={reais(resultado.salarioDeBeneficio)} />
              <Linha nome="91% do salário de benefício" valor={reais(resultado.noventaEUmPorCento)} />
              {resultado.limiteDos12 !== null && (
                <Linha nome="Limite: média dos 12 últimos" valor={reais(resultado.limiteDos12)} />
              )}
              <Linha nome="Auxílio-doença por mês (estimativa)" valor={reais(resultado.valor)} destaque />
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
            Digite a média dos seus salários de contribuição para ver o valor estimado.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com as regras e os valores de 2026: salário mínimo de{" "}
        {reais(PARAMETROS_2026.salarioMinimo)} e teto do INSS de {reais(tetoDoInss())}. O valor
        exato sai na carta de concessão do INSS, com os salários corrigidos do seu cadastro (CNIS).
        Os requisitos para ter direito estão em{" "}
        <Link href="/artigos/auxilio-doenca" className="text-accent underline underline-offset-2">
          auxílio-doença 2026: quem tem direito e como pedir
        </Link>
        .
      </p>
    </section>
  );
}

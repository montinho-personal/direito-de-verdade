"use client";

// Modalidade 4: quanto vou receber de multa do FGTS
import Link from "next/link";
import { useEffect, useState } from "react";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { calcularMulta, type Motivo } from "@/lib/fgts/multa.ts";
import { type ResultadoDoSaldo, simularSaldo } from "@/lib/fgts/saldo.ts";
import { paraTexto } from "@/lib/trabalhista/datas.ts";
import { aviso, Caixinha, type Contrato, caixa, Destaque, Detalhes, lista, link, NOME_DO_VINCULO, Vazio } from "./comum";

const MOTIVOS: { valor: Motivo; nome: string }[] = [
  { valor: "sem-justa-causa", nome: "Demissão sem justa causa (ou rescisão indireta)" },
  { valor: "acordo", nome: "Acordo com a empresa (art. 484-A da CLT)" },
  { valor: "culpa-reciproca", nome: "Culpa recíproca ou força maior (reconhecida pela Justiça)" },
  { valor: "termo-antecipado", nome: "Contrato a prazo encerrado antes pela empresa" },
  { valor: "termo-normal", nome: "Fim do contrato a prazo (experiência, temporário)" },
  { valor: "pedido", nome: "Pedido de demissão" },
  { valor: "justa-causa", nome: "Justa causa" },
];

// Resumo curto (cabe na linha do resultado) e a explicação completa
const SAQUE = {
  tudo: "Saldo + multa",
  "80%": "80% + multa",
  "so-multa": "Só a multa",
  nada: "Nada agora",
} as const;
const SAQUE_EXPLICADO = {
  tudo: "Saca todo o saldo da conta deste contrato, mais a multa.",
  "80%": "Saca até 80% dos depósitos, mais a multa; o resto fica na conta.",
  "so-multa": "Saca só a multa; o saldo fica bloqueado na conta.",
  nada: "Não saca nada agora; o saldo fica na conta, rendendo.",
} as const;

export function ModoMulta({
  idBase,
  contrato,
  estimativa,
  registrar,
  resumoBase,
}: {
  idBase: string;
  contrato: Contrato;
  estimativa: { r: ResultadoDoSaldo | null; fim: string; encerrado: boolean };
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
}) {
  const [motivo, setMotivo] = useState<Motivo>("sem-justa-causa");
  const [base, setBase] = useState("");
  const [rescisao, setRescisao] = useState("");
  const [saldo, setSaldo] = useState("");
  const [indenizacao, setIndenizacao] = useState("");
  const [aniversario, setAniversario] = useState(false);

  const domestico = contrato.vinculo === "domestico";
  const leituras = { base: lerReais(base), rescisao: lerReais(rescisao), saldo: lerReais(saldo), indenizacao: lerReais(indenizacao) };
  const erros: Record<string, string> = {};
  for (const [k, l] of Object.entries(leituras)) if (l.tipo === "invalido") erros[k] = l.mensagem;
  // Sem a simulação do saldo aberta, estima da admissão até hoje
  const propria =
    !estimativa.r && contrato.salario > 0 && contrato.admissao
      ? simularSaldo({ vinculo: contrato.vinculo, admissao: contrato.admissao, fim: paraTexto(contrato.hoje), salario: contrato.salario })
      : null;
  const estimada = estimativa.r ?? (propria?.ok ? propria : null);
  const baseUsada = leituras.base.tipo === "valido" ? leituras.base.centavos : (estimada?.baseDaMulta ?? null);
  const indenizacaoUsada =
    leituras.indenizacao.tipo === "valido" ? leituras.indenizacao.centavos : (estimada?.indenizacaoDomestico ?? null);
  const origem = leituras.base.tipo === "valido" ? "informada" : "estimada";

  const calculo =
    !Object.keys(erros).length && (domestico ? indenizacaoUsada !== null : baseUsada !== null)
      ? calcularMulta({
          vinculo: contrato.vinculo,
          motivo,
          base: baseUsada ?? 0,
          depositosDaRescisao: leituras.rescisao.tipo === "valido" ? leituras.rescisao.centavos : 0,
          saldoAtual: leituras.saldo.tipo === "valido" ? leituras.saldo.centavos : undefined,
          indenizacaoDomestico: indenizacaoUsada ?? 0,
          saqueAniversario: aniversario,
        })
      : null;
  const r = calculo?.ok ? calculo : null;
  useEffect(() => {
    if (r) registrar("fgts_multa_calculada", { motivo });
  }, [Boolean(r), motivo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Escolha id={`${idBase}-motivo`} rotulo="Como o contrato terminou?" valor={motivo} opcoes={MOTIVOS} aoMudar={setMotivo} />
        </div>
        {domestico ? (
          <Campo
            id={`${idBase}-indenizacao`}
            rotulo="Saldo dos 3,2% de indenização (R$, opcional)"
            exemplo={estimada ? reais(estimada.indenizacaoDomestico).replace("R$", "").trim() : "Ex.: 1.500,00"}
            valor={indenizacao}
            aoMudar={setIndenizacao}
            erro={erros.indenizacao}
            dica="Está no extrato, em conta separada. Sem ele, usamos a estimativa do saldo acumulado."
          />
        ) : (
          <Campo
            id={`${idBase}-base`}
            rotulo="Valor para fins rescisórios do extrato (R$)"
            exemplo={estimada ? reais(estimada.baseDaMulta).replace("R$", "").trim() : "Ex.: 12.000,00"}
            valor={base}
            aoMudar={setBase}
            erro={erros.base}
            dica="Se o extrato mostrar; se não, some ao saldo o que você sacou durante o contrato. Em branco, usamos uma estimativa."
          />
        )}
        {!domestico && (
          <Campo
            id={`${idBase}-rescisao`}
            rotulo="Depósitos da rescisão que ainda não aparecem (R$, opcional)"
            exemplo="Ex.: 400,00"
            valor={rescisao}
            aoMudar={setRescisao}
            erro={erros.rescisao}
            dica="8% do último salário, do aviso prévio e do 13º proporcional."
          />
        )}
        <Campo
          id={`${idBase}-saldo-atual`}
          rotulo="Saldo atual da conta deste contrato (R$, opcional)"
          exemplo="Ex.: 10.500,00"
          valor={saldo}
          aoMudar={setSaldo}
          erro={erros.saldo}
          dica="Para mostrar quanto dá para sacar."
        />
      </div>
      <Caixinha rotulo="Aderi ao saque-aniversário" marcado={aniversario} aoMudar={setAniversario} />

      {r ? (
        <div className="space-y-4">
          <div className={caixa}>
            {domestico ? (
              <Destaque
                rotulo="Indenização do doméstico (3,2%) que fica com você"
                valor={reais(r.indenizacaoDomestico!.paraOEmpregado)}
                detalhe={
                  r.indenizacaoDomestico!.destinoIncerto
                    ? "No acordo, a lei do doméstico não diz para quem vão os 3,2%."
                    : r.indenizacaoDomestico!.paraOEmpregador
                      ? `${reais(r.indenizacaoDomestico!.paraOEmpregador)} voltam ao empregador.`
                      : undefined
                }
              />
            ) : (
              <Destaque
                rotulo="Multa rescisória estimada"
                valor={reais(r.multa)}
                detalhe={r.percentualPorMil ? `${percentualPorMil(r.percentualPorMil)} sobre ${reais(r.base)}.` : "Neste tipo de saída não há multa do FGTS."}
              />
            )}
            <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
              {!domestico && (
                <>
                  <Linha nome={`Base de cálculo (${origem})`} valor={reais(r.base)} />
                  <Linha nome="Percentual" valor={percentualPorMil(r.percentualPorMil)} />
                  <Linha nome="Multa" valor={reais(r.multa)} destaque />
                </>
              )}
              <Linha nome="O que dá para sacar" valor={SAQUE[r.saque]} />
              {r.valorSacavel !== null && <Linha nome="Valor que pode ser sacado (estimado)" valor={reais(r.valorSacavel)} destaque />}
            </dl>
          </div>
          <p className="text-sm leading-6">{SAQUE_EXPLICADO[r.saque]}</p>
          {(r.restricoes.length > 0 || origem === "estimada") && (
            <ul className={aviso}>
              {origem === "estimada" && !domestico && (
                <li>
                  A base veio da simulação do saldo (salários informados, juros de 3% ao ano, sem a TR). Para a conta exata,
                  use o valor para fins rescisórios do extrato.
                </li>
              )}
              {r.restricoes.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <Detalhes titulo="Como chegamos a esse valor?">
            <p>
              A multa é calculada sobre todos os depósitos do contrato, corrigidos e com juros, inclusive o que já foi
              sacado (Lei 8.036, art. 18, § 1º). Não é sobre o saldo de hoje: quem sacou pelo saque-aniversário ou para
              comprar imóvel recebe a multa também sobre esses valores. A distribuição de lucros do FGTS não entra.
            </p>
            <p className="mt-2">
              A empresa deposita a multa na conta do FGTS em até 10 dias depois do fim do contrato, junto com o FGTS da
              rescisão. O saque é pedido pelo app FGTS.
            </p>
          </Detalhes>
          <ul className={lista}>
            <li>
              O acerto completo, com aviso prévio, 13º e férias, está na{" "}
              <Link href="/calculadoras/rescisao" className={link}>
                calculadora de rescisão
              </Link>
              .
            </li>
          </ul>
          <Compartilhar
            texto={resumoBase([
              `Multa rescisória do FGTS: ${MOTIVOS.find((m) => m.valor === motivo)!.nome}`,
              `Vínculo: ${NOME_DO_VINCULO[contrato.vinculo]}`,
              domestico
                ? `Indenização do doméstico (3,2%): ${reais(r.indenizacaoDomestico!.valor)}; fica com o empregado: ${reais(r.indenizacaoDomestico!.paraOEmpregado)}`
                : `Base (${origem}): ${reais(r.base)} × ${percentualPorMil(r.percentualPorMil)} = ${reais(r.multa)}`,
              `Saque: ${SAQUE_EXPLICADO[r.saque]}${r.valorSacavel !== null ? ` (${reais(r.valorSacavel)})` : ""}`,
              ...r.restricoes,
            ])}
            aoCompartilhar={(canal) => registrar("fgts_resultado_compartilhado", { canal, modo: "multa" })}
          />
        </div>
      ) : (
        <Vazio>
          {domestico
            ? "Digite o saldo dos 3,2% ou preencha o salário e a admissão acima para estimar."
            : "Digite o valor para fins rescisórios do extrato, ou preencha o salário e a admissão acima para estimar."}
        </Vazio>
      )}
    </div>
  );
}

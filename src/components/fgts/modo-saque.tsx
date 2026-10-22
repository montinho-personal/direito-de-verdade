"use client";

// Modalidade 5: posso sacar meu FGTS?
import { useEffect, useState } from "react";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { MESES } from "@/lib/fgts/competencias.ts";
import { HIPOTESES, janelaDoSaqueAniversario, retornoAoSaqueRescisao, saqueAniversario, type Situacao } from "@/lib/fgts/saque.ts";
import { aviso, type Contrato, caixa, dataBr, Destaque, Detalhes, lista, link, Pilulas } from "./comum";

type Opcao = "nao" | "sim" | "nao-sei";

export function ModoSaque({
  idBase,
  contrato,
  registrar,
  resumoBase,
}: {
  idBase: string;
  contrato: Contrato;
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
}) {
  const [situacao, setSituacao] = useState<Situacao>("sem-justa-causa");
  const [aderiu, setAderiu] = useState<Opcao>("nao");
  const [saldo, setSaldo] = useState("");
  const [mesDoAniversario, setMesDoAniversario] = useState(String(contrato.hoje.mes));

  const h = HIPOTESES.find((x) => x.situacao === situacao)!;
  const leitura = lerReais(saldo);
  const centavos = leitura.tipo === "valido" ? leitura.centavos : null;
  const anual = centavos !== null ? saqueAniversario(centavos) : null;
  const mes = Number(mesDoAniversario);
  const anoDaJanela = mes >= contrato.hoje.mes ? contrato.hoje.ano : contrato.hoje.ano + 1;
  const janela = janelaDoSaqueAniversario(anoDaJanela, mes);
  const retorno = retornoAoSaqueRescisao({ ano: contrato.hoje.ano, mes: contrato.hoje.mes });
  const comAniversario = aderiu === "sim";

  useEffect(() => {
    registrar("fgts_saque_consultado", { situacao, saque_aniversario: aderiu });
  }, [situacao, aderiu]); // eslint-disable-line react-hooks/exhaustive-deps

  const libera = comAniversario ? h.liberaNoAniversario : h.liberaNaRescisao;
  const resposta =
    libera === "sim" ? "Sim" : libera === "nao" ? "Não, por enquanto" : libera === "so-multa" ? "Só a multa" : "Em parte";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Escolha
            id={`${idBase}-situacao`}
            rotulo="Qual é a sua situação?"
            valor={situacao}
            opcoes={HIPOTESES.map((x) => ({ valor: x.situacao, nome: x.nome }))}
            aoMudar={setSituacao}
          />
        </div>
        <div className="sm:col-span-2">
          <Pilulas
            nome={`${idBase}-aderiu`}
            legenda="Você aderiu ao saque-aniversário?"
            valor={aderiu}
            opcoes={[
              { valor: "nao", nome: "Não" },
              { valor: "sim", nome: "Sim" },
              { valor: "nao-sei", nome: "Não sei" },
            ]}
            aoMudar={setAderiu}
          />
        </div>
        <Campo
          id={`${idBase}-saldo-saque`}
          rotulo="Saldo total do FGTS (R$, opcional)"
          exemplo="Ex.: 1.000,00"
          valor={saldo}
          aoMudar={setSaldo}
          erro={leitura.tipo === "invalido" ? leitura.mensagem : undefined}
          dica="Soma de todas as contas, no app FGTS."
        />
        <Escolha
          id={`${idBase}-mes-aniversario`}
          rotulo="Mês do seu aniversário"
          valor={mesDoAniversario}
          opcoes={MESES.map((nome, i) => ({ valor: String(i + 1), nome }))}
          aoMudar={setMesDoAniversario}
        />
      </div>

      <div className={caixa}>
        <Destaque rotulo="Posso sacar?" valor={resposta} detalhe={`Lei 8.036/1990, ${h.base}.`} />
        <div className="space-y-2 border-t border-border px-4 py-4 text-sm leading-6">
          {aderiu === "nao-sei" ? (
            <>
              <p>
                <strong>Sem o saque-aniversário (regra padrão):</strong> {h.saqueRescisao}
              </p>
              <p>
                <strong>Com o saque-aniversário:</strong> {h.saqueAniversario}
              </p>
              <p className="text-muted">Para saber em qual você está, veja &quot;Modalidade de saque&quot; no app FGTS.</p>
            </>
          ) : (
            <p>{comAniversario ? h.saqueAniversario : h.saqueRescisao}</p>
          )}
          {h.requisitos && <p className="text-muted">{h.requisitos}</p>}
        </div>
      </div>

      {aderiu !== "nao" && anual && anual.valor > 0 && (
        <div className={caixa}>
          <dl className="divide-y divide-border text-sm sm:text-base">
            <Linha nome="Saldo informado" valor={reais(anual.saldo)} />
            <Linha nome={`Alíquota da faixa`} valor={percentualPorMil(anual.aliquotaPorMil)} />
            <Linha nome="Parcela adicional" valor={reais(anual.adicional)} />
            <Linha nome="Saque-aniversário estimado" valor={reais(anual.valor)} destaque />
            <Linha nome="Pode sacar" valor={`de ${dataBr(janela.inicio)} a ${dataBr(janela.fim)}`} />
          </dl>
        </div>
      )}

      <ul className={lista}>
        <li>
          <strong>Saldo existente não é saldo liberado.</strong> O saldo é o que está na conta; o valor sacável depende da
          situação; o liberado é o que a Caixa aprova depois de conferir os documentos.
        </li>
        {aderiu !== "nao" && (
          <li>
            Para voltar ao saque-rescisão, o pedido vale no 1º dia do 25º mês seguinte: pedindo agora, a partir de{" "}
            {dataBr(retorno)}, se não houver antecipação em aberto (Lei 8.036, art. 20-C).
          </li>
        )}
        <li>
          <strong>Não há liberação extraordinária em vigor em outubro de 2026.</strong> As duas medidas provisórias que
          liberaram o saldo bloqueado de quem foi demitido no saque-aniversário (MP 1.290/2025 e MP 1.331/2025)
          encerraram. Desconfie de mensagens que prometem &quot;FGTS liberado&quot; e peçam dados ou pagamentos.
        </li>
      </ul>

      <Detalhes titulo="Antecipação do saque-aniversário é empréstimo">
        <p>
          A &quot;antecipação&quot; oferecida por bancos é um empréstimo com juros: o banco recebe os saques anuais
          futuros, que ficam bloqueados na conta. Enquanto houver antecipação em aberto, não dá para voltar ao
          saque-rescisão. Pelas regras em vigor desde novembro de 2025, dá para antecipar de R$ 100 a R$ 500 por saque
          anual, só 90 dias depois da adesão, e até 5 saques anuais até 31 de outubro de 2026; a partir de 1º de novembro
          de 2026, no máximo 3 (
          <a href="https://www.fgts.gov.br/Paginas/trabalhador/saque/saque-aniversario.aspx" className={link} rel="noopener noreferrer" target="_blank">
            FGTS
          </a>
          ).
        </p>
      </Detalhes>

      {aderiu !== "nao" && anual && anual.valor > 0 && (
        <ul className={aviso}>
          <li>
            O valor exato sai do saldo no dia do débito, somando todas as contas. As faixas são as do Anexo da Lei
            8.036, sem mudança publicada para 2027 até {dataBr(contrato.hoje)}.
          </li>
        </ul>
      )}

      <Compartilhar
        texto={resumoBase([
          `Posso sacar o FGTS? ${h.nome}`,
          `Saque-aniversário: ${aderiu === "sim" ? "sim" : aderiu === "nao" ? "não" : "não sei"}`,
          `Resposta: ${resposta}. ${comAniversario ? h.saqueAniversario : h.saqueRescisao} (Lei 8.036, ${h.base})`,
          ...(anual && aderiu !== "nao" && anual.valor > 0 ? [`Saque-aniversário estimado: ${reais(anual.valor)}, de ${dataBr(janela.inicio)} a ${dataBr(janela.fim)}`] : []),
        ])}
        aoCompartilhar={(canal) => registrar("fgts_resultado_compartilhado", { canal, modo: "saque" })}
      />
    </div>
  );
}

"use client";

// O que a pessoa digitou na calculadora de rescisão, guardado num só lugar da página
// para o comparador de modalidades e a conferência do TRCT usarem os mesmos dados
// sem pedir tudo de novo. Fica só na memória do navegador: nada é enviado nem salvo.
import { useSyncExternalStore } from "react";
import { lerQuantidade, lerReais } from "@/lib/dinheiro";
import type { Aviso, EntradaDaRescisao, Motivo } from "@/lib/trabalhista/rescisao.ts";

export type Formulario = {
  motivo: Motivo;
  salario: string;
  admissao: string;
  saida: string;
  avisoEmpresa: "indenizado" | "trabalhado";
  avisoPedido: "trabalhado" | "parcial" | "nao-cumprido" | "dispensado";
  diasCumpridos: string;
  feriasVencidas: string; // "0", "1" ou "2"
  fgts: string;
  mediaVariaveis: string;
  adiantamento13: string;
  outrosDescontos: string;
  dependentes: string;
  saldoAtualDoFgts: string;
  saqueAniversario: boolean;
};

const INICIAL: Formulario = {
  motivo: "sem-justa-causa",
  salario: "",
  admissao: "",
  saida: "",
  avisoEmpresa: "indenizado",
  avisoPedido: "trabalhado",
  diasCumpridos: "",
  feriasVencidas: "0",
  fgts: "",
  mediaVariaveis: "",
  adiantamento13: "",
  outrosDescontos: "",
  dependentes: "",
  saldoAtualDoFgts: "",
  saqueAniversario: false,
};

let atual = INICIAL;
const ouvintes = new Set<() => void>();

export function mudarFormulario(mudanca: Partial<Formulario>) {
  atual = { ...atual, ...mudanca };
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useFormulario() {
  return useSyncExternalStore(
    assinar,
    () => atual,
    () => INICIAL,
  );
}

export type CampoComErro = keyof Formulario;

// Converte o formulário na entrada do motor. Erros de digitação ficam por campo; os
// erros de regra (datas trocadas, férias demais) vêm do próprio motor.
export function lerFormulario(f: Formulario): {
  entrada: EntradaDaRescisao | null;
  erros: Partial<Record<CampoComErro, string>>;
} {
  const erros: Partial<Record<CampoComErro, string>> = {};
  const reaisOuNada = (campo: CampoComErro, texto: string) => {
    const leitura = lerReais(texto);
    if (leitura.tipo === "invalido") erros[campo] = leitura.mensagem;
    return leitura.tipo === "valido" ? leitura.centavos : undefined;
  };
  const salario = reaisOuNada("salario", f.salario);
  const fgts = reaisOuNada("fgts", f.fgts);
  const media = reaisOuNada("mediaVariaveis", f.mediaVariaveis);
  const adiantamento = reaisOuNada("adiantamento13", f.adiantamento13);
  const outros = reaisOuNada("outrosDescontos", f.outrosDescontos);
  const saldoAtual = reaisOuNada("saldoAtualDoFgts", f.saldoAtualDoFgts);
  const dependentes = lerQuantidade(f.dependentes, 20);
  if (dependentes.tipo === "invalido") erros.dependentes = dependentes.mensagem;
  const dias = lerQuantidade(f.diasCumpridos, 29);
  if (dias.tipo === "invalido") erros.diasCumpridos = dias.mensagem;

  const aviso: Aviso | undefined =
    f.motivo === "pedido" ? f.avisoPedido : f.motivo === "justa-causa" ? undefined : f.avisoEmpresa;
  const multa = f.motivo === "sem-justa-causa" || f.motivo === "acordo";
  if (!f.salario || !f.admissao || !f.saida || Object.keys(erros).length) {
    return { entrada: null, erros };
  }
  return {
    entrada: {
      motivo: f.motivo,
      salario: salario ?? 0,
      admissao: f.admissao,
      saida: f.saida,
      aviso,
      diasDeAvisoCumpridos: dias.tipo === "valido" ? dias.quantidade : 0,
      feriasVencidas: Number(f.feriasVencidas),
      fgtsParaFinsRescisorios: multa ? fgts : undefined,
      mediaVariaveis: media,
      adiantamento13: adiantamento,
      outrosDescontos: outros,
      dependentes: dependentes.tipo === "valido" ? dependentes.quantidade : 0,
      saldoAtualDoFgts: f.motivo === "sem-justa-causa" ? saldoAtual : undefined,
      saqueAniversario: f.motivo === "sem-justa-causa" && f.saqueAniversario,
    },
    erros,
  };
}

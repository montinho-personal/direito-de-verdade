"use client";

// O que a pessoa digitou na calculadora do 13º, num só lugar da página, para a
// conferência e o comparador usarem os mesmos dados. Fica só no navegador.
import { useSyncExternalStore } from "react";
import { lerQuantidade, lerReais } from "@/lib/dinheiro";
import type { EntradaDo13 } from "@/lib/trabalhista/decimo-terceiro.ts";

export const NOMES_DOS_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export type Formulario13 = {
  salario: string;
  meses: string;
  mediaVariaveis: string;
  dependentes: string;
  admissao: string;
  saida: string;
  mesDoAdiantamento: string;
  adiantamentoRecebido: string;
  novoSalario: string;
  mesDoReajuste: string;
  usarMensais: boolean;
  mensais: string[];
  pensao: string;
  mesesComFaltas: string;
  mesesAfastadoPeloInss: string;
};

const INICIAL: Formulario13 = {
  salario: "",
  meses: "12",
  mediaVariaveis: "",
  dependentes: "",
  admissao: "",
  saida: "",
  mesDoAdiantamento: "11",
  adiantamentoRecebido: "",
  novoSalario: "",
  mesDoReajuste: "",
  usarMensais: false,
  mensais: Array(12).fill(""),
  pensao: "",
  mesesComFaltas: "",
  mesesAfastadoPeloInss: "",
};

let atual = INICIAL;
const ouvintes = new Set<() => void>();

export function mudarFormulario13(mudanca: Partial<Formulario13>) {
  atual = { ...atual, ...mudanca };
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useFormulario13() {
  return useSyncExternalStore(assinar, () => atual, () => INICIAL);
}

export type Erros13 = Partial<Record<keyof Formulario13 | `mensal-${number}`, string>>;

export function lerFormulario13(f: Formulario13): { entrada: EntradaDo13 | null; erros: Erros13 } {
  const erros: Erros13 = {};
  const reais = (campo: keyof Formulario13, texto: string) => {
    const leitura = lerReais(texto);
    if (leitura.tipo === "invalido") erros[campo] = leitura.mensagem;
    return leitura.tipo === "valido" ? leitura.centavos : undefined;
  };
  const quantidade = (campo: keyof Formulario13, texto: string, maximo: number) => {
    const leitura = lerQuantidade(texto, maximo);
    if (leitura.tipo === "invalido") erros[campo] = leitura.mensagem;
    return leitura.tipo === "valido" ? leitura.quantidade : 0;
  };
  const salario = reais("salario", f.salario);
  const media = reais("mediaVariaveis", f.mediaVariaveis);
  const adiantamento = reais("adiantamentoRecebido", f.adiantamentoRecebido);
  const novoSalario = reais("novoSalario", f.novoSalario);
  const pensao = reais("pensao", f.pensao);
  const dependentes = quantidade("dependentes", f.dependentes, 20);
  const faltas = quantidade("mesesComFaltas", f.mesesComFaltas, 11);
  const afastado = quantidade("mesesAfastadoPeloInss", f.mesesAfastadoPeloInss, 11);
  const mensais = f.usarMensais
    ? f.mensais.map((texto, i) => {
        const leitura = lerReais(texto);
        if (leitura.tipo === "invalido") erros[`mensal-${i}`] = leitura.mensagem;
        return leitura.tipo === "valido" ? leitura.centavos : null;
      })
    : undefined;
  if (novoSalario !== undefined && !f.mesDoReajuste) erros.mesDoReajuste = "Escolha o mês do reajuste.";

  if (!f.salario || Object.keys(erros).length) return { entrada: null, erros };
  return {
    entrada: {
      salario: salario ?? 0,
      meses: Number(f.meses),
      admissao: f.admissao || undefined,
      saida: f.saida || undefined,
      mediaVariaveis: f.usarMensais ? undefined : media,
      variaveisMensais: mensais,
      reajuste:
        novoSalario !== undefined && f.mesDoReajuste
          ? { salario: novoSalario, mes: Number(f.mesDoReajuste) }
          : undefined,
      mesDoAdiantamento: Number(f.mesDoAdiantamento),
      adiantamentoRecebido: adiantamento,
      dependentes,
      pensao,
      mesesComFaltas: faltas,
      mesesAfastadoPeloInss: afastado,
    },
    erros,
  };
}

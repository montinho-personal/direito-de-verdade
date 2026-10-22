"""Conta de referência das horas extras, escrita à parte do motor (TypeScript), direto
das regras: Constituição, art. 7º, XVI (50%); Súmula 146 do TST (domingo ou feriado sem
folga, em dobro); Súmula 264 (parcelas salariais na hora); divisor do TST (horas
semanais ÷ 6 × 30; Súmula 431); OJ 97 (adicional noturno na base da hora extra noturna);
CLT, art. 73 e LC 150, art. 14 (20% e hora de 52min30s); Lei 5.889, art. 7º (rural: 25%);
Lei 605, art. 7º e Súmula 172 (DSR das horas habituais: horas extras ÷ dias úteis ×
repousos); OJ 394 (reflexo do DSR só para horas a partir de 20/03/2023); INSS e IR de 2026.
Usa frações exatas e arredonda ao centavo no fim. Gera tests/referencia/horas_extras.json.

    python3 tests/referencia/horas_extras.py
"""
import calendar
import json
from datetime import date
from fractions import Fraction as F
from pathlib import Path

from rescisao import inss  # tabela oficial de INSS de 2026
from decimo_terceiro import irrf  # IR mensal de 2026 com a redução da Lei 15.270


def arred(x):
    """Arredonda uma fração não negativa ao inteiro mais próximo, meio para cima."""
    x = F(x)
    return int((x * 2 + 1) // 2)


NOTURNO = {"urbano": (F(20, 100), True), "domestico": (F(20, 100), True), "rural": (F(25, 100), False)}


def dias_do_mes(ano, mes, feriados):
    dias = calendar.monthrange(ano, mes)[1]
    domingos = sum(1 for d in range(1, dias + 1) if date(ano, mes, d).weekday() == 6)
    return {"diasUteis": dias - domingos - feriados, "repousos": domingos + feriados}


def calcular(c):
    base = c["salario"] + c.get("adicionaisFixos", 0)
    divisor = c["divisor"]
    hora = F(base, divisor)
    ad_not, reduzida = NOTURNO[c.get("regime", "urbano")]
    ad_not = max(ad_not, F(c.get("adicionalNoturnoPorMil", 0), 1000))
    linhas = []
    for l in c["lancamentos"]:
        horas = F(l["minutos"], 60)
        valor_hora = hora * (1 + F(l["adicionalPorMil"], 1000))
        if l.get("noturna"):
            valor_hora *= 1 + ad_not
            if reduzida:
                horas = F(l["minutos"], F(105, 2))  # hora noturna de 52,5 minutos
        linhas.append(arred(valor_hora * horas))
    he = sum(linhas)
    dsr = 0
    if c.get("dsr"):
        dsr = arred(F(he) * c["dsr"]["repousos"] / c["dsr"]["diasUteis"])
    total = he + dsr
    ref = c.get("referencia")
    nova = ref is None or (ref["ano"], ref["mes"]) > (2023, 3)
    base_reflexo = total if nova else he
    return {
        "horaNormal": arred(hora),
        "linhas": linhas,
        "horasExtras": he,
        "dsr": dsr,
        "total": total,
        "decimoTerceiro": arred(F(base_reflexo, 12)),
        "ferias": arred(F(base_reflexo, 12) * F(4, 3)),
        "fgts": arred(F(base_reflexo) * F(8, 100)),
    }


def simular(salario, extra, dependentes=0):
    i0 = inss(salario)
    i1 = inss(salario + extra)
    ir0 = irrf(salario, i0, dependentes, 0)
    ir1 = irrf(salario + extra, i1, dependentes, 0)
    return {"aumentoBruto": extra, "aumentoLiquido": (salario + extra - i1 - ir1) - (salario - i0 - ir0),
            "diferencaInss": i1 - i0, "diferencaIrrf": ir1 - ir0}


def lanc(minutos, ad=500, noturna=False):
    return {"minutos": minutos, "adicionalPorMil": ad, "noturna": noturna}


casos = []


def caso(nome, entrada, simulacao=None):
    esperado = calcular(entrada)
    if simulacao is not None:
        esperado["simulacao"] = simular(entrada["salario"] + entrada.get("adicionaisFixos", 0), esperado["total"],
                                        simulacao)
        esperado["simulacao"]["dependentes"] = simulacao
    casos.append({"nome": nome, "entrada": entrada, "esperado": esperado})


nov26 = dias_do_mes(2026, 11, 2)  # 2/11 e 20/11 (15/11 cai no domingo)
dez26 = dias_do_mes(2026, 12, 1)  # 25/12
caso("salário mínimo de 2026, 10h a 50%", {"salario": 162100, "divisor": 220, "lancamentos": [lanc(600)]})
caso("salário mínimo, 1h a 100%", {"salario": 162100, "divisor": 220, "lancamentos": [lanc(60, 1000)]})
caso("R$ 2.200, 10h a 50% com DSR de novembro/2026",
     {"salario": 220000, "divisor": 220, "lancamentos": [lanc(600)], "dsr": nov26}, 0)
caso("R$ 2.200, 30 minutos a 50%", {"salario": 220000, "divisor": 220, "lancamentos": [lanc(30)]})
caso("R$ 3.000, 12h30 a 50% e 8h a 100%, DSR de dezembro/2026",
     {"salario": 300000, "divisor": 220, "lancamentos": [lanc(750), lanc(480, 1000)], "dsr": dez26}, 1)
caso("R$ 3.000 com 40 horas semanais (divisor 200)", {"salario": 300000, "divisor": 200, "lancamentos": [lanc(600)]})
caso("R$ 4.500, convenção de 70%, 6h47", {"salario": 450000, "divisor": 220, "lancamentos": [lanc(407, 700)]})
caso("R$ 2.500 + periculosidade de 30% na base", {"salario": 250000, "adicionaisFixos": 75000, "divisor": 220,
                                                  "lancamentos": [lanc(900)], "dsr": nov26}, 0)
caso("R$ 2.000, 2h noturnas a 50% (urbano, hora reduzida)",
     {"salario": 200000, "divisor": 220, "lancamentos": [lanc(120, 500, True)]})
caso("R$ 2.000, 2h noturnas a 50% (rural, 25%, sem hora reduzida)",
     {"salario": 200000, "divisor": 220, "regime": "rural", "lancamentos": [lanc(120, 500, True)]})
caso("R$ 1.800, doméstica, 3h noturnas com convenção de 30%",
     {"salario": 180000, "divisor": 220, "regime": "domestico", "adicionalNoturnoPorMil": 300,
      "lancamentos": [lanc(180, 500, True)]})
caso("R$ 7.000, 20h a 50%, DSR, simulação com 1 dependente",
     {"salario": 700000, "divisor": 220, "lancamentos": [lanc(1200)], "dsr": nov26}, 1)
caso("R$ 12.000, 15h a 50% e 4h a 100%",
     {"salario": 1200000, "divisor": 220, "lancamentos": [lanc(900), lanc(240, 1000)], "dsr": dez26}, 0)
caso("R$ 4.800, 36 horas (divisor 180)", {"salario": 480000, "divisor": 180, "lancamentos": [lanc(500)]})
caso("divisor 210 (42 horas, conta do TST sem texto oficial)",
     {"salario": 300000, "divisor": 210, "lancamentos": [lanc(600)]})
caso("horas de fevereiro/2023: reflexos sem o DSR (OJ 394 antiga)",
     {"salario": 250000, "divisor": 220, "lancamentos": [lanc(600)], "dsr": dias_do_mes(2023, 2, 2),
      "referencia": {"ano": 2023, "mes": 2}})
caso("horas de abril/2023: reflexos com o DSR (OJ 394 nova)",
     {"salario": 250000, "divisor": 220, "lancamentos": [lanc(600)], "dsr": dias_do_mes(2023, 4, 2),
      "referencia": {"ano": 2023, "mes": 4}})
caso("valores que exigem precisão: R$ 9.876,54, 1h07 noturna a 75%",
     {"salario": 987654, "adicionaisFixos": 12345, "divisor": 220, "lancamentos": [lanc(67, 750, True)]})

saida = Path(__file__).with_name("horas_extras.json")
saida.write_text(json.dumps(casos, ensure_ascii=False, indent=1) + "\n")
print(f"{len(casos)} casos em {saida}")

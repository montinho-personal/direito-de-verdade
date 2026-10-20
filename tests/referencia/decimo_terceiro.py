"""Conta de referência do 13º salário de 2026, escrita à parte do motor (TypeScript),
direto das regras do Decreto 10.854/2021 (arts. 76 a 82), da tabela do INSS e do IR de
2026 e da Lei 9.250 (art. 3º-A, § 3º). Gera tests/referencia/decimo_terceiro.json.

    python3 tests/referencia/decimo_terceiro.py
"""
import calendar
import json
from datetime import date
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path

from rescisao import inss, rd  # mesmas tabelas oficiais de INSS e IR de 2026

ANO = 2026


def irrf(rend, prev, dep=0, pensao=0):
    leg = prev + dep * 18959 + pensao
    base = max(0, rend - max(leg, 60720))
    faixas = [(242880, D("0"), 0), (282665, D("0.075"), 18216), (375105, D("0.15"), 39416),
              (466468, D("0.225"), 67549), (None, D("0.275"), 90873)]
    for teto, a, p in faixas:
        if teto is None or base <= teto:
            break
    tab = max(0, rd(base * a) - p)
    if rend <= 500000:
        red = tab
    elif rend <= 735000:
        red = max(0, rd(D(97862) - D("0.133145") * rend))
    else:
        red = 0
    return tab - min(red, tab)


def dias_por_mes(ini, fim):
    out = []
    for m in range(1, 13):
        p, u = date(ANO, m, 1), date(ANO, m, calendar.monthrange(ANO, m)[1])
        de, ate = max(p, ini), min(u, fim)
        out.append(max(0, (ate - de).days + 1))
    return out


def calcular(c):
    sal = c["salario"]
    if "admissao" in c or "saida" in c:
        adm = date.fromisoformat(c.get("admissao", f"{ANO}-01-01"))
        sai = date.fromisoformat(c.get("saida", f"{ANO}-12-31"))
        dias = dias_por_mes(max(adm, date(ANO, 1, 1)), min(sai, date(ANO, 12, 31)))
        saiu = sai < date(ANO, 12, 31)
        mes_base = sai.month if saiu else 12
    else:
        n = c.get("meses", 12)
        dias = [30 if m > 12 - n else 0 for m in range(1, 13)]
        saiu, mes_base = False, 12
    trab = [d >= 15 for d in dias]
    periodo = sum(trab)
    avos = periodo - c.get("mesesComFaltas", 0) - c.get("mesesAfastadoPeloInss", 0)

    def sal_mes(m):
        r = c.get("reajuste")
        return r["salario"] if r and m >= r["mes"] else sal

    sal_dez = sal_mes(mes_base)
    ajuste = None
    mensais = c.get("variaveisMensais")
    if mensais and any(v for v in mensais if v):
        ate = mes_base if saiu else 11
        vals = [(mensais[i] or 0) for i in range(ate) if trab[i]]
        media = rd(D(sum(vals)) / len(vals)) if vals else 0
        if not saiu and trab[11] and mensais[11] is not None:
            todos = [(mensais[i] or 0) for i in range(12) if trab[i]]
            media_ano = rd(D(sum(todos)) / len(todos))
            ajuste = rd(D((sal_dez + media_ano) * avos) / 12) - rd(D((sal_dez + media) * avos) / 12)
    else:
        media = c.get("mediaVariaveis", 0)
    rem = sal_dez + media
    bruto = rd(D(rem * avos) / 12)

    mes_pg = c.get("mesDoAdiantamento", 11)
    ano_todo = periodo == 12 and not c.get("mesesComFaltas") and not c.get("mesesAfastadoPeloInss")
    base1 = sal_mes(max(1, mes_pg - 1)) + media
    avos_pg = min(sum(1 for d in dias[:mes_pg] if d > 15), avos)
    proj = rd(D(base1) / 2) if ano_todo else rd(D(base1 * avos_pg) / 24)
    if "adiantamentoRecebido" in c:
        primeira = c["adiantamentoRecebido"]
    elif saiu and mes_base <= mes_pg:
        primeira = 0
    else:
        primeira = proj

    i13 = inss(bruto)
    pensao = c.get("pensao", 0)
    ir = irrf(bruto, i13, c.get("dependentes", 0), pensao)
    resto = bruto - primeira - i13 - ir - pensao
    return {"avos": avos, "bruto": bruto, "primeira": primeira, "inss": i13, "ir": ir,
            "segunda": max(0, resto), "liquido": primeira + max(0, resto), "ajuste": ajuste}


R = lambda x: int((D(str(x)) * 100).quantize(D("1"), ROUND_HALF_UP))  # noqa: E731
CASOS = [(f"ano todo, salário de R$ {s}", dict(salario=R(s))) for s in
         [1621, 2000, 3000, 5000, 5000.01, 5500, 6000, 7350, 7350.01, 8000, 8475.55, 8475.56, 10000, 2537.89]]
CASOS += [
    ("6 meses (admitido em julho)", dict(salario=R(3000), meses=6)),
    ("1 mês (dezembro): sem 1ª parcela", dict(salario=R(3000), meses=1)),
    ("admissão em 16/03 (16 dias em março)", dict(salario=R(4200), admissao="2026-03-16")),
    ("admissão em 17/03 (15 dias: conta no 13º, não no adiantamento)", dict(salario=R(4200), admissao="2026-03-17")),
    ("dependentes", dict(salario=R(8000), dependentes=2)),
    ("pensão alimentícia", dict(salario=R(8000), pensao=R(1000))),
    ("média de variáveis", dict(salario=R(4500), mediaVariaveis=R(800))),
    ("variáveis mês a mês, com ajuste de janeiro",
     dict(salario=R(3500), variaveisMensais=[R(x) for x in [400, 500, 0, 650, 700, 300, 450, 900, 520, 610, 480, 1500]])),
    ("variáveis mês a mês sem dezembro", dict(salario=R(3500), variaveisMensais=[R(400)] * 11 + [None])),
    ("reajuste em outubro (vale para as duas parcelas)", dict(salario=R(3000), reajuste={"salario": R(3300), "mes": 10})),
    ("reajuste em novembro (1ª parcela no salário antigo)", dict(salario=R(3000), reajuste={"salario": R(3300), "mes": 11})),
    ("1ª parcela recebida nas férias", dict(salario=R(6200), adiantamentoRecebido=R(2900))),
    ("faltas e afastamento pelo INSS", dict(salario=R(3000), mesesComFaltas=1, mesesAfastadoPeloInss=3)),
    ("saída em agosto (13º na rescisão)", dict(salario=R(5200), saida="2026-08-20")),
    ("adiantamento em junho, admissão em fevereiro", dict(salario=R(2800), admissao="2026-02-10", mesDoAdiantamento=6)),
]

if __name__ == "__main__":
    saida = [{"nome": n, "entrada": e, "esperado": calcular(e)} for n, e in CASOS]
    destino = Path(__file__).with_name("decimo_terceiro.json")
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(saida)} casos em {destino}")

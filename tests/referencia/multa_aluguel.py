"""Conta de referência da multa proporcional do aluguel (Lei 8.245/1991, art. 4º), escrita
à parte do motor (TypeScript): multa × tempo que falta ÷ prazo total, com o tempo em meses
e fração de mês (dias que sobram ÷ dias daquele mês do contrato). Mesmo dia do mês com
fim de mês curto: 31/01 + 1 mês = 28/02 (ou 29), como no calendário de contrato.

Gera tests/referencia/multa_aluguel.json:
    python3 tests/referencia/multa_aluguel.py
"""
import calendar
import json
from datetime import date
from decimal import Decimal as D, ROUND_HALF_UP
from fractions import Fraction
from pathlib import Path


def mais_meses(d, n):
    t = d.year * 12 + d.month - 1 + n
    a, m = divmod(t, 12)
    return date(a, m + 1, min(d.day, calendar.monthrange(a, m + 1)[1]))


def periodo(a, b):
    if b <= a:
        return 0, 0, 30, Fraction(0)
    k = 0
    while mais_meses(a, k + 1) <= b:
        k += 1
    base, prox = mais_meses(a, k), mais_meses(a, k + 1)
    dias, dm = (b - base).days, (prox - base).days
    return k, dias, dm, k + Fraction(dias, dm)


def rd(fr):
    return int(D(fr.numerator) / D(fr.denominator).quantize(D("1"), ROUND_HALF_UP) if False else (D(fr.numerator) / D(fr.denominator)).quantize(D("1"), ROUND_HALF_UP))


CASOS = [
    ("exemplo do prompt: 2.000, 3 aluguéis, 30 meses, 20 cumpridos", 200_000, 6_000_00, "2024-01-10", "2026-07-10", "2025-09-10"),
    ("artigo: 1.500, 3 aluguéis, 30 meses, saída com 12", 150_000, 4_500_00, "2025-03-01", "2027-09-01", "2026-03-01"),
    ("mês incompleto: 15 dias de um mês de 30", 300_000, 9_000_00, "2026-04-01", "2028-10-01", "2026-04-16"),
    ("início em 31/01: fim de mês curto", 250_000, 7_500_00, "2025-01-31", "2027-07-31", "2026-02-28"),
    ("saída no primeiro dia: multa integral", 180_000, 5_400_00, "2026-01-05", "2028-07-05", "2026-01-05"),
    ("saída no último dia: sem multa", 180_000, 5_400_00, "2026-01-05", "2028-07-05", "2028-07-05"),
    ("12 meses, multa fixa de R$ 5.000,01, arredondamento", 100_000, 500_001, "2026-02-14", "2027-02-14", "2026-08-31"),
    ("prazo de 1 mês", 100_000, 300_000, "2026-01-01", "2026-02-01", "2026-01-11"),
    ("valores extremos: 10 anos, aluguel de R$ 1 milhão", 100_000_000, 300_000_000, "2020-06-15", "2030-06-15", "2026-10-27"),
]

saida = []
for nome, aluguel, multa, i, t, dv in CASOS:
    i, t, dv = date.fromisoformat(i), date.fromisoformat(t), date.fromisoformat(dv)
    pt, rs = periodo(i, t), periodo(dv, t)
    valor = rd(Fraction(multa) * rs[3] / pt[3])
    saida.append({"nome": nome, "aluguel": aluguel, "multa": multa, "inicio": i.isoformat(), "termino": t.isoformat(),
                  "devolucao": dv.isoformat(), "prazo": list(pt[:3]), "restante": list(rs[:3]), "proporcional": valor})
(Path(__file__).parent / "multa_aluguel.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n")
for s in saida: print(s["nome"], s["prazo"], s["restante"], s["proporcional"])

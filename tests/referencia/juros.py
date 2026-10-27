"""Conta de referência da calculadora de juros abusivos, escrita à parte do motor
(TypeScript), com Decimal de 40 dígitos e sem reaproveitar código:

- Price: PMT = PV × i(1+i)^n / ((1+i)^n − 1); i = 0 → PV/n.
- SAC: amortização PV/n, juros sobre o saldo.
- Tabelas em centavos, meio centavo para cima, última parcela fecha o saldo.
- Taxa implícita por Newton-Raphson (o motor usa bisseção: métodos diferentes, mesma raiz).
- Conversão efetiva: (1+i)^12 − 1.

Gera tests/referencia/juros.json. Rodar de novo só quando um caso mudar:
    python3 tests/referencia/juros.py
"""
import json
from decimal import Decimal as D, getcontext, ROUND_HALF_UP
from pathlib import Path

getcontext().prec = 40


def rd(x):
    return int(D(x).quantize(D("1"), ROUND_HALF_UP))


def pmt(pv, i, n):
    pv, i = D(pv), D(i)
    if i == 0:
        return rd(pv / n)
    f = (1 + i) ** n
    return rd(pv * i * f / (f - 1))


def price(pv, i, n):
    i = D(i)
    p = pmt(pv, i, n)
    saldo, linhas = pv, []
    for k in range(1, n + 1):
        j = rd(saldo * i)
        a = saldo if k == n else min(saldo, p - j)
        saldo -= a
        linhas.append([k, a + j, j, a, saldo])
    return linhas


def sac(pv, i, n):
    i = D(i)
    base = rd(D(pv) / n)
    saldo, linhas = pv, []
    for k in range(1, n + 1):
        j = rd(saldo * i)
        a = saldo if k == n else min(saldo, base)
        saldo -= a
        linhas.append([k, a + j, j, a, saldo])
    return linhas


def taxa_implicita(pv, parcelas):
    pv = D(pv)
    i = D("0.02")
    for _ in range(100):
        f = sum(D(p) / (1 + i) ** (k + 1) for k, p in enumerate(parcelas)) - pv
        df = sum(-(k + 1) * D(p) / (1 + i) ** (k + 2) for k, p in enumerate(parcelas))
        novo = i - f / df
        if abs(novo - i) < D("1e-20"):
            break
        i = novo
    return float(i)


def anual(i):
    return float((1 + D(i)) ** 12 - 1)


saida = {
    "price": [
        {"pv": pv, "i": i, "n": n, "pmt": pmt(pv, i, n), "tabela": price(pv, D(i), n)}
        for pv, i, n in [(1_000_000, "0.02", 12), (2_500_000, "0.0197", 48), (5_000_000, "0", 10), (100, "0.15", 3), (30_000_000, "0.0087", 360)]
    ],
    "sac": [
        {"pv": pv, "i": i, "n": n, "tabela": sac(pv, D(i), n)}
        for pv, i, n in [(1_200_000, "0.01", 12), (30_000_000, "0.0087", 360), (1_000, "0.05", 3)]
    ],
    "implicita": [
        {"pv": pv, "parcelas": ps, "taxa": taxa_implicita(pv, ps)}
        for pv, ps in [
            (1_000_000, [94_560] * 12),
            (2_000_000, [99_000] * 36),
            (1_000_000, [50_000, 60_000, 70_000, 80_000] * 4),
            (500_000, [600_000]),
        ]
    ],
    "anual": [{"i": i, "anual": anual(i)} for i in ["0.01", "0.0197", "0.08", "0.1518"]],
}
(Path(__file__).parent / "juros.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n")
print("ok")

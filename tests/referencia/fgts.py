"""Conta de referência do FGTS, escrita à parte do motor (TypeScript), direto das regras:
Lei 8.036/1990 (art. 15: 8%, aprendiz 2%, prazo dia 20 desde a competência 03/2024, antes
dia 7; art. 13: juros de 3% ao ano; art. 18: multa de 40% sobre depósitos corrigidos, sem
descontar saques; 20% na culpa recíproca; art. 20-D e Anexo: saque-aniversário; art. 20,
§ 23: janela do saque; art. 20-C: volta ao saque-rescisão no 25º mês); LC 150/2015 (3,2%
do doméstico); CLT, art. 484-A (acordo: 20%, saque de 80%); Decreto 10.854/2021, art. 76
(13º: mês com 15 dias ou mais). FAQ do FGTS Digital: vencimento antecipado quando o dia
20 não é útil (competência 03/2024 vence em 19/04/2024).

Gera tests/referencia/fgts.json. Rodar de novo só quando um caso mudar:
    python3 tests/referencia/fgts.py
"""
import calendar
import json
from datetime import date, timedelta
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path

JUROS = D("0.0024662698")  # 1,03^(1/12) − 1, com 10 casas


def rd(x):
    return int(D(x).quantize(D("1"), ROUND_HALF_UP))


def aliquota(vinculo):
    return D("0.02") if vinculo == "aprendiz" else D("0.08")


# ---------- vencimento ----------
def vencimento(ano, mes):
    a, m = (ano + 1, 1) if mes == 12 else (ano, mes + 1)
    if (ano, mes) < (2024, 3):
        return date(a, m, 7)
    d = date(a, m, 20)
    while not util(d):  # fim de semana ou feriado nacional: antecipa
        d -= timedelta(days=1)
    return d


def util(d):
    feriados = {(1, 1), (4, 21), (5, 1), (9, 7), (10, 12), (11, 2), (11, 15), (12, 25)}
    if d.year >= 2024:
        feriados.add((11, 20))  # Lei 14.759/2023
    return d.weekday() < 5 and (d.month, d.day) not in feriados


def janela(ano, mes):
    a, m = (ano + (mes + 1) // 12, (mes + 1) % 12 + 1)
    d = date(a, m, calendar.monthrange(a, m)[1])
    while not util(d):
        d -= timedelta(days=1)
    return d


# ---------- saldo ----------
def meses(inicio, fim):
    a, m = inicio.year, inicio.month
    while (a, m) <= (fim.year, fim.month):
        yield a, m
        a, m = (a + 1, 1) if m == 12 else (a, m + 1)


def add_months(d, n):
    total = d.year * 12 + d.month - 1 + n
    a, m = divmod(total, 12)
    m += 1
    return date(a, m, min(d.day, calendar.monthrange(a, m)[1]))


def simular(c):
    adm = date.fromisoformat(c["admissao"])
    fim = date.fromisoformat(c["fim"])
    aliq = aliquota(c["vinculo"])
    variaveis = c.get("variaveis", 0)
    reaj = sorted((tuple(map(int, r["aPartirDe"].split("-"))), r["salario"]) for r in c.get("reajustes", []))
    afast = [(tuple(map(int, a["inicio"].split("-"))), tuple(map(int, a["fim"].split("-")))) for a in c.get("afastamentos", [])]
    saques = {}
    for s in c.get("saques", []):
        k = tuple(map(int, s["competencia"].split("-")))
        saques[k] = saques.get(k, 0) + s["valor"]
    fechamentos = set()
    k = 1
    while True:
        f = add_months(adm, 12 * k) - timedelta(days=1)
        if f > fim:
            break
        fechamentos.add((f.year, f.month))
        k += 1
    ultima = (fim.year, fim.month)
    saldo = D(c.get("saldoInicial", 0))
    base_multa = D(0)
    avos = {}
    tot = {"depositos": 0, "juros": 0, "saques": 0, "domestico": 0}
    linhas = []
    for a, m in meses(adm, fim):
        sal = c["salario"]
        for (ra, rm), v in reaj:
            if (ra, rm) <= (a, m):
                sal = v
        mensal = sal + variaveis
        nd = calendar.monthrange(a, m)[1]
        d1 = adm.day if (adm.year, adm.month) == (a, m) else 1
        d2 = fim.day if (fim.year, fim.month) == (a, m) else nd
        dias = d2 - d1 + 1
        afastado = any(i <= (a, m) <= f for i, f in afast)
        if afastado:
            rem = 0
        elif dias == nd:
            rem = mensal
        else:
            rem = rd(D(mensal) * min(dias, 30) / 30)
        if not afastado and dias >= 15:
            avos[a] = avos.get(a, 0) + 1
        dec = 0
        if c.get("incluir13", True) and (m == 12 or (c.get("contratoEncerrado") and (a, m) == ultima)):
            dec = rd(D(mensal) * avos.get(a, 0) / 12)
        terco = rd(D(mensal) / 3) if c.get("incluirTercoDeFerias", True) and (a, m) in fechamentos else 0
        base = rem + dec + terco
        dep = rd(base * aliq)
        dom = rd(base * D("0.032")) if c["vinculo"] == "domestico" else 0
        j = rd(saldo * JUROS)
        disp = saldo + j + dep
        saq = min(D(saques.get((a, m), 0)), disp)
        saldo = disp - saq
        base_multa = base_multa + rd(base_multa * JUROS) + dep
        tot["depositos"] += dep
        tot["juros"] += j
        tot["saques"] += int(saq)
        tot["domestico"] += dom
        linhas.append([f"{a}-{m:02d}", rem, dec, terco, dep, j, int(saldo)])
    return {"depositos": tot["depositos"], "juros": tot["juros"], "saques": tot["saques"], "saldo": int(saldo),
            "baseDaMulta": int(base_multa), "indenizacaoDomestico": tot["domestico"], "meses": linhas}


# ---------- saque-aniversário ----------
FAIXAS = [(50000, D("0.50"), 0), (100000, D("0.40"), 5000), (500000, D("0.30"), 15000), (1000000, D("0.20"), 65000),
          (1500000, D("0.15"), 115000), (2000000, D("0.10"), 190000), (None, D("0.05"), 290000)]


def saque_aniversario(saldo):
    for ate, aliq, adic in FAIXAS:
        if ate is None or saldo <= ate:
            return rd(saldo * aliq) + adic


# ---------- multa ----------
PCT = {"sem-justa-causa": D("0.40"), "termo-antecipado": D("0.40"), "acordo": D("0.20"), "culpa-reciproca": D("0.20"),
       "termo-normal": D(0), "pedido": D(0), "justa-causa": D(0)}


def multa(c):
    base = c["base"] + c.get("depositosDaRescisao", 0)
    mul = rd(base * PCT[c["motivo"]])
    sacavel = None
    if "saldoAtual" in c:
        if c.get("saqueAniversario"):
            sacavel = mul
        elif c["motivo"] in ("pedido", "justa-causa"):
            sacavel = 0
        elif c["motivo"] == "acordo":
            sacavel = rd(base * D("0.8")) + mul
        else:
            sacavel = c["saldoAtual"] + mul
    return {"base": base, "multa": mul, "valorSacavel": sacavel}


casos = {"vencimentos": [], "saldos": [], "multas": [], "saquesAniversario": [], "janelas": []}
for ano, mes in [(2026, 10), (2026, 11), (2026, 12), (2027, 1)]:
    casos["janelas"].append({"ano": ano, "mes": mes, "fim": janela(ano, mes).isoformat()})

for comp in ["2024-02", "2024-03", "2026-08", "2026-10", "2023-12", "2025-05", "2026-12"]:
    a, m = map(int, comp.split("-"))
    casos["vencimentos"].append({"competencia": comp, "vencimento": vencimento(a, m).isoformat()})


def saldo(nome, entrada):
    casos["saldos"].append({"nome": nome, "entrada": entrada, "esperado": simular(entrada)})


saldo("R$ 2.000 por 1 ano inteiro (2025), com 13º e 1/3", {"vinculo": "clt", "admissao": "2025-01-01", "fim": "2025-12-31", "salario": 200000})
saldo("R$ 2.000 por 1 ano, sem 13º nem 1/3", {"vinculo": "clt", "admissao": "2025-01-01", "fim": "2025-12-31", "salario": 200000,
                                              "incluir13": False, "incluirTercoDeFerias": False})
saldo("admissão no meio do mês (16/03/2026) até 21/10/2026", {"vinculo": "clt", "admissao": "2026-03-16", "fim": "2026-10-21", "salario": 300000})
saldo("aprendiz, salário mínimo de 2026", {"vinculo": "aprendiz", "admissao": "2026-02-02", "fim": "2026-10-21", "salario": 162100})
saldo("doméstica, 2 anos, contrato encerrado", {"vinculo": "domestico", "admissao": "2024-10-10", "fim": "2026-10-09", "salario": 180000,
                                               "contratoEncerrado": True})
saldo("reajustes, variáveis, afastamento e saque", {"vinculo": "clt", "admissao": "2021-05-03", "fim": "2026-09-30", "salario": 250000,
                                                    "variaveis": 30000,
                                                    "reajustes": [{"aPartirDe": "2022-05", "salario": 275000}, {"aPartirDe": "2024-05", "salario": 310000}],
                                                    "afastamentos": [{"inicio": "2023-02", "fim": "2023-04"}],
                                                    "saques": [{"competencia": "2024-08", "valor": 150000}]})
saldo("saldo inicial e contrato encerrado em julho", {"vinculo": "clt", "admissao": "2019-11-20", "fim": "2026-07-15", "salario": 420000,
                                                     "saldoInicial": 500000, "contratoEncerrado": True})
saldo("saque maior que o saldo", {"vinculo": "clt", "admissao": "2026-01-01", "fim": "2026-04-30", "salario": 200000,
                                  "saques": [{"competencia": "2026-02", "valor": 999999}]})


def mult(nome, entrada):
    casos["multas"].append({"nome": nome, "entrada": entrada, "esperado": multa(entrada)})


mult("sem justa causa, base do extrato + rescisão", {"vinculo": "clt", "motivo": "sem-justa-causa", "base": 1234567, "depositosDaRescisao": 45678, "saldoAtual": 800000})
mult("acordo: 20% e saque de 80%", {"vinculo": "clt", "motivo": "acordo", "base": 1000000, "saldoAtual": 1000000})
mult("culpa recíproca: 20%", {"vinculo": "clt", "motivo": "culpa-reciproca", "base": 333333, "saldoAtual": 333333})
mult("pedido de demissão: nada", {"vinculo": "clt", "motivo": "pedido", "base": 500000, "saldoAtual": 500000})
mult("justa causa: nada", {"vinculo": "clt", "motivo": "justa-causa", "base": 500000})
mult("contrato a prazo antecipado pela empresa: 40%", {"vinculo": "clt", "motivo": "termo-antecipado", "base": 87654, "saldoAtual": 87654})
mult("fim do contrato a prazo: sem multa, saca tudo", {"vinculo": "clt", "motivo": "termo-normal", "base": 87654, "saldoAtual": 90000})
mult("saque-aniversário demitido sem justa causa: só a multa", {"vinculo": "clt", "motivo": "sem-justa-causa", "base": 2000000, "saldoAtual": 1500000, "saqueAniversario": True})

for s in [1, 50000, 50001, 100000, 100001, 500000, 999999, 1000000, 1500000, 2000000, 2000001, 3000000, 12345678]:
    casos["saquesAniversario"].append({"saldo": s, "valor": saque_aniversario(s)})

saida = Path(__file__).with_name("fgts.json")
saida.write_text(json.dumps(casos, ensure_ascii=False, indent=1) + "\n")
print(f"{len(casos['saldos'])} saldos, {len(casos['multas'])} multas, {len(casos['vencimentos'])} vencimentos em {saida}")

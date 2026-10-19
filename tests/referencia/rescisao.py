"""Conta de referência da rescisão, escrita à parte do motor (TypeScript), direto das
regras da lei, para os testes de tests/rescisao.test.mjs. Gera tests/referencia/rescisao.json.

Rodar de novo só quando um caso for acrescentado ou uma regra mudar de verdade:
    python3 tests/referencia/rescisao.py

Regras (ver src/lib/trabalhista/parametros.ts e docs/calculadoras/rescisao.md):
aviso de 30 dias + 3 por ano completo até 90 (Lei 12.506); projeção do aviso
indenizado só na demissão sem justa causa (art. 487, § 1º; Súmula 371); 13º de 1/12
por mês com 15 dias ou mais (Lei 4.090); férias de 1/12 por mês do período aquisitivo
ou fração acima de 14 dias (art. 146); vencidas em dobro se o prazo de concessão
(12 meses depois do período) acabou antes da saída (arts. 134 e 137); terço sobre
tudo (Súmula 328); INSS e IR só sobre saldo e 13º; FGTS de 8% sobre saldo, aviso
indenizado e 13º; multa de 40% (20% no acordo) sobre a base informada + depósitos.
"""
import calendar
import json
from datetime import date, timedelta
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path


def cent(x):
    return int((D(x) * 100).quantize(D("1"), ROUND_HALF_UP))


def rd(x):
    """Arredonda um valor em centavos (Decimal) ao centavo inteiro, meio para cima."""
    return int(D(x).quantize(D("1"), ROUND_HALF_UP))


# --- INSS e IR de 2026, das tabelas oficiais ---
INSS = [(162100, D("0.075")), (290284, D("0.09")), (435427, D("0.12")), (847555, D("0.14"))]
IR = [(242880, D("0"), 0), (282665, D("0.075"), 18216), (375105, D("0.15"), 39416),
      (466468, D("0.225"), 67549), (None, D("0.275"), 90873)]


def inss(c):
    total, ini = D(0), 0
    for teto, a in INSS:
        if c <= ini:
            break
        total += (min(c, teto) - ini) * a
        ini = teto
    return rd(total)


def irrf(rend, prev, dep=0):
    leg = prev + dep * 18959
    base = max(0, rend - max(leg, 60720))
    for teto, a, p in IR:
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


# --- datas ---
def add_meses(d, n):
    m = d.month - 1 + n
    a, m = d.year + m // 12, m % 12 + 1
    return date(a, m, min(d.day, calendar.monthrange(a, m)[1]))


def anos_completos(adm, d):
    n = 0
    while add_meses(adm, 12 * (n + 1)) <= d:
        n += 1
    return n


def avos13(ano, ini, fim):
    n = 0
    for m in range(1, 13):
        p, u = date(ano, m, 1), date(ano, m, calendar.monthrange(ano, m)[1])
        de, ate = max(p, ini), min(u, fim)
        if (ate - de).days + 1 >= 15:
            n += 1
    return n


def avos_ferias(ini, fim):
    k = 0
    while add_meses(ini, k + 1) - timedelta(days=1) <= fim:
        k += 1
    resto = (fim - add_meses(ini, k)).days + 1
    return k + (1 if resto > 14 else 0)


def calcular(c):
    motivo = c["motivo"]
    sal = c["salario"]
    rem = sal + c.get("mediaVariaveis", 0)
    adm, sai = date.fromisoformat(c["admissao"]), date.fromisoformat(c["saida"])
    aviso = c.get("aviso", "trabalhado" if motivo == "pedido" else "indenizado")
    anos = anos_completos(adm, sai)
    dias_aviso = min(90, 30 + 3 * anos)
    encerrou = motivo in ("sem-justa-causa", "acordo")
    indenizado = encerrou and aviso == "indenizado"
    fim = sai + timedelta(days=dias_aviso) if (indenizado and motivo == "sem-justa-causa") else sai
    v = {}

    inicio_mes = date(sai.year, sai.month, 1)
    desde = max(adm, inicio_mes)
    if desde.day == 1 and sai.day == calendar.monthrange(sai.year, sai.month)[1]:
        dias = 30
    else:
        dias = min(30, sai.day - desde.day + 1)
    v["saldo"] = rd(D(sal) * dias / 30)
    if indenizado:
        v["aviso"] = rd(D(rem) * dias_aviso / (60 if motivo == "acordo" else 30))
    if motivo != "justa-causa":
        a_sai = avos13(sai.year, adm, sai)
        a_tot = sum(avos13(a, adm, fim) for a in range(sai.year, fim.year + 1))
        v["decimo-proporcional"] = rd(D(rem) * a_sai / 12)
        v["decimo-aviso"] = rd(D(rem) * (a_tot - a_sai) / 12)
    venc = c.get("feriasVencidas", 0)
    dobro = 0
    for i in range(venc):
        j = anos - 1 - i
        prox = add_meses(adm, 12 * (j + 1))
        fim_prazo = add_meses(prox, 12) - timedelta(days=1)
        if fim_prazo < sai:
            dobro += 1
    if venc:
        v["ferias-vencidas"] = rem * (venc + dobro)
    if motivo != "justa-causa":
        ini = add_meses(adm, 12 * anos)
        f_sai, f_tot = avos_ferias(ini, sai), avos_ferias(ini, fim)
        v["ferias-proporcionais"] = rd(D(rem) * f_sai / 12)
        v["ferias-aviso"] = rd(D(rem) * (f_tot - f_sai) / 12)
    ferias = sum(x for k, x in v.items() if k.startswith("ferias"))
    v["terco"] = rd(D(ferias) / 3)
    v = {k: x for k, x in v.items() if x > 0}
    bruto = sum(v.values())

    saldo, dec = v.get("saldo", 0), v.get("decimo-proporcional", 0) + v.get("decimo-aviso", 0)
    dep = c.get("dependentes", 0)
    i_s, i_13 = inss(saldo), inss(dec)
    d = {"inss-saldo": i_s, "inss-13": i_13, "ir-saldo": irrf(saldo, i_s, dep),
         "ir-13": irrf(dec, i_13, dep) if dec else 0}
    if motivo == "pedido" and aviso in ("nao-cumprido", "parcial"):
        faltaram = 30 - c.get("diasDeAvisoCumpridos", 0) if aviso == "parcial" else 30
        d["aviso-nao-cumprido"] = min(rem, rd(D(rem) * faltaram / 30))
    d["adiantamento-13"] = c.get("adiantamento13", 0)
    d["outros"] = c.get("outrosDescontos", 0)
    d = {k: x for k, x in d.items() if x > 0}
    desc = sum(d.values())

    deps = rd(D(saldo + v.get("aviso", 0) + dec) * D("0.08"))
    base = c["fgtsParaFinsRescisorios"] + deps
    pct = {"sem-justa-causa": D("0.4"), "acordo": D("0.2")}.get(motivo, D(0))
    return {
        "verbas": v, "bruto": bruto, "descontos": d, "liquido": max(0, bruto - desc),
        "fgts": {"depositos": deps, "multa": rd(base * pct)},
        "diasDeAviso": dias_aviso if encerrou else (30 if motivo == "pedido" else 0),
        "fimProjetado": fim.isoformat() if fim != sai else None,
        "prazo": (sai + timedelta(days=10)).isoformat(),
    }


R = lambda reais: cent(reais)  # noqa: E731
CASOS = [
    # nome, entrada (salário em centavos; FGTS para fins rescisórios sempre informado)
    ("sem justa causa, 3 anos, aviso indenizado",
     dict(motivo="sem-justa-causa", salario=R(3000), admissao="2023-02-01", saida="2026-10-20", fgtsParaFinsRescisorios=R(9000))),
    ("acordo, mesmos dados", dict(motivo="acordo", salario=R(3000), admissao="2023-02-01", saida="2026-10-20", fgtsParaFinsRescisorios=R(9000))),
    ("pedido com aviso cumprido", dict(motivo="pedido", salario=R(3000), admissao="2023-02-01", saida="2026-10-20", fgtsParaFinsRescisorios=R(9000))),
    ("justa causa", dict(motivo="justa-causa", salario=R(3000), admissao="2023-02-01", saida="2026-10-20", fgtsParaFinsRescisorios=R(9000))),
    ("sem justa causa, aviso trabalhado (sem projeção)",
     dict(motivo="sem-justa-causa", aviso="trabalhado", salario=R(3000), admissao="2023-02-01", saida="2026-10-20", fgtsParaFinsRescisorios=R(9000))),
    ("projeção do aviso completa o período de férias",
     dict(motivo="sem-justa-causa", salario=R(3000), admissao="2023-02-01", saida="2026-01-20", fgtsParaFinsRescisorios=R(7000))),
    ("projeção passa para o ano seguinte (13º de dois anos)",
     dict(motivo="sem-justa-causa", salario=R(4250.37), admissao="2021-06-15", saida="2026-12-10", fgtsParaFinsRescisorios=R(21000))),
    ("admissão em 29/02 (ano bissexto), saída no fim de fevereiro",
     dict(motivo="sem-justa-causa", salario=R(2537.89), admissao="2024-02-29", saida="2026-02-28", fgtsParaFinsRescisorios=R(5000))),
    ("mês de 31 dias trabalhado inteiro",
     dict(motivo="pedido", salario=R(5000), admissao="2025-01-10", saida="2026-08-31", fgtsParaFinsRescisorios=0)),
    ("admitido e desligado no mesmo mês, aviso não cumprido",
     dict(motivo="pedido", aviso="nao-cumprido", salario=R(3000), admissao="2026-10-15", saida="2026-10-20", fgtsParaFinsRescisorios=0)),
    ("pedido com 15 dias de aviso cumpridos",
     dict(motivo="pedido", aviso="parcial", diasDeAvisoCumpridos=15, salario=R(3200), admissao="2024-04-01", saida="2026-09-15", fgtsParaFinsRescisorios=0)),
    ("pedido, empresa dispensou o aviso",
     dict(motivo="pedido", aviso="dispensado", salario=R(3200), admissao="2024-04-01", saida="2026-09-15", fgtsParaFinsRescisorios=0)),
    ("pedido com menos de 1 ano (férias proporcionais devidas)",
     dict(motivo="pedido", salario=R(2100), admissao="2026-03-02", saida="2026-09-25", fgtsParaFinsRescisorios=0)),
    ("justa causa com 2 férias vencidas (uma em dobro)",
     dict(motivo="justa-causa", feriasVencidas=2, salario=R(3000), admissao="2020-03-10", saida="2026-10-20", fgtsParaFinsRescisorios=0)),
    ("sem justa causa com 1 férias vencida, dentro do prazo",
     dict(motivo="sem-justa-causa", feriasVencidas=1, salario=R(6000), admissao="2022-05-02", saida="2026-07-31", fgtsParaFinsRescisorios=R(30000))),
    ("25 anos de empresa (aviso máximo de 90 dias), salário acima do teto do INSS",
     dict(motivo="sem-justa-causa", salario=R(12000), admissao="2001-03-05", saida="2026-11-18", dependentes=2, fgtsParaFinsRescisorios=R(250000))),
    ("modo detalhado: médias, 13º adiantado, outros descontos, dependentes",
     dict(motivo="sem-justa-causa", salario=R(4500), mediaVariaveis=R(820.5), adiantamento13=R(2600), outrosDescontos=R(300),
          dependentes=1, feriasVencidas=1, admissao="2019-08-19", saida="2026-12-04", fgtsParaFinsRescisorios=R(42000))),
    ("acordo com aviso trabalhado", dict(motivo="acordo", aviso="trabalhado", salario=R(3800), admissao="2022-11-07", saida="2026-06-12", fgtsParaFinsRescisorios=R(14000))),
]

if __name__ == "__main__":
    saida = [{"nome": n, "entrada": e, "esperado": calcular(e)} for n, e in CASOS]
    destino = Path(__file__).with_name("rescisao.json")
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(saida)} casos em {destino}")

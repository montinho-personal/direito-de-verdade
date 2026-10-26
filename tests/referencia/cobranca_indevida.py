"""Conta de referência da cobrança indevida, escrita à parte do motor (TypeScript), direto
das regras: CDC, art. 42, parágrafo único (devolução do que foi pago em excesso, simples ou
em dobro, nunca as duas somadas); Código Civil, art. 389, parágrafo único (correção pelo
IPCA, número-índice do IBGE, tabela 1737); STJ, EAREsp 676.608 (dobro sem má-fé para o que
foi pago depois de 30/03/2021, salvo serviço público de concessionária).

Convenções da calculadora, conferidas aqui: pago a mais = pago − correto, nunca negativo;
o devolvido sai de cada cenário, corrigido desde a data da devolução; correção do mês
seguinte ao pagamento até o último IPCA, nunca abaixo do nominal; arredondamento de meio
centavo para cima.

Gera tests/referencia/cobranca_indevida.json. Rodar de novo só quando um caso mudar:
    python3 tests/referencia/cobranca_indevida.py
"""
import calendar
import json
from datetime import date
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path

PASTA = Path(__file__).parent
IPCA = json.loads((PASTA / "ipca_x100.json").read_text())
INICIO = (int(IPCA["primeiro"][:4]), int(IPCA["primeiro"][4:]))
VALORES = IPCA["valores"]
ULTIMO = (INICIO[0] * 12 + INICIO[1] - 1 + len(VALORES) - 1)
HOJE = date(2026, 10, 26)
PUBLICACAO = date(2021, 3, 30)
LEI_14905 = date(2024, 8, 30)


def ordem(d):
    return d.year * 12 + d.month - 1


def indice(d):
    return VALORES[ordem(d) - (INICIO[0] * 12 + INICIO[1] - 1)]


def corrigir(v, d):
    if ordem(d) >= ULTIMO or VALORES[-1] <= indice(d):
        return v
    return int((D(v) * VALORES[-1] / D(indice(d))).quantize(D("1"), ROUND_HALF_UP))


def mais_meses(d, n):
    t = d.year * 12 + d.month - 1 + n
    a, m = divmod(t, 12)
    m += 1
    return date(a, m, min(d.day, calendar.monthrange(a, m)[1]))


def calcular(e):
    parcelas = []
    for i, l in enumerate(e["linhas"]):
        d0 = date.fromisoformat(l["data"])
        pago = l["cobrado"] if e["pagamento"] == "integral" else 0 if e["pagamento"] == "nao" else l["pago"]
        for k in range(l["repeticoes"]):
            d = mais_meses(d0, k)
            exc = max(0, pago - l["devido"])
            parcelas.append((d, i, l["cobrado"], l["devido"], pago, exc))
    parcelas.sort(key=lambda p: (p[0], p[1]))
    excesso = sum(p[5] for p in parcelas)
    pago = sum(p[4] for p in parcelas)
    dev = 0 if e["pagamento"] == "nao" else e["devolvido"]
    dev_corr = corrigir(dev, date.fromisoformat(e["dataDaDevolucao"])) if dev else 0

    def cenario(mult):
        principal = max(0, mult * excesso - dev)
        corr = sum(corrigir(mult * p[5], p[0]) for p in parcelas)
        total = max(principal, corr - dev_corr)
        return [principal, total - principal, total]

    if e["pagamento"] == "nao" or pago == 0:
        situacao = "sem-pagamento"
    elif excesso == 0:
        situacao = "sem-excesso"
    else:
        situacao = "com-excesso"

    avisos = []
    com = [p for p in parcelas if p[5] > 0]
    if situacao == "com-excesso":
        avisos.append("tema-929")
        if e["tipo"] != "energia-agua" and any(p[0] <= PUBLICACAO for p in com):
            avisos.append("modulacao")
            if e["tipo"] == "telecom":
                avisos.append("modulacao-telefonia-fixa")
        if any(p[0] < LEI_14905 for p in com):
            avisos.append("indice-antes-da-lei-14905")
        if any(p[0] < mais_meses(HOJE, -120) for p in com):
            avisos.append("mais-de-10-anos")
        elif any(p[0] < mais_meses(HOJE, -60) for p in com):
            avisos.append("mais-de-5-anos")
        if dev > excesso:
            avisos.append("devolvido-maior-que-excesso")
        if any(ordem(p[0]) >= ULTIMO for p in com):
            avisos.append("sem-ipca-ainda")
    if e["pagamento"] == "incerto":
        avisos.append("pagamento-incerto")

    return {
        "situacao": situacao,
        "totais": [
            sum(p[2] for p in parcelas),
            sum(p[3] for p in parcelas),
            pago,
            sum(p[2] - p[3] for p in parcelas),
            excesso,
            dev,
        ],
        "parcelas": [[p[0].isoformat(), p[5], corrigir(p[5], p[0]), corrigir(2 * p[5], p[0])] for p in parcelas],
        "simples": cenario(1),
        "dobro": cenario(2),
        "avisos": avisos,
    }


def linha(data, cobrado, devido, pago=0, repeticoes=1):
    return {"data": data, "cobrado": cobrado, "devido": devido, "pago": pago, "repeticoes": repeticoes}


def entrada(tipo, pagamento, linhas, devolvido=0, data_dev=""):
    return {
        "tipo": tipo,
        "pagamento": pagamento,
        "linhas": linhas,
        "devolvido": devolvido,
        "dataDaDevolucao": data_dev,
        "hoje": HOJE.isoformat(),
    }


CASOS = [
    ("não paga: só contestar", entrada("nao-contratado", "nao", [linha("2026-05-10", 4990, 0)])),
    ("paga integral: tarifa não contratada", entrada("tarifa-bancaria", "integral", [linha("2025-03-15", 15000, 0)])),
    ("paga parcial: conta de internet acima do plano", entrada("telecom", "parcial", [linha("2024-11-05", 20000, 12000, 15000)])),
    ("parcial abaixo do correto: nada pago a mais", entrada("outro", "parcial", [linha("2025-02-01", 10000, 8000, 5000)])),
    ("pago igual ao correto: sem excesso", entrada("outro", "parcial", [linha("2025-02-01", 10000, 8000, 8000)])),
    (
        "múltiplas: assinatura cancelada por 6 meses e mais uma cobrança",
        entrada("assinatura-cancelada", "integral", [linha("2025-01-31", 3990, 0, repeticoes=6), linha("2025-09-10", 5990, 0)]),
    ),
    (
        "devolvido: duplicada já estornada no simples",
        entrada("duplicada", "integral", [linha("2025-06-20", 30000, 15000)], 15000, "2025-08-01"),
    ),
    (
        "devolvido maior que o pago a mais",
        entrada("duplicada", "integral", [linha("2025-06-20", 30000, 15000)], 20000, "2025-06-25"),
    ),
    ("modulação: compra paga antes de 30/03/2021", entrada("compra-cancelada", "integral", [linha("2020-05-10", 89900, 0)])),
    ("modulação: luz paga antes de 2021 não tem corte", entrada("energia-agua", "integral", [linha("2020-05-10", 25000, 18000)])),
    ("modulação: telefone pago no dia da publicação", entrada("telecom", "integral", [linha("2021-03-30", 9990, 4990)])),
    ("modulação: pago um dia depois da publicação", entrada("nao-contratado", "integral", [linha("2021-03-31", 9990, 0)])),
    ("sem IPCA ainda: pagamentos de setembro e outubro de 2026", entrada("outro", "integral", [linha("2026-09-15", 10000, 0), linha("2026-10-01", 10000, 0)])),
    ("mais de 10 anos", entrada("energia-agua", "integral", [linha("2015-01-10", 12000, 0)])),
    ("mais de 5 anos", entrada("energia-agua", "integral", [linha("2020-01-10", 12000, 0)])),
    ("pagamento incerto", entrada("outro", "incerto", [linha("2026-03-03", 5000, 0, 5000)])),
    ("centavos: meio centavo arredonda para cima", entrada("outro", "integral", [linha("2024-01-31", 1, 0), linha("2016-02-29", 333, 0)])),
]

saida = PASTA / "cobranca_indevida.json"
saida.write_text(
    json.dumps([{"nome": n, "entrada": e, "esperado": calcular(e)} for n, e in CASOS], ensure_ascii=False, indent=1) + "\n"
)
print(f"{len(CASOS)} casos em {saida}")

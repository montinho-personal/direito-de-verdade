"""Conta de referência das férias de 2026, escrita à parte do motor (TypeScript), direto
da CLT (arts. 130, 142, 143 e 145), da tabela do INSS e do IR de 2026 e da pergunta 178
das Perguntas e Respostas do IRPF 2026 (férias + 1/3 tributadas em separado; abono
isento) e da Solução de Consulta Cosit 209/2021 (1/3 do abono tributado). Gera tests/referencia/ferias.json.

    python3 tests/referencia/ferias.py
"""
import json
from datetime import date, timedelta
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path

from rescisao import inss, rd  # mesmas tabelas oficiais de INSS de 2026
from decimo_terceiro import irrf  # IR mensal de 2026 com a redução da Lei 15.270


def dias_de_direito(faltas):
    for limite, dias in [(5, 30), (14, 24), (23, 18), (32, 12)]:
        if faltas <= limite:
            return dias
    return 0


def calcular(c):
    rem = c["salario"] + c.get("mediaVariaveis", 0)
    direito = dias_de_direito(c.get("faltas", 0))
    vendidos = c.get("diasVendidos", 0)
    descanso = c.get("diasDeDescanso", direito - vendidos)
    ferias = rd(D(rem * descanso) / 30)
    terco = rd(D(ferias) / 3)
    abono = rd(D(rem * vendidos) / 30)
    terco_abono = rd(D(abono) / 3)
    adiant = rd(D(rem) / 2) if c.get("adiantar13") else 0
    i = inss(ferias + terco)
    pensao = c.get("pensao", 0)
    ir = irrf(ferias + terco + terco_abono, i, c.get("dependentes", 0), pensao)
    bruto = ferias + terco + abono + terco_abono + adiant
    out = {"direito": direito, "ferias": ferias, "terco": terco, "abono": abono + terco_abono,
           "inss": i, "ir": ir, "liquido": bruto - i - ir - pensao}
    if "inicio" in c:
        ini = date.fromisoformat(c["inicio"])
        out["pagamentoAte"] = (ini - timedelta(days=2)).isoformat()
        out["volta"] = (ini + timedelta(days=descanso)).isoformat()
    return out


R = lambda x: int((D(str(x)) * 100).quantize(D("1"), ROUND_HALF_UP))  # noqa: E731
CASOS = [(f"30 dias, salário de R$ {s}", dict(salario=R(s))) for s in
         [1621, 1800, 2000, 2200, 3000, 3500, 3750, 5000, 5513.25, 6000, 7350, 8000, 10000, 2537.89]]
CASOS += [
    ("vendendo 10 dias, R$ 3.000", dict(salario=R(3000), diasVendidos=10)),
    ("vendendo 5 dias, R$ 3.000", dict(salario=R(3000), diasVendidos=5)),
    ("15 dias (fracionadas), R$ 4.000", dict(salario=R(4000), diasDeDescanso=15)),
    ("20 dias e venda de 10, R$ 4.000", dict(salario=R(4000), diasDeDescanso=20, diasVendidos=10)),
    ("8 faltas: 24 dias e venda de 8", dict(salario=R(3000), faltas=8, diasVendidos=8)),
    ("20 faltas: 18 dias", dict(salario=R(3000), faltas=20)),
    ("30 faltas: 12 dias", dict(salario=R(3000), faltas=30)),
    ("horas extras e adicional noturno na média", dict(salario=R(2800), mediaVariaveis=R(640))),
    ("venda de 10 dias com imposto no 1/3 do abono, R$ 6.000", dict(salario=R(6000), diasVendidos=10)),
    ("venda de 10 dias, R$ 5.000 (rendimento de R$ 5.000 cravados)", dict(salario=R(5000), diasVendidos=10)),
    ("dependentes", dict(salario=R(9000), dependentes=2)),
    ("pensão alimentícia", dict(salario=R(9000), pensao=R(1500))),
    ("1ª parcela do 13º junto", dict(salario=R(3000), adiantar13=True)),
    ("datas: início numa segunda", dict(salario=R(3000), inicio="2027-01-04")),
    ("datas: 20 dias a partir de 01/12", dict(salario=R(3000), diasDeDescanso=20, diasVendidos=10, inicio="2026-12-01")),
]

if __name__ == "__main__":
    saida = [{"nome": n, "entrada": e, "esperado": calcular(e)} for n, e in CASOS]
    destino = Path(__file__).with_name("ferias.json")
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(saida)} casos em {destino}")

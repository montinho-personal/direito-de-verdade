// Gráfico simples da evolução estimada do FGTS, ano a ano: depósitos acumulados e saldo
// estimado. Os mesmos números estão na tabela logo abaixo dele (para leitores de tela).
import { reais } from "@/lib/dinheiro";
import type { AnoDoSaldo } from "@/lib/fgts/saldo.ts";

const L = 320;
const A = 160;
const M = { esq: 8, dir: 8, topo: 12, base: 22 };

export function Grafico({ anos }: { anos: AnoDoSaldo[] }) {
  const pontos = anos.map((a, i) => ({
    ano: a.ano,
    depositos: anos.slice(0, i + 1).reduce((s, x) => s + x.depositos, 0),
    saldo: a.saldo,
    saques: a.saques,
  }));
  const maximo = Math.max(1, ...pontos.map((p) => Math.max(p.depositos, p.saldo)));
  const x = (i: number) => M.esq + (pontos.length === 1 ? (L - M.esq - M.dir) / 2 : (i * (L - M.esq - M.dir)) / (pontos.length - 1));
  const y = (v: number) => M.topo + (A - M.topo - M.base) * (1 - v / maximo);
  const linha = (campo: "depositos" | "saldo") => pontos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[campo]).toFixed(1)}`).join(" ");
  const ultimo = pontos[pontos.length - 1];
  const rotulos = pontos.length <= 6 ? pontos.map((_, i) => i) : [0, Math.floor((pontos.length - 1) / 2), pontos.length - 1];

  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Depósitos acumulados chegam a ${reais(ultimo.depositos)} e o saldo estimado a ${reais(ultimo.saldo)} em ${ultimo.ano}.`}
      >
        <line x1={M.esq} x2={L - M.dir} y1={A - M.base} y2={A - M.base} stroke="var(--border)" />
        <path d={linha("depositos")} fill="none" stroke="var(--navy)" strokeWidth={2} strokeDasharray="5 4" />
        <path d={linha("saldo")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        {pontos.map((p, i) =>
          p.saques > 0 ? <circle key={p.ano} cx={x(i)} cy={y(p.saldo)} r={4} fill="var(--gold)" stroke="var(--navy)" /> : null,
        )}
        {rotulos.map((i) => (
          <text key={i} x={x(i)} y={A - 6} textAnchor={i === 0 ? "start" : i === pontos.length - 1 ? "end" : "middle"} fontSize="10" fill="var(--muted)">
            {pontos[i].ano}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-5 border-t-2 border-dashed border-navy" /> Depósitos acumulados
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-5 bg-accent" /> Saldo estimado (não oficial)
        </span>
        {pontos.some((p) => p.saques) && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-2.5 rounded-full border border-navy bg-gold" /> Ano com saque
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// Página de exemplo, local, que imita a estrutura de uma busca: campo, sugestões e
// resultados. Serve para testar o coletor de ponta a ponta sem tocar no Google.
// Não é cópia de uma página real: se o Google mudar, o que vale é o HTML salvo das coletas.
import http from "node:http";

const INICIO = `<!doctype html><html lang="pt-BR"><body>
<form action="/search"><textarea name="q"></textarea></form>
<ul role="listbox" hidden>
  <li role="presentation"><div role="option"><span>multa proporcional aluguel</span></div></li>
  <li role="presentation"><div role="option"><span>multa proporcional aluguel <b>cálculo</b></span></div></li>
  <li role="presentation"><div role="option"><span>multa proporcional aluguel <b>12 meses</b></span></div></li>
</ul>
<script>
  const campo = document.querySelector("textarea");
  campo.addEventListener("input", () => (document.querySelector("ul").hidden = false));
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); campo.form.submit(); } });
</script></body></html>`;

const RESULTADOS = `<!doctype html><html lang="pt-BR"><body><div id="search"><div id="rso">
<div><div><div role="heading">Visão geral criada por IA</div></div>
  <div><p>A multa por sair antes do fim do contrato de aluguel é proporcional ao tempo que falta, segundo a Lei do Inquilinato. Em um contrato de 30 meses com multa de 3 aluguéis, quem sai faltando 10 meses paga um terço da multa. A conta divide a multa pelo prazo total e multiplica pelos meses restantes.</p>
  <a href="https://www.planalto.gov.br/ccivil_03/leis/l8245.htm">Lei 8.245 - Planalto</a>
  <a href="https://exemplo-imobiliaria.com.br/multa">Guia da multa</a></div></div>
<div data-hveid="1"><a href="https://exemplo-um.com.br/calculadora-multa"><h3>Calculadora de multa de aluguel</h3></a>
  <div data-sncf="1">Calcule a multa proporcional por rescisão antecipada do contrato de aluguel em segundos, com base na Lei do Inquilinato.</div></div>
<div><div><span>As pessoas também perguntam</span></div>
  <div><div data-q="Como calcular a multa proporcional do aluguel?"><div role="button" aria-expanded="true">Como calcular a multa proporcional do aluguel?</div>
      <div><span>Divida o valor da multa pelo número de meses do contrato e multiplique pelos meses que faltam.</span>
      <a href="https://exemplo-dois.com.br/como-calcular"><h3>Como calcular a multa</h3></a></div></div>
    <div data-q="Qual o valor da multa por quebra de contrato de aluguel?"><div role="button" aria-expanded="false">Qual o valor da multa por quebra de contrato de aluguel?</div></div>
    <div data-q="Quem sai do aluguel antes de 12 meses paga multa?"><div role="button" aria-expanded="false">Quem sai do aluguel antes de 12 meses paga multa?</div></div></div></div>
<div data-hveid="2"><a href="https://direitodeverdade.com.br/calculadoras/multa-rescisao-aluguel"><h3>Calculadora de multa de rescisão de aluguel</h3></a>
  <div data-sncf="1">Informe o aluguel, o prazo do contrato e os meses cumpridos para ver a multa proporcional que a lei manda cobrar.</div></div>
<div data-hveid="3"><a href="https://exemplo-tres.com.br/artigo"><h3>Multa de 3 aluguéis: como funciona</h3></a>
  <div data-sncf="1">A multa de três aluguéis é a mais comum nos contratos e deve ser reduzida de forma proporcional ao tempo cumprido.</div></div>
</div>
<div><div><span>Outras pessoas pesquisaram</span></div>
  <div><a href="/search?q=multa+aluguel+30+meses">multa aluguel 30 meses</a>
  <a href="/search?q=isencao+multa+aluguel+transferencia">isenção multa aluguel transferência de emprego</a>
  <a href="/search?q=modelo+carta+rescisao+aluguel">modelo de carta de rescisão de aluguel</a></div></div>
</div></body></html>`;

export function iniciarServidorDeExemplo() {
  const servidor = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(req.url.startsWith("/search") ? RESULTADOS : INICIO);
  });
  return new Promise((resolver) => servidor.listen(0, "127.0.0.1", () => resolver(servidor)));
}

# Calculadora: seguro-desemprego 2026 (`/calculadoras/seguro-desemprego`)

Escrita e publicada em 19/10/2026, a partir dos prints do Renato. Usa a
ferramenta `calculadora-seguro-desemprego` (a mesma do artigo
[seguro-desemprego 2026](../artigos/seguro-desemprego-2026.md)).

## Por que existe

"Calculadora seguro-desemprego" é a busca de quem quer a conta pronta. Os
concorrentes do topo (Carmelitas, UOL) só dão o valor; a nossa dá valor,
número de parcelas e total, com o arredondamento da lei.

## Prints recebidos

Recebidos em 19/10/2026 (computador, 17h27). Os dois chegaram só como
imagem na conversa, sem arquivo; a pasta
`docs/calculadoras/prints/seguro-desemprego/` fica à espera do reenvio.

| print | conteúdo | onde entrou |
|---|---|---|
| Autocompletar `calculadora seguro-desemprego` | 2026; econet; seguro desemprego; 2025; idinheiro; online; doméstica; catho; 2024; valor | "2026" e "online" no título; H2 da doméstica; H2 comparando 2026, 2025 e 2024; H2 de exemplos de valor. Econet, idinheiro e catho são navegação |
| Visão geral de IA | média dos 3 últimos salários brutos; faixas; piso R$ 1.621 e teto R$ 2.518,65; 3/4/5 parcelas; carência por pedido; cita UOL e Carmelitas | passo a passo da conta; tabela de parcelas completa (a da IA simplifica); FAQ do bruto ou líquido |

## Fontes confirmadas

As do artigo, mais: tabela de 2024 (faixas, teto R$ 2.313,74, mínimo
R$ 1.412, vigência 11/01/2024) na página do MTE "seguro-desemprego formal";
teto de 2025 (R$ 2.424,11) e piso de 2025 (R$ 1.518) e "os novos montantes
valem tanto para quem recebe o seguro-desemprego como para quem ainda dará
entrada no pedido" na Agência Brasil de 12/01/2026. Exemplos: cálculo
próprio com `src/lib/seguro-desemprego.ts`.

## Pendente

- Prints em arquivo (reenvio).
- Faixas completas de 2025: não conferidas; a tabela mostra só piso e teto.
- INSS sobre a parcela: sem norma em vigor que mande descontar (a MP
  905/2019 perdeu a vigência); o texto não fala de INSS.

## Decisões

- **Título** "Calculadora seguro-desemprego 2026 online: valor e parcelas"
  (59): "2026" e "online" do autocompletar; "valor e parcelas" é o que
  a calculadora entrega a mais.
- **Descrição** com o teto e a promessa das três respostas (parcela,
  número, total).
- **Tabela de exemplos com totais** de 4 e 5 parcelas (os concorrentes só
  dão a parcela).
- **FAQ com 5**: bruto ou líquido, hora extra, reajuste para quem já
  recebia, salário mínimo, valor máximo.
- **Links**: para o artigo do seguro-desemprego e a calculadora de
  rescisão; o artigo linka para cá.

## Para medir

A partir de ~10/11 e no pico de janeiro: "calculadora seguro-desemprego",
"calculadora seguro desemprego 2026", "calculadora seguro desemprego
online", "calculadora seguro desemprego doméstica", "calculadora seguro
desemprego valor".

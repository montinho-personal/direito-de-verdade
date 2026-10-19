// Configurações gerais do site. Os campos vazios ativam recursos assim que
// forem preenchidos: basta colar o valor entre as aspas e publicar.
export const site = {
  nome: "Direito de Verdade",
  tituloPadrao: "Direito de Verdade: seus direitos, sem complicação",
  descricao:
    "Informação jurídica clara, ferramentas práticas e orientações para situações da vida real.",

  // Código de editor do Google AdSense, no formato "ca-pub-1234567890123456".
  // Vazio: o código do AdSense e o arquivo /ads.txt não são publicados.
  adsense: "",

  // E-mail de contato exibido no site.
  // Vazio: a página de contato fica oculta e a política de privacidade avisa que o canal está a caminho.
  emailContato: "",

  // Código de verificação do Google Search Console (método "tag HTML", só o valor de content).
  // Pode ficar vazio se a verificação for feita pelo DNS do domínio.
  verificacaoGoogle: "",

  // Endereço principal do site. Na Vercel, é o domínio de produção
  // (o domínio próprio, assim que ele for ligado ao projeto).
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
};

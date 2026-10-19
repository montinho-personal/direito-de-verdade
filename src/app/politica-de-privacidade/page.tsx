import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { metadadosDaPagina } from "@/lib/metadados";
import { site } from "@/lib/site";

export const metadata = metadadosDaPagina({
  titulo: "Política de Privacidade",
  descricao:
    "Saiba quais dados o Direito de Verdade coleta, como usa cookies e anúncios e como exercer seus direitos previstos na LGPD.",
  caminho: "/politica-de-privacidade",
});

export default function PoliticaDePrivacidade() {
  return (
    <PaginaDeTexto
      titulo="Política de Privacidade"
      atualizadaEm="19 de outubro de 2026"
    >
      <p>
        Esta política explica como o <strong>Direito de Verdade</strong> trata
        os dados pessoais de quem visita o site, em conformidade com a Lei
        Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018).
      </p>

      <h2>Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Dados de navegação:</strong> endereço IP, tipo de navegador e
          de dispositivo, páginas visitadas, data e horário de acesso. Eles são
          registrados automaticamente pelo provedor de hospedagem e por cookies.
        </li>
        <li>
          <strong>Dados que você nos envia:</strong> quando você entra em
          contato, recebemos as informações que decidir compartilhar, como nome,
          e-mail e o conteúdo da mensagem.
        </li>
      </ul>
      <p>
        Não pedimos cadastro para ler o conteúdo do site e não coletamos dados
        sensíveis.
      </p>

      <h2>Como usamos os dados</h2>
      <ul>
        <li>Manter o site funcionando, com segurança e bom desempenho.</li>
        <li>Exibir anúncios, que ajudam a manter o conteúdo gratuito.</li>
        <li>Responder às mensagens que você enviar.</li>
        <li>Cumprir obrigações legais.</li>
      </ul>
      <p>
        O tratamento se baseia no legítimo interesse em operar o site, no seu
        consentimento quando ele for necessário e no cumprimento de obrigações
        legais, conforme o artigo 7º da LGPD.
      </p>

      <h2>Cookies e publicidade</h2>
      <p>
        Cookies são pequenos arquivos guardados no seu navegador. O site pode
        exibir anúncios fornecidos pelo Google AdSense, que usa cookies para
        escolher os anúncios exibidos.
      </p>
      <ul>
        <li>
          Fornecedores terceiros, incluindo o Google, usam cookies para exibir
          anúncios com base nas suas visitas anteriores a este e a outros sites.
        </li>
        <li>
          O uso de cookies de publicidade permite que o Google e seus parceiros
          exibam anúncios com base nas suas visitas a este e/ou a outros sites
          na internet.
        </li>
        <li>
          Você pode desativar a publicidade personalizada nas{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Configurações de anúncios do Google
          </a>
          . Também é possível recusar o uso de cookies de outros fornecedores
          para publicidade personalizada em{" "}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.aboutads.info
          </a>
          .
        </li>
      </ul>
      <p>
        Saiba mais sobre{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noopener noreferrer"
        >
          como o Google usa as informações de sites que usam seus serviços
        </a>
        . Você também pode bloquear ou apagar cookies nas configurações do seu
        navegador; nesse caso, alguns recursos podem funcionar de forma
        diferente.
      </p>

      {site.googleAnalytics && (
        <>
          <h2>Medição de audiência</h2>
          <p>
            O site usa o Google Analytics para saber quantas pessoas visitam cada
            página, de onde chegam e por quanto tempo leem, sempre de forma
            agregada. O Google Analytics usa cookies e não recebe os valores que
            você digita nas calculadoras: essas contas são feitas no seu
            navegador. Você pode bloquear a medição com o{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout?hl=pt-BR"
              target="_blank"
              rel="noopener noreferrer"
            >
              complemento de desativação do Google Analytics
            </a>{" "}
            ou apagando os cookies no navegador.
          </p>
        </>
      )}

      <h2>Com quem compartilhamos</h2>
      <p>
        Não vendemos dados pessoais. Os dados podem ser tratados por empresas
        que prestam serviços ao site, como o provedor de hospedagem e o Google
        (publicidade e medição de audiência), e por autoridades públicas quando houver obrigação
        legal. Alguns desses fornecedores guardam dados em servidores fora do
        Brasil, com as garantias previstas na LGPD para transferências
        internacionais.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Guardamos os dados apenas pelo tempo necessário para as finalidades
        acima ou pelo prazo exigido por lei, como o Marco Civil da Internet
        (Lei nº 12.965/2014).
      </p>

      <h2>Seus direitos</h2>
      <p>Pela LGPD, você pode a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>
          pedir a anonimização, o bloqueio ou a eliminação de dados
          desnecessários ou tratados em desacordo com a lei;
        </li>
        <li>pedir a portabilidade dos seus dados;</li>
        <li>saber com quem seus dados foram compartilhados;</li>
        <li>revogar o consentimento, quando ele for a base do tratamento;</li>
        <li>
          reclamar à Autoridade Nacional de Proteção de Dados (
          <a
            href="https://www.gov.br/anpd"
            target="_blank"
            rel="noopener noreferrer"
          >
            ANPD
          </a>
          ).
        </li>
      </ul>

      <h2>Contato</h2>
      {site.emailContato ? (
        <p>
          Para exercer seus direitos ou tirar dúvidas sobre esta política,
          escreva para{" "}
          <a href={`mailto:${site.emailContato}`}>{site.emailContato}</a>.
        </p>
      ) : (
        <p>
          Em breve, publicaremos aqui um e-mail para você exercer seus direitos
          ou tirar dúvidas sobre esta política.
        </p>
      )}

      <h2>Alterações</h2>
      <p>
        Esta política pode ser atualizada para refletir mudanças no site ou na
        legislação. A data da última atualização fica sempre no topo da
        página.
      </p>
    </PaginaDeTexto>
  );
}

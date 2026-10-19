import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist } from "next/font/google";
import { Cabecalho } from "@/components/cabecalho";
import { Rodape } from "@/components/rodape";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    template: `%s | ${site.nome}`,
    default: site.tituloPadrao,
  },
  description: site.descricao,
  applicationName: site.nome,
  verification: site.verificacaoGoogle
    ? { google: site.verificacaoGoogle }
    : undefined,
  // Permite que o Google confirme que o site pertence à conta do AdSense
  other: site.adsense ? { "google-adsense-account": site.adsense } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#fefcf7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Scripts assíncronos são levados para o <head> automaticamente pelo React */}
        {site.adsense && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsense}`}
            crossOrigin="anonymous"
          />
        )}
        <Cabecalho />
        <main className="flex flex-1 flex-col">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}

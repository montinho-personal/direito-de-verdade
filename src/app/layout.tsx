import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist } from "next/font/google";
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
  // Na Vercel, usa o domínio de produção (inclusive um domínio próprio, quando houver)
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: {
    template: "%s | Direito de Verdade",
    default: "Direito de Verdade: seus direitos, sem complicação",
  },
  description:
    "Informação jurídica clara, ferramentas práticas e orientações para situações da vida real.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

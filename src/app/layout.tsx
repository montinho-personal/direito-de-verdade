import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Direito de Verdade",
    default: "Direito de Verdade: seus direitos, sem complicação",
  },
  description:
    "Informação jurídica clara, ferramentas práticas e orientações para situações da vida real.",
};

export const viewport: Viewport = {
  themeColor: "#122c3b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

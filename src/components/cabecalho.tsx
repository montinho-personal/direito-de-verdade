import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { todosOsArtigos } from "@/lib/artigos";

export function Cabecalho() {
  const links = [
    ...(todosOsArtigos().length ? [{ href: "/artigos", texto: "Artigos" }] : []),
    { href: "/sobre", texto: "Sobre" },
  ];

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="inline-block shrink-0">
          <Image
            src={logo}
            alt="Direito de Verdade"
            loading="eager"
            className="h-12 w-auto sm:h-16"
          />
        </Link>
        <nav aria-label="Principal">
          <ul className="flex items-center gap-5 text-sm font-medium sm:gap-8 sm:text-base">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-accent">
                  {link.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

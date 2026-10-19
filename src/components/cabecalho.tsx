import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { todasAsCalculadoras, todosOsArtigos } from "@/lib/artigos";

export function Cabecalho() {
  const links = [
    ...(todosOsArtigos().length ? [{ href: "/artigos", texto: "Artigos" }] : []),
    ...(todasAsCalculadoras().length
      ? [{ href: "/calculadoras", texto: "Calculadoras" }]
      : []),
    // No celular não cabe: o "Sobre" continua no rodapé
    { href: "/sobre", texto: "Sobre", soNoComputador: true },
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
          <ul className="flex items-center gap-4 text-sm font-medium sm:gap-8 sm:text-base">
            {links.map((link) => (
              <li
                key={link.href}
                className={"soNoComputador" in link ? "max-sm:hidden" : undefined}
              >
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

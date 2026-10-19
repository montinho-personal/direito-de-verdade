import Link from "next/link";
import { site } from "@/lib/site";

const links = [
  { href: "/sobre", texto: "Sobre" },
  ...(site.emailContato ? [{ href: "/contato", texto: "Contato" }] : []),
  { href: "/politica-de-privacidade", texto: "Política de Privacidade" },
  { href: "/termos-de-uso", texto: "Termos de Uso" },
];

export function Rodape() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-8 text-sm text-muted">
        <nav aria-label="Links institucionais">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {link.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>
          O conteúdo deste site é informativo e não substitui a orientação de
          um advogado.
        </p>
        <p>© 2026 Direito de Verdade.</p>
      </div>
    </footer>
  );
}

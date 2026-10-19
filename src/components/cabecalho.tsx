import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";

export function Cabecalho() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto w-full max-w-5xl px-6 py-4">
        <Link href="/" className="inline-block">
          <Image
            src={logo}
            alt="Direito de Verdade"
            loading="eager"
            className="h-12 w-auto sm:h-16"
          />
        </Link>
      </div>
    </header>
  );
}

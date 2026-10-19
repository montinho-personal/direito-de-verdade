"use client";

import Image from "next/image";
import { useState } from "react";

// Mostra só a capa do vídeo; o player do YouTube (pesado) carrega quando a pessoa
// toca no play. Sem JavaScript, o link abre o vídeo no YouTube.
export function VideoDoYoutube({ id, titulo }: { id: string; titulo: string }) {
  const [tocando, setTocando] = useState(false);

  return (
    <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl border border-border bg-navy">
      {tocando ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          onClick={(evento) => {
            evento.preventDefault();
            setTocando(true);
          }}
          aria-label={`Assistir ao vídeo: ${titulo}`}
          className="group absolute inset-0 focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-gold"
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy/85 text-white shadow-lg transition-colors group-hover:bg-accent"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </a>
      )}
    </div>
  );
}

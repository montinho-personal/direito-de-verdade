import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Endereços antigos que mudaram de lugar (308: permanente, o Google passa a usar o novo)
  redirects() {
    return [
      {
        source: "/artigos/calculadora-13-salario",
        destination: "/calculadoras/13-salario",
        permanent: true,
      },
    ];
  },
  // Capa dos vídeos do YouTube, antes de a pessoa tocar no play
  images: {
    remotePatterns: [new URL("https://i.ytimg.com/vi/**")],
  },
  // Os artigos são lidos da pasta content/ também nas páginas geradas sob demanda
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

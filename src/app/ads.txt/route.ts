import { site } from "@/lib/site";

// Arquivo /ads.txt: declara que o AdSense está autorizado a vender anúncios neste site
export function GET() {
  if (!site.adsense) {
    return new Response("Not found", { status: 404 });
  }

  const idDoEditor = site.adsense.replace(/^ca-/, "");
  return new Response(`google.com, ${idDoEditor}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

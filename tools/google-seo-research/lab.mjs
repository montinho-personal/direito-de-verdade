// Abre o painel do laboratório em http://localhost:3210/seo-lab.
// Liga o painel (SEO_LAB=1) só neste processo e só na própria máquina (127.0.0.1).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const porta = process.env.SEO_LAB_PORTA || "3210";
console.log(`\nGoogle SEO Research Lab: http://localhost:${porta}/seo-lab\n`);
const next = spawn(
  process.execPath,
  [path.join(raiz, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", porta, "-H", "127.0.0.1"],
  { cwd: raiz, stdio: "inherit", env: { ...process.env, SEO_LAB: "1" } },
);
next.on("exit", (codigo) => process.exit(codigo ?? 0));

import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
// dist é gerado; o repositório, configurações e documentação ficam fora do site.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ["index.html", "pix.html", "obrigada.html", "admin.html", "assets"]) {
  await cp(path.join(root, name), path.join(output, name), {
    recursive: true,
    filter: source => !path.basename(source).startsWith("."),
  });
}
console.log("Site gerado em dist. Funções são empacotadas separadamente pelo Netlify.");

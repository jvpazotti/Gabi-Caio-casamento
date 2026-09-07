import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createService } from "../netlify/lib/mural-service.mjs";

// Somente local, sem token, sem API do Netlify e fora de dist.
const secret = "d".repeat(64);
const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const records = new Map();
const submissions = [
  { id: "demo-pending", data: { nome: "Exemplo — Ana", recado: "Que essa nova etapa seja cheia de parceria e boas histórias. Felicidades aos dois!", autoriza_mural: "sim" } },
  { id: "demo-private", data: { nome: "Exemplo — recado privado", recado: "Esta mensagem fica apenas com os noivos.", autoriza_mural: "" } },
  { id: "demo-text", data: { nome: "Exemplo — Bruno", recado: "Que não faltem motivos para sorrir e celebrar juntos. Muito amor nessa nova etapa!", autoriza_mural: "sim" } },
];
for (let i = 1; i <= 7; i++) records.set(`demo-${i}`, {
  id: `demo-${i}`, nome: `Exemplo — Convidado ${i}`, recado: i === 7 ? "Que a vida a dois seja leve, cheia de carinho e companheirismo. ".repeat(10) : "Muito amor, alegria e cumplicidade nessa caminhada. Estamos felizes em celebrar com vocês!",
  consent: true, status: "approved", approvedAt: `2026-09-0${i}T12:00:00Z`,
});
const service = createService({ secret,
  repository: { get: async id => records.get(id) || null, set: async (id, record) => { records.set(id, record); }, list: async () => [...records.values()] },
  upstream: { list: async (page, perPage) => submissions.slice((page - 1) * perPage, page * perPage) },
});
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:8005");
    if (url.pathname.startsWith("/.netlify/functions/")) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = new Request(url, { method: req.method, headers: req.headers, ...(req.method === "POST" ? { body: Buffer.concat(chunks) } : {}) });
      const response = await (url.pathname.endsWith("/mural-admin") ? service.adminHandler(request) : service.publicHandler(request));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(await response.text());
    }
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const data = Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()));
      if (data["form-name"] === "recados") submissions.unshift({ id: randomUUID(), data });
      res.writeHead(200);
      return res.end("Envio simulado localmente. Nenhuma notificação enviada.");
    }
    const requested = path.resolve(root, "." + decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
    if (!requested.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    let content = await readFile(requested);
    const type = mime[path.extname(requested)] || "application/octet-stream";
    if (type === "text/html") content = content.toString().replace("<body", '<body data-demo="true"').replace("</body>", '<aside style="position:fixed;bottom:0;left:0;right:0;z-index:200;background:#263a31;color:white;padding:10px;text-align:center;font:12px Arial">Prévia local · Recados fictícios · Nenhuma mensagem é enviada ao Netlify</aside></body>');
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(content);
  } catch { res.writeHead(404); res.end("Not found"); }
}).listen(8005, "127.0.0.1", () => console.log(`Prévia local: http://127.0.0.1:8005\nPainel: /admin.html\nSenha de demonstração: ${secret}`));

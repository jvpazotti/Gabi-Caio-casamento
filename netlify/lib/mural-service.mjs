import { timingSafeEqual } from "node:crypto";

const PAGE_SIZE = 20;
const safeID = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
export const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
class Problem extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function publicMessage(record) {
  if (!record || record.status !== "approved" || record.consent !== true || !safeID(record.id)) return null;
  const nome = text(record.nome, 120);
  const recado = text(record.recado, 4000);
  return nome && recado ? { id: record.id, nome, recado } : null;
}

export function createService({ repository, upstream, secret }) {
  async function published() {
    const records = await repository.list();
    return records.filter(record => publicMessage(record))
      .sort((a, b) => String(b.approvedAt).localeCompare(String(a.approvedAt)) || a.id.localeCompare(b.id));
  }
  async function publicHandler(request) {
    if (request.method !== "GET") return reply({ error: "Método não permitido." }, 405);
    try { return reply({ messages: (await published()).map(publicMessage) }); }
    catch { return reply({ error: "Mural temporariamente indisponível." }, 503); }
  }

  function authenticate(request) {
    if (!/^[a-f0-9]{64}$/i.test(secret || "")) throw new Problem(503, "O painel ainda precisa ser configurado no Netlify.");
    const value = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
    if (!/^[a-f0-9]{64}$/i.test(value) || !timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(secret, "hex"))) {
      throw new Problem(401, "Senha incorreta. Confira e tente novamente.");
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new Problem(403, "Origem não permitida.");
  }

  function pageNumber(value) {
    const page = Number(value || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw new Problem(400, "Página inválida.");
    return page;
  }

  async function getPage(page) {
    const submissions = await upstream.list(page, PAGE_SIZE);
    if (!Array.isArray(submissions)) throw new Error("Invalid provider response");
    return submissions.filter(item => safeID(item.id)).map(item => ({
      id: item.id,
      nome: text(item.data?.nome, 120),
      recado: text(item.data?.recado, 4000),
      consent: item.data?.autoriza_mural === "sim",
      receivedAt: text(item.created_at, 50),
    }));
  }

  async function adminHandler(request) {
    try {
      authenticate(request);
      if (request.method === "GET") {
        const url = new URL(request.url);
        if (url.searchParams.get("view") === "published") {
          return reply({ messages: (await published()).map(record => ({ ...publicMessage(record), consent: true, status: "approved" })), hasMore: false });
        }
        const page = pageNumber(url.searchParams.get("page"));
        const items = await getPage(page);
        const messages = await Promise.all(items.map(async item => ({ ...item, status: (await repository.get(item.id))?.status || "pending" })));
        return reply({ messages, page, hasMore: items.length === PAGE_SIZE });
      }
      if (request.method !== "POST") return reply({ error: "Método não permitido." }, 405);
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Problem(415, "Envie JSON.");
      const raw = await request.text();
      if (raw.length > 2048) throw new Problem(413, "Pedido muito grande.");
      let body;
      try { body = JSON.parse(raw); } catch { throw new Problem(400, "Pedido inválido."); }
      if (!body || !safeID(body.id) || !["approve", "hide"].includes(body.action)) throw new Problem(400, "Ação inválida.");
      const previous = await repository.get(body.id);
      let item;
      if (body.action === "hide" && previous) {
        item = previous;
      } else {
        // A busca no formulário recados do site evita aprovar conteúdo de RSVP
        // ou mensagens inventadas pelo cliente. A página pode mudar com novos envios.
        item = (await getPage(pageNumber(body.page))).find(entry => entry.id === body.id);
        if (!item) throw new Problem(409, "A lista mudou. Atualize os recados e tente novamente.");
      }
      if (body.action === "approve" && (!item.consent || !item.nome || !item.recado)) {
        throw new Problem(422, "Este recado não tem autorização de publicação ou está incompleto.");
      }
      const record = {
        id: item.id, nome: item.nome, recado: item.recado, consent: item.consent,
        status: body.action === "approve" ? "approved" : "hidden",
        approvedAt: body.action === "approve" ? new Date().toISOString() : previous?.approvedAt || "",
      };
      await repository.set(record.id, record);
      return reply({ id: record.id, status: record.status });
    } catch (error) {
      return reply({ error: error instanceof Problem ? error.message : "Não foi possível acessar os recados. Confira as configurações e tente novamente." }, error instanceof Problem ? error.status : 503);
    }
  }
  return { publicHandler, adminHandler };
}

export function netlifyUpstream({ siteID, token, fetcher = fetch }) {
  async function read(path) {
    if (!safeID(siteID) || !token) throw new Error("Missing configuration");
    const response = await fetcher(`https://api.netlify.com/api/v1/${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Provider unavailable");
    return response.json();
  }
  return {
    async list(page, perPage) {
      const forms = await read(`sites/${encodeURIComponent(siteID)}/forms`);
      const form = Array.isArray(forms) && forms.find(item => item.name === "recados" && safeID(item.id) && item.site_id === siteID);
      if (!form) throw new Error("Recados form not found");
      return read(`forms/${encodeURIComponent(form.id)}/submissions?page=${page}&per_page=${perPage}`);
    },
  };
}

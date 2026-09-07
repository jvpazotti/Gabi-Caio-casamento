import test from "node:test";
import assert from "node:assert/strict";
import { createService, netlifyUpstream } from "../netlify/lib/mural-service.mjs";

const secret = "a".repeat(64);
const submission = (id = "message-1", consent = "sim") => ({ id, data: { nome: "Ana", recado: "Felicidades!", autoriza_mural: consent, email: "privado@example.invalid", ip: "private" } });
function setup(submissions = [submission()]) {
  const records = new Map();
  const repository = { get: async id => records.get(id) || null, set: async (id, record) => { records.set(id, record); }, list: async () => [...records.values()] };
  const service = createService({ repository, secret, upstream: { list: async () => submissions } });
  const admin = (body, options = {}) => service.adminHandler(new Request("https://wedding.test/.netlify/functions/mural-admin" + (options.query || ""), {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${secret}`, ...(body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  const publicData = async () => (await service.publicHandler(new Request("https://wedding.test/.netlify/functions/mural"))).json();
  return { records, repository, service, admin, publicData };
}

test("recado enviado permanece privado até aprovação explícita", async () => {
  const app = setup();
  assert.deepEqual(await app.publicData(), { messages: [] });
  assert.equal((await (await app.admin()).json()).messages[0].status, "pending");
  assert.equal((await app.admin({ action: "approve", id: "message-1", page: 1 })).status, 200);
  assert.deepEqual(await app.publicData(), { messages: [{ id: "message-1", nome: "Ana", recado: "Felicidades!" }] });
});

test("retirar do mural persiste a decisão sem excluir a submissão", async () => {
  const app = setup();
  await app.admin({ action: "approve", id: "message-1" });
  await app.admin({ action: "hide", id: "message-1" });
  assert.equal(app.records.get("message-1").status, "hidden");
  assert.deepEqual((await app.publicData()).messages, []);
  assert.equal((await (await app.admin()).json()).messages.length, 1);
});

test("aprovação idempotente e reaprovação não duplicam recados", async () => {
  const app = setup();
  for (const action of ["approve", "approve", "hide", "approve"]) await app.admin({ action, id: "message-1" });
  assert.equal((await app.publicData()).messages.length, 1);
});

test("sem autorização, checkbox falsificado no pedido de aprovação não publica", async () => {
  const app = setup([submission("private", "")]);
  assert.equal((await app.admin({ action: "approve", id: "private", consent: true })).status, 422);
  assert.equal(app.records.size, 0);
});

test("não aceita mensagem nem identificação inventada ou de outra página", async () => {
  const app = setup();
  assert.equal((await app.admin({ action: "approve", id: "not-in-recados", nome: "fake", recado: "fake" })).status, 409);
  assert.equal((await app.admin({ action: "approve", id: "../../rsvp" })).status, 400);
  assert.equal((await app.admin({ action: "approve", id: "message-1", page: -1 })).status, 400);
});

test("conteúdo de publicação vem do servidor, não do navegador", async () => {
  const app = setup();
  await app.admin({ action: "approve", id: "message-1", nome: "fake", recado: "fake" });
  assert.equal((await app.publicData()).messages[0].nome, "Ana");
});

test("senha e origem são verificadas antes de ler dados privados", async () => {
  const app = setup();
  assert.equal((await app.admin(null, { headers: { Authorization: "" } })).status, 401);
  assert.equal((await app.admin(null, { headers: { Authorization: `Bearer ${"b".repeat(64)}` } })).status, 401);
  assert.equal((await app.admin({ action: "approve", id: "message-1" }, { headers: { Origin: "https://other.test" } })).status, 403);
  assert.equal(app.records.size, 0);
});

test("painel falha fechado se senha estiver ausente ou for fraca", async () => {
  for (const value of [undefined, "casamento123"]) {
    const app = createService({ repository: {}, upstream: {}, secret: value });
    assert.equal((await app.adminHandler(new Request("https://wedding.test/admin"))).status, 503);
  }
});

test("mural filtra decisões privadas e expõe somente nome, recado e id", async () => {
  const app = setup();
  app.records.set("public", { id: "public", status: "approved", consent: true, nome: "Ana", recado: "Olá", email: "secret", ip: "secret", approvedAt: "2026-09-06" });
  app.records.set("private", { id: "private", status: "hidden", consent: true, nome: "Caio", recado: "privado" });
  app.records.set("no-consent", { id: "no-consent", status: "approved", nome: "No", recado: "No" });
  assert.deepEqual((await app.publicData()).messages, [{ id: "public", nome: "Ana", recado: "Olá" }]);
});

test("falha de armazenamento não anuncia aprovação bem-sucedida", async () => {
  const app = setup();
  app.repository.set = async () => { throw new Error("token-secret"); };
  const response = await app.admin({ action: "approve", id: "message-1" });
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("token-secret"));
});

test("paginação indica quando buscar mais recados", async () => {
  const app = setup(Array.from({ length: 20 }, (_, i) => submission(`id-${i}`)));
  assert.equal((await (await app.admin()).json()).hasMore, true);
});

test("API lê exclusivamente o formulário recados do site configurado", async () => {
  const calls = [];
  const upstream = netlifyUpstream({ siteID: "site-one", token: "private-token", fetcher: async (url, options) => {
    calls.push(url);
    assert.equal(options.headers.Authorization, "Bearer private-token");
    return Response.json(url.endsWith("/forms") ? [
      { id: "rsvp", name: "rsvp", site_id: "site-one" },
      { id: "foreign", name: "recados", site_id: "site-two" },
      { id: "right", name: "recados", site_id: "site-one" },
    ] : []);
  } });
  await upstream.list(2, 20);
  assert.equal(calls[1], "https://api.netlify.com/api/v1/forms/right/submissions?page=2&per_page=20");
});

test("falha na API não usa rsvp como alternativa", async () => {
  const upstream = netlifyUpstream({ siteID: "site-one", token: "private-token", fetcher: async () => Response.json([{ id: "rsvp", name: "rsvp", site_id: "site-one" }]) });
  await assert.rejects(() => upstream.list(1, 20));
});

import { getStore } from "@netlify/blobs";
import { createService, netlifyUpstream } from "./mural-service.mjs";

export function service(context = {}) {
  // Site-wide: as aprovações permanecem entre deploys. Leituras fortes tornam
  // uma retirada visível na próxima consulta, sem cache público de mensagens.
  const store = () => getStore({ name: "wedding-guestbook", consistency: "strong" });
  const repository = {
    get: id => store().get(`decisions/${id}`, { type: "json" }),
    set: (id, value) => store().setJSON(`decisions/${id}`, value),
    async list() {
      const records = [];
      const storage = store();
      for await (const page of storage.list({ prefix: "decisions/", paginate: true })) {
        const batch = await Promise.all(page.blobs.map(blob => storage.get(blob.key, { type: "json" })));
        records.push(...batch.filter(Boolean));
      }
      return records;
    },
  };
  return createService({
    repository,
    secret: process.env.MURAL_ADMIN_SECRET,
    upstream: netlifyUpstream({ siteID: context.site?.id || process.env.SITE_ID, token: process.env.MURAL_NETLIFY_TOKEN }),
  });
}

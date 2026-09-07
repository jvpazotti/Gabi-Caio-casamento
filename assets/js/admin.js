(() => {
  const login = document.getElementById("admin-login");
  const password = document.getElementById("admin-password");
  const dashboard = document.getElementById("admin-dashboard");
  const list = document.getElementById("admin-list");
  const status = document.getElementById("admin-status");
  const title = document.getElementById("admin-list-title");
  const previous = document.getElementById("admin-previous");
  const next = document.getElementById("admin-next");
  let secret = "";
  let generation = 0;
  let page = 1;
  let view = "inbox";
  let busy = false;
  let expiry;
  const pending = new Set();
  class PanelError extends Error {}

  function message(value, error = false) {
    status.textContent = value;
    status.dataset.error = String(error);
  }
  function setBusy(value) {
    busy = value;
    document.querySelectorAll("button:not(#admin-logout)").forEach(button => { button.disabled = value; });
    dashboard.setAttribute("aria-busy", String(value));
  }
  function logout(note = "Você saiu do painel.") {
    generation++;
    secret = "";
    password.value = "";
    clearTimeout(expiry);
    pending.forEach(controller => controller.abort());
    pending.clear();
    list.replaceChildren();
    dashboard.hidden = true;
    login.hidden = false;
    setBusy(false);
    message(note);
    password.focus();
  }
  function touch() {
    clearTimeout(expiry);
    expiry = setTimeout(() => logout("Por segurança, entre novamente para continuar."), 30 * 60 * 1000);
  }
  async function request(query = "", body) {
    const version = generation;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    pending.add(controller);
    try {
      const response = await fetch(`/.netlify/functions/mural-admin${query}`, {
        method: body ? "POST" : "GET",
        headers: { Authorization: `Bearer ${secret}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store", signal: controller.signal,
      });
      if (version !== generation) throw new PanelError("Sessão encerrada.");
      const data = await response.json();
      if (version !== generation) throw new PanelError("Sessão encerrada.");
      if (!response.ok) {
        if (response.status === 401) logout("Entre novamente para continuar.");
        throw new PanelError(data.error || "Não foi possível concluir. Tente novamente.");
      }
      touch();
      return data;
    } catch (error) {
      if (error instanceof PanelError) throw error;
      throw new PanelError("Não conseguimos conectar ao painel. Confira sua conexão e tente novamente.");
    } finally { clearTimeout(timeout); pending.delete(controller); }
  }

  function render(items) {
    list.replaceChildren();
    for (const item of items) {
      const card = document.createElement("article");
      card.className = "admin-card";
      const name = document.createElement("h3");
      name.textContent = item.nome || "Sem nome";
      const badge = document.createElement("span");
      badge.className = "admin-badge";
      badge.textContent = !item.consent ? "Sem autorização para o mural" : item.status === "approved" ? "Publicado no mural" : item.status === "hidden" ? "Mantido privado" : "Aguardando aprovação";
      const quote = document.createElement("blockquote");
      quote.textContent = item.recado || "Recado vazio";
      const actions = document.createElement("div");
      actions.className = "admin-actions";
      if (item.consent && item.nome && item.recado && item.status !== "approved") {
        const approve = document.createElement("button");
        approve.type = "button";
        approve.className = "primary-button";
        approve.textContent = "Publicar no mural";
        approve.addEventListener("click", () => moderate(item.id, "approve"));
        actions.append(approve);
      }
      if (item.status === "approved" || item.consent && item.status !== "hidden") {
        const hide = document.createElement("button");
        hide.type = "button";
        hide.textContent = item.status === "approved" ? "Retirar do mural" : "Manter privado";
        hide.addEventListener("click", () => moderate(item.id, "hide"));
        actions.append(hide);
      }
      card.append(name, badge, quote, actions);
      list.append(card);
    }
    document.getElementById("admin-empty").hidden = items.length !== 0;
  }

  async function load() {
    const data = await request(`?view=${view}&page=${page}`);
    if (!Array.isArray(data.messages)) throw new Error("Resposta inválida. Confira se as funções foram publicadas no Netlify.");
    render(data.messages);
    title.textContent = view === "inbox" ? "Recados recebidos" : "Recados publicados";
    document.querySelectorAll("[data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
    previous.hidden = view !== "inbox" || page === 1;
    next.hidden = view !== "inbox" || !data.hasMore;
    document.getElementById("admin-page-label").textContent = view === "inbox" ? `Página ${page}` : `${data.messages.length} recado(s)`;
  }
  async function refresh(change) {
    if (busy) return;
    const before = { page, view };
    change?.();
    setBusy(true);
    message("Carregando recados…");
    try { await load(); message(""); }
    catch (error) { page = before.page; view = before.view; message(error.message, true); }
    finally { setBusy(false); }
  }
  async function moderate(id, action) {
    if (busy) return;
    setBusy(true);
    message("Salvando…");
    try {
      await request("", { id, action, page });
      const saved = action === "approve" ? "Recado publicado no mural." : "Recado mantido privado.";
      try { await load(); message(saved); title.focus(); }
      catch { list.replaceChildren(); message(`${saved} Atualize a lista para conferir.`, true); }
    } catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  }

  login.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !login.reportValidity()) return;
    secret = password.value.trim();
    page = 1;
    view = "inbox";
    setBusy(true);
    message("Entrando…");
    try {
      await load();
      password.value = "";
      login.hidden = true;
      dashboard.hidden = false;
      message("");
      title.focus();
    } catch (error) { secret = ""; message(error.message, true); }
    finally { setBusy(false); }
  });
  document.getElementById("admin-logout").addEventListener("click", () => logout());
  document.getElementById("admin-refresh").addEventListener("click", () => refresh());
  previous.addEventListener("click", () => refresh(() => { page--; }));
  next.addEventListener("click", () => refresh(() => { page++; }));
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => refresh(() => { view = button.dataset.view; page = 1; })));
  window.addEventListener("pagehide", () => logout("Entre para administrar os recados."));
})();

(() => {
  const list = document.getElementById("mural-list");
  const status = document.getElementById("mural-status");
  const more = document.getElementById("mural-more");
  const retry = document.getElementById("mural-retry");
  let messages = [];
  let shown = 0;
  let loading = false;

  function state(key) {
    status.dataset.i18n = key;
    status.textContent = weddingText(key);
    status.hidden = false;
  }

  function makeCard(message) {
    const card = document.createElement("article");
    card.className = "mural-card";
    card.tabIndex = -1;
    const quote = document.createElement("blockquote");
    const paragraph = document.createElement("p");
    paragraph.textContent = message.recado;
    quote.append(paragraph);
    if (message.recado.length > 180) {
      paragraph.textContent = message.recado.slice(0, 180) + "…";
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.dataset.i18n = "muralReadMore";
      summary.textContent = weddingText("muralReadMore");
      const full = document.createElement("p");
      full.textContent = message.recado;
      details.append(summary, full);
      details.addEventListener("toggle", () => {
        paragraph.hidden = details.open;
        summary.dataset.i18n = details.open ? "muralReadLess" : "muralReadMore";
        summary.textContent = weddingText(summary.dataset.i18n);
      });
      quote.append(details);
    }
    const name = document.createElement("p");
    name.className = "mural-author";
    name.textContent = message.nome;
    card.append(quote, name);
    return card;
  }

  function showMore(focus = false) {
    const batch = messages.slice(shown, shown + 6).map(makeCard);
    list.append(...batch);
    shown += batch.length;
    more.hidden = shown >= messages.length;
    if (focus) batch[0]?.focus();
  }

  async function load() {
    if (loading) return;
    loading = true;
    list.hidden = true;
    more.hidden = true;
    retry.hidden = true;
    state("muralLoading");
    try {
      const response = await fetch("/.netlify/functions/mural", { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Unavailable");
      const data = await response.json();
      if (!Array.isArray(data.messages)) throw new Error("Invalid response");
      messages = data.messages.filter(item => item && typeof item.nome === "string" && typeof item.recado === "string" && item.nome.trim() && item.recado.trim());
      shown = 0;
      list.replaceChildren();
      if (!messages.length) state("muralEmpty");
      else {
        status.hidden = true;
        list.hidden = false;
        showMore();
      }
    } catch { state("muralError"); retry.hidden = false; }
    finally { loading = false; }
  }
  more.addEventListener("click", () => showMore(true));
  retry.addEventListener("click", load);
  window.addEventListener("pageshow", load);
})();

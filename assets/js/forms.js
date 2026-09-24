// Netlify Forms: mantém o formulário de recados e aceita a ausência do RSVP,
// que nesta versão será confirmado pela assessoria via WhatsApp.
(() => {
  const rsvp = document.getElementById("rsvp-form");
  const details = document.getElementById("attending-details");
  const food = document.getElementById("food");

  function updateAttendance() {
    if (!rsvp || !details || !food) return;
    const attending = rsvp.querySelector('[name="presenca"]:checked')?.value === "sim";
    details.hidden = !attending;
    food.disabled = !attending;
    if (!attending) food.value = "";
  }

  if (rsvp) {
    rsvp.addEventListener("change", updateAttendance);
    window.addEventListener("pageshow", updateAttendance);
    updateAttendance();
  }

  function attachForm(prefix, labelKey) {
    const form = document.getElementById(`${prefix}-form`);
    const button = document.getElementById(`${prefix}-submit`);
    const success = document.getElementById(`${prefix}-success`);
    const error = document.getElementById(`${prefix}-error`);
    const another = document.getElementById(`${prefix}-another`);
    if (!form || !button || !success || !error || !another) return;

    let sending = false;
    let completed = false;

    function refreshButton() {
      button.dataset.i18n = sending ? "sending" : labelKey;
      button.textContent = weddingText(button.dataset.i18n);
    }

    form.querySelectorAll('input[required][type="text"], textarea[required]').forEach(field => {
      const validate = () => field.setCustomValidity(field.value && !field.value.trim() ? weddingText("blankField") : "");
      field.addEventListener("input", validate);
      window.addEventListener("weddinglanguagechange", validate);
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (sending || completed || !form.reportValidity()) return;
      const data = new URLSearchParams();
      new FormData(form).forEach((value, key) => data.append(key, String(value).trim()));
      sending = true;
      error.hidden = true;
      button.disabled = true;
      form.setAttribute("aria-busy", "true");
      refreshButton();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: data.toString(),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        completed = true;
        form.hidden = true;
        success.hidden = false;
        success.focus();
      } catch {
        error.hidden = false;
      } finally {
        clearTimeout(timeout);
        sending = false;
        button.disabled = false;
        form.removeAttribute("aria-busy");
        refreshButton();
      }
    });

    another.addEventListener("click", () => {
      form.reset();
      form.querySelectorAll("input, textarea").forEach(field => field.setCustomValidity(""));
      completed = false;
      success.hidden = true;
      error.hidden = true;
      form.hidden = false;
      if (prefix === "rsvp") updateAttendance();
      form.querySelector('input[name="nome"]')?.focus();
    });
  }

  attachForm("rsvp", "confirmAttendance");
  attachForm("recados", "sendMessage");
})();

(() => {
  const config = window.PIX_CONFIG || {};
  const code = typeof config.copyPaste === "string" ? config.copyPaste.trim() : "";
  const imagePath = typeof config.qrImage === "string" ? config.qrImage.trim() : "";
  const keyText = typeof config.key === "string" ? config.key.trim() : "";
  const keyCopy = typeof config.keyCopy === "string" && config.keyCopy.trim() ? config.keyCopy.trim() : keyText;
  const pending = document.getElementById("pix-pending");
  const payment = document.getElementById("pix-payment");
  const qr = document.getElementById("pix-qr");
  const image = document.getElementById("pix-qr-image");
  const codeField = document.getElementById("pix-code");
  const status = document.getElementById("pix-copy-status");
  let imageReady = false;

  function updateAvailability() {
    const available = imageReady || Boolean(code) || Boolean(keyText);
    pending.hidden = available;
    payment.hidden = !available;
    qr.hidden = !imageReady;
    image.hidden = !imageReady;
  }

  if (imagePath) {
    image.addEventListener("load", () => { imageReady = true; updateAvailability(); });
    image.addEventListener("error", () => { imageReady = false; updateAvailability(); });
    image.src = imagePath;
  }
  if (typeof config.recipient === "string" && config.recipient.trim()) {
    const recipient = document.getElementById("pix-recipient");
    recipient.textContent = config.recipient.trim();
    recipient.hidden = false;
  }
  codeField.value = code;
  document.getElementById("pix-copy-area").hidden = !code;
  updateAvailability();

  const message = key => translations[document.documentElement.lang === "en" ? "en" : "pt"][key];
  document.getElementById("pix-copy").addEventListener("click", async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      status.textContent = message("pixCopied");
    } catch {
      codeField.focus();
      codeField.select();
      codeField.setSelectionRange(0, codeField.value.length);
      status.textContent = message("pixCopyManual");
    }
  });

  const keyStatus = document.getElementById("pix-key-status");
  if (keyText) {
    document.getElementById("pix-key").textContent = keyText;
    document.getElementById("pix-key-area").hidden = false;
  }
  document.getElementById("pix-copy-key").addEventListener("click", async () => {
    if (!keyCopy) return;
    try {
      await navigator.clipboard.writeText(keyCopy);
      keyStatus.textContent = message("pixKeyCopied");
    } catch {
      keyStatus.textContent = message("pixKeyCopyManual");
    }
  });
  window.addEventListener("weddinglanguagechange", () => { status.textContent = ""; keyStatus.textContent = ""; });
})();

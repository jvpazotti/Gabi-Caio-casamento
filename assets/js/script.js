const weddingDate = new Date("2027-04-24T16:30:00-03:00");

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function updateCountdown() {
  const now = new Date();
  const distance = weddingDate - now;

  if (distance <= 0) {
    document.getElementById("days").textContent = "000";
    document.getElementById("hours").textContent = "00";
    document.getElementById("minutes").textContent = "00";
    document.getElementById("seconds").textContent = "00";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  document.getElementById("days").textContent = pad(days, 3);
  document.getElementById("hours").textContent = pad(hours);
  document.getElementById("minutes").textContent = pad(minutes);
  document.getElementById("seconds").textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

function setMenuOpen(isOpen) {
  navLinks.classList.toggle("open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.dataset.i18nAria = isOpen ? "closeMenu" : "openMenu";
  menuButton.setAttribute("aria-label", weddingText(menuButton.dataset.i18nAria));
}
menuButton.addEventListener("click", () => setMenuOpen(!navLinks.classList.contains("open")));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    setMenuOpen(false);
    menuButton.focus();
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest(".nav-shell")) setMenuOpen(false);
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    setMenuOpen(false);
  });
});

// Links internos: o conteúdo de cada seção para sempre à mesma distância da barra do topo,
// qualquer que seja o espaçamento interno da seção.
const navShell = document.querySelector(".nav-shell");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Posição na página, sem depender da rolagem atual.
function pageTop(el) {
  let top = 0;
  for (let node = el; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}

function anchorTop(target) {
  const blocks = [...target.children].filter(el => !el.matches("[aria-hidden='true'], .svg-sprite") && el.getClientRects().length);
  const barHeight = navShell.getBoundingClientRect().bottom;
  const gap = window.innerWidth <= 850 ? 28 : 44;
  const sectionTop = pageTop(target) - barHeight;
  const contentTop = Math.min(...blocks.map(pageTop), pageTop(target) + target.offsetHeight);
  return Math.max(sectionTop, contentTop - barHeight - gap);
}

function scrollToSection(target, smooth) {
  window.scrollTo({ top: anchorTop(target), behavior: smooth && !reduceMotion.matches ? "smooth" : "auto" });
}

document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const id = decodeURIComponent(link.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target || target.id === "conteudo" || target.id === "inicio") return;
  event.preventDefault();
  setMenuOpen(false);
  history.pushState(null, "", `#${id}`);
  scrollToSection(target, true);
});

// Ao abrir o site já com um endereço de seção (ex.: voltando da página Pix).
window.addEventListener("load", () => {
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target && target.id !== "inicio") scrollToSection(target, false);
});

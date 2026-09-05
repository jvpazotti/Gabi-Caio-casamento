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

const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  reveals.forEach(el => {
    el.classList.add("pending-reveal");
    observer.observe(el);
  });
} else {
  reveals.forEach(el => el.classList.add("visible"));
}

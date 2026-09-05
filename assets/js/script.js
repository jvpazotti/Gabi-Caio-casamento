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

menuButton.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
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

  reveals.forEach(el => observer.observe(el));
} else {
  reveals.forEach(el => el.classList.add("visible"));
}


// V7 — RSVP simples, uma pessoa por envio, sem redirecionamento
const v7RsvpForm = document.getElementById("rsvp-form");
const v7AttendingDetails = document.getElementById("attending-details");
const v7RsvpSuccess = document.getElementById("rsvp-success");
const v7RsvpError = document.getElementById("rsvp-error");
const v7RsvpSubmit = document.getElementById("rsvp-submit");

function updateV7RsvpFields() {
  const choice = document.querySelector('input[name="presenca"]:checked')?.value;
  const attending = choice === "sim";
  if (v7AttendingDetails) v7AttendingDetails.hidden = !attending;
  if (!attending) {
    const food = document.getElementById("food");
    if (food) food.value = "";
  }
}

document.querySelectorAll('input[name="presenca"]').forEach(radio => {
  radio.addEventListener("change", updateV7RsvpFields);
});

if (v7RsvpForm) {
  v7RsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    v7RsvpError.hidden = true;
    v7RsvpSubmit.disabled = true;

    const formData = new FormData(v7RsvpForm);
    const encoded = new URLSearchParams();
    formData.forEach((value, key) => encoded.append(key, value));

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encoded.toString()
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      v7RsvpForm.hidden = true;
      v7RsvpSuccess.hidden = false;
      v7RsvpSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("RSVP submission error:", error);
      v7RsvpError.hidden = false;
      v7RsvpSubmit.disabled = false;
    }
  });
}

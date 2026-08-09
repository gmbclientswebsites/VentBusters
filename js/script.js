(function () {
  "use strict";

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobileNav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var isOpen = !mobileNav.hidden;
      mobileNav.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Only one FAQ item open at a time
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  // Lead forms: basic client-side handling.
  // NOTE: replace each form's `action` with a real endpoint (Formspree,
  // Netlify Forms, your CRM, etc.) before publishing — this script only
  // manages the success message UI, it does not send the data anywhere
  // on its own.
  ["quoteForm", "contactForm"].forEach(function (formId) {
    var form = document.getElementById(formId);
    var successEl = form ? form.querySelector(".form-success") : null;
    if (form && successEl) {
      form.addEventListener("submit", function () {
        window.setTimeout(function () {
          successEl.classList.add("show");
          successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      });
    }
  });
})();

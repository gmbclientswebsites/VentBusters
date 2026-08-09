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

  // Lead forms.
  //
  // The success banner is shown ONLY after the endpoint actually accepts the
  // submission. Never show it optimistically: if the endpoint is unreachable
  // or still the placeholder, the visitor must be told the request did not go
  // through and given the phone number, otherwise the lead is lost silently
  // while the page claims it succeeded.
  //
  // TO GO LIVE: replace YOUR_FORM_ID in the `action` of both forms
  // (index.html #quoteForm, contact.html #contactForm) with a real endpoint.
  var PLACEHOLDER = /YOUR_FORM_ID/;

  ["quoteForm", "contactForm"].forEach(function (formId) {
    var form = document.getElementById(formId);
    if (!form) return;
    var successEl = form.querySelector(".form-success");
    if (!successEl) return;

    var errorEl = document.createElement("div");
    errorEl.className = "form-error";
    errorEl.setAttribute("role", "alert");
    errorEl.hidden = true;
    successEl.parentNode.insertBefore(errorEl, successEl.nextSibling);

    function fail(msg) {
      successEl.classList.remove("show");
      errorEl.innerHTML =
        "⚠️ " + msg +
        ' Please call <a href="tel:+15614484648"><strong>(561) 448-4648</strong></a>' +
        ' or email <a href="mailto:Ventbusters@gmail.com">Ventbusters@gmail.com</a>.';
      errorEl.hidden = false;
      errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var action = form.getAttribute("action") || "";
      if (!action || PLACEHOLDER.test(action)) {
        fail("This form isn't connected yet, so your message was not sent.");
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.textContent : null;
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      errorEl.hidden = true;

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          successEl.classList.add("show");
          successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function () {
          fail("Sorry — we couldn't send that just now.");
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });
})();

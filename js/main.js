/* SHENDI FOUNDATION — redesign.js
   Vanilla JS only: no jQuery / Bootstrap / Owl Carousel dependency.
   Each feature below is wrapped in its own try/catch so a problem in one
   (a missing element, a typo, a browser quirk) can never stop the rest
   of the script — or the page's content — from working. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");

  /* ---------------- sticky header shadow ---------------- */
  try {
    function onScroll() {
      if (!header) return;
      if (window.scrollY > 30) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  } catch (err) { console.error("header scroll:", err); }

  /* ---------------- mobile off-canvas menu ---------------- */
  try {
    var menuToggle = document.querySelector(".menu-toggle");
    var mobileNav = document.querySelector(".mobile-nav");
    var closeBtn = mobileNav ? mobileNav.querySelector(".close-btn") : null;
    var scrim = document.querySelector(".scrim");

    function openMenu() {
      if (!mobileNav) return;
      mobileNav.classList.add("is-open");
      if (scrim) scrim.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      if (!mobileNav) return;
      mobileNav.classList.remove("is-open");
      if (scrim) scrim.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    if (menuToggle) menuToggle.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (scrim) scrim.addEventListener("click", closeMenu);
    if (mobileNav) {
      mobileNav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.__closeMenu = closeMenu; // exposed for the smooth-scroll handler below
  } catch (err) { console.error("mobile menu:", err); }

  /* ---------------- hero crossfade slider ---------------- */
  try {
    var slides = document.querySelectorAll(".hero-slide");
    var dots = document.querySelectorAll(".hero-dots button");
    var current = 0;
    function showSlide(i) {
      slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === i); });
      current = i;
    }
    if (slides.length) {
      showSlide(0);
      if (!reduceMotion) {
        setInterval(function () { showSlide((current + 1) % slides.length); }, 5500);
      }
      dots.forEach(function (d, idx) {
        d.addEventListener("click", function () { showSlide(idx); });
      });
    }
  } catch (err) { console.error("hero slider:", err); }

  /* ---------------- animated counters ---------------- */
  try {
    var counters = document.querySelectorAll(".count");
    function animateCount(el) {
      var target = Number(el.getAttribute("data-target"));
      if (isNaN(target)) return;
      if (reduceMotion) {
        el.textContent = target.toLocaleString();
        return;
      }
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        el.textContent = Math.floor(progress * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
      }
      requestAnimationFrame(step);
    }
    if (counters.length && "IntersectionObserver" in window) {
      var countIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (c) { countIo.observe(c); });
    }
  } catch (err) { console.error("counters:", err); }

  /* ---------------- smooth scroll with header offset ---------------- */
  try {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = (header ? header.offsetHeight : 0) + 12;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
        if (window.__closeMenu) window.__closeMenu();
      });
    });
  } catch (err) { console.error("smooth scroll:", err); }

  /* ---------------- contact form mailto ---------------- */
  try {
    window.sendMail = function () {
      var firstName = (document.getElementById("first-name") || {}).value || "";
      var lastName = (document.getElementById("last-name") || {}).value || "";
      var email = (document.getElementById("email") || {}).value || "";
      var message = (document.getElementById("message") || {}).value || "";

      var subject = encodeURIComponent("Contact Form Submission from " + firstName + " " + lastName);
      var body = encodeURIComponent(
        "Name: " + firstName + " " + lastName + "\n" +
        "Email: " + email + "\n\n" +
        "Message:\n" + message
      );
      window.location.href = "mailto:shendifoundation1@gmail.com?subject=" + subject + "&body=" + body;
    };
  } catch (err) { console.error("contact form:", err); }

  /* ---------------- dynamic timeline (optional enhancement) ----------------
     The two timeline entries in the HTML are a permanent fallback and are
     never removed by anything below. If the Netlify Function responds with
     at least one entry, that becomes the source of truth and replaces the
     fallback. If the function isn't deployed yet, is offline, or returns
     nothing, the static fallback simply stays exactly as it is. */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function buildTimelineItemHTML(entry) {
    var d = entry.date ? new Date(entry.date + "T00:00:00") : null;
    var day = d && !isNaN(d) ? d.getDate() : "";
    var month = d && !isNaN(d) ? d.toLocaleString("en-US", { month: "short" }) + " " + d.getFullYear() : "";
    var img = entry.image || "images/MAIN.jpg";
    return (
      '<div class="timeline-item">' +
        '<div class="timeline-media"><img src="' + escapeHtml(img) + '" alt=""></div>' +
        '<div class="medal"><span class="d">' + escapeHtml(day) + '</span><span class="m">' + escapeHtml(month) + "</span></div>" +
        '<div class="timeline-copy">' +
          '<div class="meta-row">' +
            '<span><span class="icon-clock-o"></span>' + escapeHtml(entry.time || "") + "</span>" +
            '<span><span class="icon-room"></span>' + escapeHtml(entry.location || "") + "</span>" +
          "</div>" +
          "<h3>" + escapeHtml(entry.description || "") + "</h3>" +
        "</div>" +
      "</div>"
    );
  }
  try {
    var timelineList = document.getElementById("timeline-list");
    if (timelineList && window.fetch) {
      fetch("/.netlify/functions/timeline?_=" + Date.now())
        .then(function (res) {
          if (!res.ok) throw new Error("timeline fetch failed (" + res.status + ")");
          return res.json();
        })
        .then(function (entries) {
          console.log("[SHENDI timeline] fetched", entries.length, "entries from function");
          if (Array.isArray(entries) && entries.length > 0) {
            timelineList.innerHTML = entries.map(buildTimelineItemHTML).join("");
            console.log("[SHENDI timeline] public page updated with live entries");
          } else {
            console.log("[SHENDI timeline] no entries returned — keeping static fallback");
          }
        })
        .catch(function (err) {
          console.warn("[SHENDI timeline] fetch failed, keeping static fallback:", err.message);
        });
    }
  } catch (err) { console.error("dynamic timeline:", err); }

  /* ---------------- footer year ---------------- */
  try {
    document.querySelectorAll(".current-year").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  } catch (err) { console.error("footer year:", err); }
})();

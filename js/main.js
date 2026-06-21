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
  /* ---------------- horizontal timeline drag + arrow nav ---------------- */
  try {
    var tl = document.getElementById("timeline-list");
    if (tl) {
      // drag to scroll
      var isDown = false, startX, scrollLeft;
      tl.addEventListener("mousedown", function (e) {
        isDown = true; startX = e.pageX - tl.offsetLeft; scrollLeft = tl.scrollLeft;
      });
      tl.addEventListener("mouseleave", function () { isDown = false; });
      tl.addEventListener("mouseup",    function () { isDown = false; });
      tl.addEventListener("mousemove",  function (e) {
        if (!isDown) return;
        e.preventDefault();
        tl.scrollLeft = scrollLeft - (e.pageX - tl.offsetLeft - startX);
      });
      // arrow buttons
      var STEP = 340;
      var prevBtn = document.getElementById("tl-prev");
      var nextBtn = document.getElementById("tl-next");
      if (prevBtn) prevBtn.addEventListener("click", function () {
        tl.scrollBy({ left: -STEP, behavior: "smooth" });
      });
      if (nextBtn) nextBtn.addEventListener("click", function () {
        tl.scrollBy({ left: STEP, behavior: "smooth" });
      });
    }
  } catch (err) { console.error("timeline nav:", err); }

  /* ---------------- footer year ---------------- */
  try {
    document.querySelectorAll(".current-year").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  } catch (err) { console.error("footer year:", err); }
})();

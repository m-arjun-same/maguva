/* MAGUVA — own application script.
   Motion system: GSAP + ScrollTrigger + ScrollSmoother + SplitText, Swiper sliders. */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.add("loader-locked");

  /* ---------- Preloader ---------- */
  var percentEl = document.getElementById("preloaderPercent");
  var barEl = document.getElementById("preloaderBar");
  var loaderFinished = false;

  function finishLoader() {
    if (loaderFinished) return;
    loaderFinished = true;
    if (window.__loaderFailsafe) { clearTimeout(window.__loaderFailsafe); }
    html.classList.add("loader-done");
    html.classList.remove("loader-locked");
    if (window.ScrollTrigger) { setTimeout(function () { ScrollTrigger.refresh(); }, 450); }
    startHeroIntro();
  }

  function runLoaderCounter() {
    var state = { v: 0 };
    if (window.gsap) {
      gsap.to(state, {
        v: 100, duration: 1.5, ease: "power2.out",
        onUpdate: function () {
          var v = Math.round(state.v);
          if (percentEl) percentEl.textContent = v + "%";
          if (barEl) barEl.style.width = v + "%";
        },
        onComplete: function () { setTimeout(finishLoader, 200); }
      });
    } else {
      var v = 0;
      var tick = setInterval(function () {
        v += 10;
        if (percentEl) percentEl.textContent = v + "%";
        if (barEl) barEl.style.width = v + "%";
        if (v >= 100) { clearInterval(tick); finishLoader(); }
      }, 90);
    }
  }

  /* ---------- GSAP setup ---------- */
  var smoother = null;
  var heroIntroStarted = false;

  function startHeroIntro() {
    if (heroIntroStarted) return;
    heroIntroStarted = true;
    if (!window.gsap) return;
    var title = document.querySelector(".hero-title");
    if (title && window.SplitText) {
      try {
        var split = new SplitText(title, { type: "lines", linesClass: "hero-line" });
        gsap.from(split.lines, {
          yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.12, delay: 0.15
        });
      } catch (e) { /* title stays visible without the split */ }
    }
    gsap.from(".hero-sub, .hero-header .button", {
      y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.45
    });
    gsap.from(".hero-footer", { opacity: 0, duration: 1.2, ease: "power2.out", delay: 0.7 });
  }

  function initMotion() {
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.ScrollSmoother) {
      gsap.registerPlugin(ScrollSmoother);
      try {
        smoother = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 1.1,
          effects: true,
          normalizeScroll: true
        });
      } catch (e) { smoother = null; }
    }
    if (window.SplitText) { gsap.registerPlugin(SplitText); }

    /* Header state */
    ScrollTrigger.create({
      start: 90,
      end: "max",
      toggleClass: { className: "header--solid", targets: "#siteHeader" }
    });

    /* Section reveals */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    /* Ken Burns film: two stills crossfading with a slow push-in */
    var kb1 = document.querySelector(".kb-1");
    var kb2 = document.querySelector(".kb-2");
    if (kb1 && kb2) {
      var kb = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      kb.fromTo(kb1, { scale: 1.02 }, { scale: 1.14, duration: 7, ease: "none" }, 0)
        .to(kb2, { opacity: 1, duration: 1.6, ease: "power2.inOut" }, 6.2)
        .fromTo(kb2, { scale: 1.14 }, { scale: 1.02, duration: 7, ease: "none" }, 7)
        .to(kb2, { opacity: 0, duration: 1.6, ease: "power2.inOut" }, 13.2);
    }
  }

  /* ---------- Sliders ---------- */
  function initSliders() {
    if (!window.Swiper) return;

    var nowEl = document.getElementById("collectionNow");
    var bars = document.querySelectorAll("#collectionBars .pagination-bar");
    var infoSwiper = new Swiper(".info-swiper", {
      slidesPerView: 1.15,
      spaceBetween: 16,
      speed: 650,
      grabCursor: true,
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 24 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
        1440: { slidesPerView: 3.4, spaceBetween: 24 }
      },
      on: {
        slideChange: function () {
          var i = this.activeIndex;
          if (nowEl) nowEl.textContent = ("0" + (i + 1)).slice(-2);
          bars.forEach(function (b, bi) { b.classList.toggle("active", bi <= i); });
        }
      }
    });

    var testiSwiper = new Swiper(".testimonials-swiper", {
      slidesPerView: 1,
      speed: 800,
      effect: "fade",
      fadeEffect: { crossFade: true },
      loop: true,
      autoHeight: true
    });
    var nextBtn = document.getElementById("testimonialNext");
    if (nextBtn) nextBtn.addEventListener("click", function () { testiSwiper.slideNext(); });
    return infoSwiper;
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    var items = document.querySelectorAll(".accordion-item");
    var images = document.querySelectorAll(".acc-img");
    if (!items.length) return;

    function activate(index) {
      items.forEach(function (item, i) {
        var body = item.querySelector(".accordion-body");
        if (i === index) {
          item.classList.add("is-active");
          if (window.gsap && body) {
            gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.55, ease: "power3.out" });
          } else if (body) { body.style.height = "auto"; }
        } else {
          item.classList.remove("is-active");
          if (window.gsap && body) {
            gsap.to(body, { height: 0, duration: 0.45, ease: "power3.out" });
          } else if (body) { body.style.height = "0px"; }
        }
      });
      images.forEach(function (img, i) { img.classList.toggle("is-active", i === index); });
    }

    items.forEach(function (item, i) {
      var head = item.querySelector(".accordion-head");
      if (head) head.addEventListener("click", function () { activate(i); });
    });

    /* Set the first panel's height correctly after layout */
    var firstBody = items[0].querySelector(".accordion-body");
    if (firstBody) { firstBody.style.height = "auto"; }
  }

  /* ---------- Menu, anchors, misc ---------- */
  function initChrome() {
    var menu = document.getElementById("mobileMenu");
    function openMenu() {
      if (!menu) return;
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      if (smoother) smoother.paused(true);
    }
    function closeMenu() {
      if (!menu) return;
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      if (smoother) smoother.paused(false);
    }
    ["menuOpenBtn", "menuOpenBtnMobile"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener("click", openMenu);
    });
    var closeBtn = document.getElementById("menuCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        closeMenu();
        setTimeout(function () {
          if (smoother) { smoother.scrollTo(target, true, "top top"); }
          else { target.scrollIntoView({ behavior: "smooth" }); }
        }, 60);
      });
    });

    var topBtn = document.getElementById("backToTop");
    if (topBtn) topBtn.addEventListener("click", function () {
      if (smoother) { smoother.scrollTo(0, true); }
      else { window.scrollTo({ top: 0, behavior: "smooth" }); }
    });

    var form = document.getElementById("visitForm");
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var note = document.getElementById("visitFormNote");
      if (note) note.hidden = false;
    });

    /* Cookie banner */
    var banner = document.getElementById("cookieBanner");
    var choice = null;
    try { choice = localStorage.getItem("maguva-cookie-choice"); } catch (e) { choice = "set"; }
    if (banner && !choice) {
      setTimeout(function () { banner.hidden = false; }, 1600);
      function settle(v) {
        try { localStorage.setItem("maguva-cookie-choice", v); } catch (e) {}
        banner.hidden = true;
      }
      var acc = document.getElementById("cookieAccept");
      var dec = document.getElementById("cookieDecline");
      if (acc) acc.addEventListener("click", function () { settle("accepted"); });
      if (dec) dec.addEventListener("click", function () { settle("declined"); });
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    initMotion();
    initSliders();
    initAccordion();
    initChrome();
    runLoaderCounter();
    /* Hard stop: never trap the visitor behind the loader */
    setTimeout(finishLoader, 3500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();

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
          smooth: 1,
          normalizeScroll: true,
          ignoreMobileResize: true
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

    /* Hero stacking (reference initStackingEffect): hero pinned with
       pinSpacing:false, the next section slides over it, hero lifts -20% */
    var heroSec = document.querySelector(".hero-section");
    var nextSec = document.querySelector(".text-blocks");
    if (heroSec && nextSec) {
      gsap.set(nextSec, { position: "relative", zIndex: 10 });
      gsap.set(heroSec, { zIndex: 1 });
      ScrollTrigger.create({
        trigger: heroSec, start: "top top",
        end: function () { return "+=" + nextSec.offsetHeight; },
        pin: true, pinSpacing: false, scrub: true,
        anticipatePin: 1, invalidateOnRefresh: true
      });
      gsap.to(heroSec, {
        yPercent: -20, ease: "none",
        scrollTrigger: { trigger: nextSec, start: "top bottom", end: "top top", scrub: true }
      });
    }

    /* Text-blocks scene (reference): pin with scrub:false; the statement
       swap is a direction-triggered timed timeline (0.4s power2.inOut out,
       0.4s power2.out in at -=0.2); backgrounds parallax 0 -> -30 scrubbed */
    var tbContainer = document.querySelector(".text-blocks");
    var tbSplit1 = null, tbSplit2 = null;
    if (tbContainer && window.SplitText) {
      try {
        var tbH1 = tbContainer.querySelector(".text-block--1 h2");
        var tbH2 = tbContainer.querySelector(".text-block--2 h2");
        tbSplit1 = new SplitText(tbH1, { type: "lines", linesClass: "tb-line" });
        new SplitText(tbH1, { type: "lines", linesClass: "tb-mask" });
        tbSplit2 = new SplitText(tbH2, { type: "lines", linesClass: "tb-line" });
        new SplitText(tbH2, { type: "lines", linesClass: "tb-mask" });
      } catch (e) { tbSplit1 = null; tbSplit2 = null; }
    }
    function initTextScene(endDist) {
      if (!tbContainer) return;
      var switchTl = gsap.timeline({ paused: true });
      if (tbSplit1 && tbSplit2) {
        switchTl.to(tbSplit1.lines, { yPercent: -100, opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0)
                .to(".text-block--1", { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0)
                .fromTo(".text-block--2", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.2)
                .fromTo(tbSplit2.lines, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 0.2);
      } else {
        switchTl.to(".text-block--1", { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0)
                .fromTo(".text-block--2", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.2);
      }
      ScrollTrigger.create({
        trigger: tbContainer, start: "top top", end: "+=" + endDist,
        pin: true, scrub: false, anticipatePin: 1,
        onUpdate: function (self) {
          if (self.direction === 1 && self.progress > 0.02) { switchTl.play(); }
          else if (self.direction === -1 && self.progress < 0.98) { switchTl.reverse(); }
        }
      });
      gsap.fromTo(".text-block_bg", { yPercent: 0 }, {
        yPercent: -30, ease: "none",
        scrollTrigger: {
          trigger: tbContainer, start: "top bottom",
          end: function () { return "bottom+=" + endDist + " top"; },
          scrub: true, invalidateOnRefresh: true
        }
      });
    }

    /* Pinned scenes (desktop) — scroll lengths measured from the reference:
       text-blocks +1800, video-block +2160, accordion +720, cta +2250 */
    var mm = gsap.matchMedia();
    mm.add("(min-width: 769px)", function () {
      /* Text blocks: reference switch scene (pin distance = 100% of 900) */
      initTextScene(900);

      /* Heading line reveals (reference values, desktop only) */
      if (window.SplitText) {
        try {
          document.querySelectorAll(".info-inner-left h2, .top-block h2, .table-head h2, .certificates h2").forEach(function (h) {
            var sp = new SplitText(h, { type: "lines", linesClass: "h-line" });
            new SplitText(h, { type: "lines", linesClass: "h-mask" });
            gsap.set(sp.lines, { yPercent: 100, rotate: 10, opacity: 0, transformOrigin: "0% 50% -50" });
            gsap.to(sp.lines, {
              yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power4.out",
              scrollTrigger: { trigger: h, start: "top 98%", toggleActions: "play none none none" }
            });
          });
        } catch (e) { /* headings stay static without the split */ }
      }

      /* Info blocks: left column pinned while the collection stack scrolls */
      ScrollTrigger.create({
        trigger: ".info-blocks", start: "top top", end: "bottom bottom",
        pin: ".info-inner-left", pinSpacing: false,
        anticipatePin: 1, invalidateOnRefresh: true
      });

      /* Video block: pinned film scene */
      ScrollTrigger.create({
        trigger: ".video-block", start: "top top", end: "+=2160", pin: true,
        anticipatePin: 1
      });

      /* Accordion: pinned hold only — activation is the 5s timer in
         initAccordion (reference model), not scroll progress */
      ScrollTrigger.create({
        trigger: ".accordion-section", start: "top top", end: "+=720", pin: true,
        scrub: true, anticipatePin: 1
      });

      /* CTA: the two lines slide in from opposite sides while pinned */
      var ctl = gsap.timeline({
        scrollTrigger: { trigger: ".cta-container", start: "top top", end: "+=2250", pin: true, scrub: 1, anticipatePin: 1 }
      });
      ctl.from(".cta-line--left", { x: -90, opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
         .from(".cta-line--right", { x: 90, opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
         .from(".cta-eyebrow", { opacity: 0, duration: 0.2 }, 0.3)
         .from(".cta-card", { y: 70, opacity: 0, duration: 0.3, ease: "power2.out" }, 0.35);
    });

    /* Pinned scenes (mobile) — scroll lengths measured from the reference
       at 390px: text-blocks +844, video-block +2786, cta +1688 */
    mm.add("(max-width: 768px)", function () {
      /* Text blocks: reference switch scene (pin distance = 100% of 844) */
      initTextScene(844);

      /* Info blocks (reference mobile model): section pinned, vertical
         scroll drives the card row as ONE continuous scrubbed x-translate
         (scrub 0.2) — no Swiper, no discrete slide jumps */
      var infoSection = document.querySelector(".info-blocks");
      var infoWrapper = infoSection ? infoSection.querySelector(".info-swiper .swiper-wrapper") : null;
      var infoItems = infoSection ? infoSection.querySelectorAll(".info-card") : [];
      if (infoSection && infoWrapper && infoItems.length > 1) {
        var infoTl = gsap.timeline({
          scrollTrigger: {
            trigger: infoSection, start: "top top", end: "+=2330", pin: true,
            scrub: 0.2, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: function (self) {
              var idx = Math.min(Math.floor(self.progress * infoItems.length), infoItems.length - 1);
              setCollectionIndex(idx);
            }
          }
        });
        infoTl.to(infoWrapper, {
          x: function () { return -(infoWrapper.scrollWidth - infoWrapper.clientWidth); },
          ease: "none", duration: 1
        });
      }

      ScrollTrigger.create({
        trigger: ".video-block", start: "top top", end: "+=2786", pin: true,
        anticipatePin: 1
      });

      var mctl = gsap.timeline({
        scrollTrigger: { trigger: ".cta-container", start: "top top", end: "+=1688", pin: true, scrub: 1, anticipatePin: 1 }
      });
      mctl.from(".cta-line--left", { x: -60, opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
          .from(".cta-line--right", { x: 60, opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
          .from(".cta-eyebrow", { opacity: 0, duration: 0.2 }, 0.3)
          .from(".cta-card", { y: 50, opacity: 0, duration: 0.3, ease: "power2.out" }, 0.35);
    });

    /* Ken Burns film: two stills crossfading with a slow push-in.
       Runs ONLY while the video block is on screen — an always-on infinite
       scale loop on two full-bleed images is a permanent GPU tax on mobile */
    var kb1 = document.querySelector(".kb-1");
    var kb2 = document.querySelector(".kb-2");
    if (kb1 && kb2) {
      var kb = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      kb.fromTo(kb1, { scale: 1.02 }, { scale: 1.14, duration: 7, ease: "none" }, 0)
        .to(kb2, { opacity: 1, duration: 1.6, ease: "power2.inOut" }, 6.2)
        .fromTo(kb2, { scale: 1.14 }, { scale: 1.02, duration: 7, ease: "none" }, 7)
        .to(kb2, { opacity: 0, duration: 1.6, ease: "power2.inOut" }, 13.2);
      kb.pause();
      ScrollTrigger.create({
        trigger: ".video-block", start: "top bottom", end: "bottom top",
        onToggle: function (self) { if (self.isActive) { kb.play(); } else { kb.pause(); } }
      });
    }
  }

  /* ---------- Sliders ---------- */
  function setCollectionIndex(i) {
    var nowEl = document.getElementById("collectionNow");
    var bars = document.querySelectorAll("#collectionBars .pagination-bar");
    if (nowEl) nowEl.textContent = ("0" + (i + 1)).slice(-2);
    bars.forEach(function (b, bi) { b.classList.toggle("active", bi <= i); });
  }

  function initSliders() {
    if (!window.Swiper) return;

    /* Collections: desktop = scroll-driven stack (counter follows the card
       passing centre); mobile = the scroll-scrubbed row built in initMotion
       (reference model — no Swiper instance on mobile). */
    if (window.innerWidth >= 769) {
      if (window.gsap && window.ScrollTrigger) {
        document.querySelectorAll(".info-card").forEach(function (card, i) {
          ScrollTrigger.create({
            trigger: card, start: "top center", end: "bottom center",
            onToggle: function (self) { if (self.isActive) setCollectionIndex(i); }
          });
        });
      }
    }

    /* Testimonials: reference Swiper values (speed 1000, slide, 24px gap,
       loop on small screens only, 12s autoplay gated by visibility) */
    var testiSwiper = new Swiper(".testimonials-swiper", {
      slidesPerView: 1,
      speed: 1000,
      spaceBetween: 24,
      loop: false,
      autoHeight: true,
      autoplay: { delay: 12000, disableOnInteraction: false },
      breakpoints: {
        320: { loop: true },
        1025: { loop: false }
      }
    });
    if (testiSwiper.autoplay) testiSwiper.autoplay.stop();
    var testiSection = document.querySelector(".testimonials");
    if (testiSection && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!testiSwiper.autoplay) return;
          if (entry.isIntersecting) { testiSwiper.autoplay.start(); }
          else { testiSwiper.autoplay.stop(); }
        });
      }, { threshold: 0.3 }).observe(testiSection);
    }
    var nextBtn = document.getElementById("testimonialNext");
    if (nextBtn) nextBtn.addEventListener("click", function () { testiSwiper.slideNext(); });
  }

  /* ---------- Accordion ----------
     Reference model (global.js): a 5000ms timer auto-cycles the items,
     paused while the section is off screen (IntersectionObserver 0.4),
     click activates immediately and restarts the timer. The pinned
     section is only a hold — scroll does NOT drive activation. */
  function initAccordion() {
    var section = document.querySelector(".accordion-section");
    var items = document.querySelectorAll(".accordion-item");
    var images = document.querySelectorAll(".acc-img");
    if (!items.length) return;

    var DURATION = 5000;
    var current = 0;
    var timer = null;
    var startTime = 0;
    var remaining = DURATION;
    var isVisible = false;

    function setProgress(idx, pct, animateMs) {
      var bar = items[idx] ? items[idx].querySelector(".acc-progress") : null;
      if (!bar) return;
      if (animateMs) {
        bar.style.transition = "width " + animateMs + "ms linear";
        bar.style.width = "100%";
      } else {
        bar.style.transition = "none";
        bar.style.width = pct + "%";
      }
    }

    function startProgress(dur) {
      setProgress(current, 0, 0);
      /* force reflow so the linear transition restarts cleanly */
      var bar = items[current].querySelector(".acc-progress");
      if (bar) { void bar.offsetWidth; }
      setProgress(current, 100, dur);
      startTime = Date.now();
      remaining = dur;
      timer = setTimeout(next, dur);
    }

    function pauseProgress() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
      remaining -= (Date.now() - startTime);
      var pct = Math.max(0, Math.min(100, ((DURATION - remaining) / DURATION) * 100));
      setProgress(current, pct, 0);
    }

    function resumeProgress() {
      if (timer) return;
      if (remaining <= 0) { next(); return; }
      /* continue the bar from its paused percentage */
      var bar = items[current].querySelector(".acc-progress");
      if (bar) {
        var pct = Math.max(0, Math.min(100, ((DURATION - remaining) / DURATION) * 100));
        bar.style.transition = "width " + remaining + "ms linear";
        bar.style.width = pct + "%";
        void bar.offsetWidth;
        bar.style.width = "100%";
      }
      startTime = Date.now();
      timer = setTimeout(next, remaining);
      var keep = remaining;
      remaining = keep;
    }

    function activate(index) {
      if (!items[index]) return;
      clearTimeout(timer);
      timer = null;

      var prevImg = document.querySelector(".acc-img.is-active");
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
        setProgress(i, 0, 0);
      });
      images.forEach(function (img, i) {
        var makeActive = i === index;
        if (!makeActive && img === prevImg && prevImg !== images[index]) {
          img.classList.add("was-active");
          setTimeout(function () { img.classList.remove("was-active"); }, 1400);
        }
        img.classList.toggle("is-active", makeActive);
      });

      current = index;
      remaining = DURATION;
      if (isVisible) { startProgress(DURATION); }
    }

    function next() { activate((current + 1) % items.length); }

    items.forEach(function (item, i) {
      var head = item.querySelector(".accordion-head");
      if (head) head.addEventListener("click", function () { activate(i); });
    });

    /* Set the first panel's height correctly after layout */
    var firstBody = items[0].querySelector(".accordion-body");
    if (firstBody) { firstBody.style.height = "auto"; }

    if (section && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { isVisible = true; resumeProgress(); }
          else { isVisible = false; pauseProgress(); }
        });
      }, { threshold: 0.4 }).observe(section);
    } else {
      isVisible = true;
      startProgress(DURATION);
    }
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
      var man = document.getElementById("cookieManage");
      if (acc) acc.addEventListener("click", function () { settle("accepted"); });
      if (dec) dec.addEventListener("click", function () { settle("declined"); });
      if (man) man.addEventListener("click", function () {
        var note = document.getElementById("cookieNote");
        if (note) note.hidden = !note.hidden;
      });
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

/* MAGUVA — "The Drape" motion
   Verified values carried from the motion fix: ScrollSmoother smooth:1,
   normalizeScroll:true, ignoreMobileResize:true, anticipatePin:1,
   transform/opacity-only animation, IO-gated off-screen pauses. */
(function () {
  "use strict";

  /* ---------- loader failsafe ---------- */
  var loaderDone = false;
  function killLoader() {
    if (loaderDone) return;
    loaderDone = true;
    var l = document.getElementById("loader");
    if (l) l.classList.add("done");
  }
  window.addEventListener("load", function () { setTimeout(killLoader, 350); });
  setTimeout(killLoader, 2600);

  /* ---------- live open status (IST vs 10:30–21:15) ---------- */
  var OPEN_MIN = 10 * 60 + 30, CLOSE_MIN = 21 * 60 + 15;
  function istMinutes() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === "hour") h = parseInt(p.value, 10) % 24;
        if (p.type === "minute") m = parseInt(p.value, 10);
      });
      return h * 60 + m;
    } catch (e) { return -1; }
  }
  function updateStatus() {
    var now = istMinutes(), open, text;
    if (now < 0) { text = "Open daily 10:30 AM – 9:15 PM"; open = true; }
    else if (now >= OPEN_MIN && now < CLOSE_MIN) { open = true; text = "Open now · closes 9:15 PM"; }
    else if (now < OPEN_MIN) { open = false; text = "Opens today at 10:30 AM"; }
    else { open = false; text = "Opens tomorrow at 10:30 AM"; }
    document.querySelectorAll(".js-status-text").forEach(function (el) { el.textContent = text; });
    document.querySelectorAll(".js-status-dot").forEach(function (el) {
      el.classList.toggle("is-open", open);
      el.classList.toggle("is-closed", !open);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  var hasSmoother = !!window.ScrollSmoother;
  if (hasSmoother) gsap.registerPlugin(ScrollSmoother);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var smoother = null;
  if (hasSmoother && !reduced) {
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

  /* ---------- header state ---------- */
  ScrollTrigger.create({
    start: 90, end: "max",
    toggleClass: { className: "header--solid", targets: "#siteHead" }
  });

  /* ---------- anchor links through the smoother ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      if (smoother) smoother.scrollTo(target, true, "top top");
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- hero crossfade (IO + visibility gated) ---------- */
  var slides = gsap.utils.toArray(".hero-slide");
  if (slides.length > 1 && !reduced) {
    gsap.set(slides, { opacity: 0 });
    gsap.set(slides[0], { opacity: 1 });
    slides.forEach(function (s) {
      gsap.fromTo(s.querySelector("img"), { scale: 1.12 }, { scale: 1, duration: 7.5, ease: "none" });
    });
    var cur = 0, heroTl = gsap.timeline({ repeat: -1, repeatDelay: 4.2 });
    for (var i = 1; i <= slides.length; i++) {
      (function (nxt) {
        heroTl.to(slides[(nxt - 1) % slides.length], { opacity: 0, duration: 1.6, ease: "power2.inOut" }, ">");
        heroTl.to(slides[nxt % slides.length], { opacity: 1, duration: 1.6, ease: "power2.inOut" }, "<");
        heroTl.fromTo(slides[nxt % slides.length].querySelector("img"),
          { scale: 1.12 }, { scale: 1, duration: 7.5, ease: "none" }, "<");
      })(i);
    }
    var heroEl = document.querySelector(".hero");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !document.hidden) heroTl.play(); else heroTl.pause();
      }, { threshold: 0.05 }).observe(heroEl);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) heroTl.pause(); else heroTl.play();
    });
  }

  /* ---------- hero intro ---------- */
  if (!reduced) {
    gsap.fromTo(".hero-mark", { yPercent: 16, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, ease: "power4.out", delay: 0.45 });
    gsap.fromTo(".hero-eyebrow, .hero-since, .hero-cta",
      { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.12, delay: 0.7 });
    gsap.fromTo(".proofbar", { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.15 });
  }

  /* ---------- split headings: lines unroll ---------- */
  if (window.SplitText && !reduced) {
    gsap.utils.toArray(".split").forEach(function (h) {
      var split = new SplitText(h, { type: "lines", mask: "lines" });
      gsap.fromTo(split.lines,
        { yPercent: 118, rotate: 1.5 },
        { yPercent: 0, rotate: 0, duration: 1.2, ease: "power4.out", stagger: 0.15,
          scrollTrigger: { trigger: h, start: "top 86%", once: true } });
    });
  }

  /* ---------- fold reveals: the fabric wipe along the border angle ---------- */
  var WIPE_FROM_L = "polygon(-18% 0%, -18% 0%, -34% 100%, -34% 100%)";
  var WIPE_FROM_R = "polygon(118% 0%, 118% 0%, 102% 100%, 102% 100%)";
  var WIPE_FULL_L = "polygon(-18% 0%, 118% 0%, 102% 100%, -34% 100%)";
  var WIPE_FULL_R = "polygon(-34% 0%, 118% 0%, 118% 100%, -18% 100%)";
  gsap.utils.toArray(".fold-media").forEach(function (media) {
    var flip = media.closest(".chapter-flip") !== null;
    if (!reduced) {
      gsap.fromTo(media,
        { clipPath: flip ? WIPE_FROM_R : WIPE_FROM_L },
        { clipPath: flip ? WIPE_FULL_R : WIPE_FULL_L, duration: 1.45, ease: "power3.inOut",
          scrollTrigger: { trigger: media, start: "top 84%", once: true } });
    }
    var img = media.querySelector("img");
    if (img && !reduced) {
      gsap.fromTo(img, { yPercent: -4.5 }, { yPercent: 4.5, ease: "none",
        scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true, anticipatePin: 1 } });
    }
  });
  gsap.utils.toArray(".fold-panel").forEach(function (panel) {
    if (reduced) return;
    var flip = panel.closest(".chapter-flip") !== null;
    gsap.fromTo(panel,
      { x: flip ? 56 : -56, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.15, ease: "power3.out",
        scrollTrigger: { trigger: panel, start: "top 86%", once: true } });
  });

  /* ---------- the zari thread: drawn by the scroll itself ---------- */
  var svg = document.getElementById("zariThread");
  var path = document.getElementById("zariPath");
  var track = document.getElementById("zariTrack");
  var dot = document.getElementById("zariDot");
  var content = document.getElementById("smooth-content");
  var threadTween = null;

  function buildThread() {
    if (!svg || !content) return;
    var W = content.clientWidth, H = content.scrollHeight;
    if (W < 10 || H < 10) return;
    var mobile = W < 760;
    var cx = mobile ? 15 : 46, amp = mobile ? 5 : 17, step = 340;
    var d = "M " + cx + " -10";
    var y = -10, dir = 1;
    while (y < H + step) {
      var ny = y + step;
      d += " C " + (cx + amp * dir) + " " + (y + step * 0.35) + ", " +
                   (cx - amp * dir) + " " + (y + step * 0.65) + ", " + cx + " " + ny;
      y = ny; dir *= -1;
    }
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    path.setAttribute("d", d); track.setAttribute("d", d);
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    if (threadTween) threadTween.kill();
    if (reduced) {
      path.style.strokeDashoffset = 0;
      dot.setAttribute("cx", cx); dot.setAttribute("cy", Math.min(H - 8, window.innerHeight * 0.6));
      return;
    }
    threadTween = gsap.to(path, {
      strokeDashoffset: 0, ease: "none",
      scrollTrigger: {
        trigger: content, start: "top top", end: "bottom bottom",
        scrub: 0.3, anticipatePin: 1,
        onUpdate: function (self) {
          var pt = path.getPointAtLength(len * self.progress);
          dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
        }
      }
    });
    var p0 = path.getPointAtLength(0);
    dot.setAttribute("cx", p0.x); dot.setAttribute("cy", p0.y);
  }
  buildThread();
  window.addEventListener("load", buildThread);
  var rebuildT;
  ScrollTrigger.addEventListener("refresh", function () {
    clearTimeout(rebuildT); rebuildT = setTimeout(buildThread, 120);
  });

  /* ---------- section heads & stats drift-in (transform/opacity only) ---------- */
  if (!reduced) {
    gsap.utils.toArray(".section-lede, .story-text, .story-stats, .visit-landmark").forEach(function (el) {
      gsap.fromTo(el, { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
  }
})();

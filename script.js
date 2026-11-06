/* =========================================================
   NAFIS NIROB — PORTFOLIO INTERACTIONS
   Navigation / Canvas / Reveal / Cursor / Language
   No profile picture or image-loading functionality
========================================================= */
// @ts-nocheck
"use strict";

(() => {
  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const saveData =
    navigator.connection && navigator.connection.saveData;

  const lowPower =
    Boolean(saveData) ||
    (
      navigator.hardwareConcurrency &&
      navigator.hardwareConcurrency <= 4
    );

  const state = {
    menuOpen: false,
    language: "en",
    rafId: 0,
    canvasActive: true,
    particles: [],
    pointer: {
      x: -1000,
      y: -1000,
      tx: -1000,
      ty: -1000
    },
    lastFrame: 0
  };

  const dom = {
    preloader: $("#preloader"),
    loaderProgress: $("#loaderProgress"),
    loaderPercent: $("#loaderPercent"),
    header: $("#header"),
    menuToggle: $("#menuToggle"),
    navMenu: $("#navMenu"),
    navLinks: $$(".nav-link"),
    sections: $$("main section[id]"),
    progress: $("#scrollProgress"),
    canvas: $("#particleCanvas"),
    cursorDot: $("#cursorDot"),
    cursorRing: $("#cursorRing"),
    languageToggle: $("#languageToggle"),
    currentYear: $("#currentYear")
  };

  /* PRELOADER */

  function runPreloader() {
    if (!dom.preloader) return;

    const start = performance.now();
    const duration = 850;
    let done = false;

    const finish = () => {
      if (done) return;

      done = true;

      if (dom.loaderProgress) {
        dom.loaderProgress.style.width = "100%";
      }

      if (dom.loaderPercent) {
        dom.loaderPercent.textContent = "100%";
      }

      window.setTimeout(() => {
        dom.preloader.classList.add("is-done");

        window.setTimeout(() => {
          dom.preloader.remove();
        }, 750);

      }, 120);
    };

    const tick = (now) => {
      if (done) return;

      const ratio = Math.min(
        1,
        (now - start) / duration
      );

      const eased = 1 - Math.pow(1 - ratio, 3);
      const percent = Math.round(eased * 94);

      if (dom.loaderProgress) {
        dom.loaderProgress.style.width = percent + "%";
      }

      if (dom.loaderPercent) {
        dom.loaderPercent.textContent =
          String(percent).padStart(2, "0") + "%";
      }

      if (ratio < 1) {
        requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    requestAnimationFrame(tick);

    window.addEventListener("load", finish, {
      once: true
    });

    window.setTimeout(finish, 1800);
  }

  /* MOBILE NAVIGATION */

  function setMenu(open) {
    if (!dom.menuToggle || !dom.navMenu) return;

    state.menuOpen = open;

    dom.navMenu.classList.toggle("open", open);

    dom.menuToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    dom.menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );

    document.body.classList.toggle(
      "menu-open",
      open
    );
  }

  function initNavigation() {
    if (dom.menuToggle) {
      dom.menuToggle.addEventListener("click", () => {
        setMenu(!state.menuOpen);
      });
    }

    dom.navLinks.forEach(link => {
      link.addEventListener("click", () => {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        setMenu(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        setMenu(false);
      }
    }, { passive: true });

    const updateScrollUI = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;

      const scrollable =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (dom.header) {
        dom.header.classList.toggle(
          "scrolled",
          scrollTop > 20
        );
      }

      if (dom.progress) {
        const percent =
          scrollable > 0
            ? (scrollTop / scrollable) * 100
            : 0;

        dom.progress.style.width = percent + "%";
      }
    };

    window.addEventListener(
      "scroll",
      updateScrollUI,
      { passive: true }
    );

    updateScrollUI();

    if ("IntersectionObserver" in window) {
      const sectionObserver =
        new IntersectionObserver(entries => {

          entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            dom.navLinks.forEach(link => {
              const active =
                link.getAttribute("href") ===
                "#" + entry.target.id;

              link.classList.toggle("active", active);
            });
          });

        }, {
          rootMargin: "-30% 0px -60% 0px",
          threshold: 0
        });

      dom.sections.forEach(section => {
        sectionObserver.observe(section);
      });
    }
  }

  /* SCROLL REVEALS */

  function initReveals() {
    const items = $$(".reveal");

    if (
      reduceMotion.matches ||
      !("IntersectionObserver" in window)
    ) {
      items.forEach(item => {
        item.classList.add("is-visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {

        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");

          currentObserver.unobserve(entry.target);
        });

      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    items.forEach(item => {
      observer.observe(item);
    });
  }

  /* ENGLISH / BANGLA */

  function setLanguage(language) {
    state.language = language;

    document.documentElement.lang = language;

    $$("[data-en][data-bn]").forEach(element => {
      element.textContent = element.getAttribute(
        language === "bn" ? "data-bn" : "data-en"
      );
    });

    if (dom.languageToggle) {
      dom.languageToggle.textContent =
        language === "en" ? "বাংলা" : "English";

      dom.languageToggle.setAttribute(
        "aria-label",
        language === "en"
          ? "Switch to Bangla"
          : "Switch to English"
      );
    }

    document.title =
      language === "en"
        ? "Nafis Nirob | On My Journey"
        : "নাফিস নিরব | আমার যাত্রা";
  }

  function initLanguage() {
    if (!dom.languageToggle) return;

    dom.languageToggle.addEventListener("click", () => {
      setLanguage(
        state.language === "en" ? "bn" : "en"
      );
    });
  }

  /* PARTICLE ENVIRONMENT */

  function initParticles() {
    const canvas = dom.canvas;

    if (!canvas || reduceMotion.matches || lowPower) {
      if (canvas) canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d", {
      alpha: true
    });

    if (!ctx) {
      canvas.style.display = "none";
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let resizeTimer = 0;

    const maxParticles =
      window.innerWidth < 700 ? 25 : 48;

    const makeParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .16,
      vy: (Math.random() - .5) * .16,
      radius: Math.random() * 1.3 + .35,
      alpha: Math.random() * .36 + .12,
      phase: Math.random() * Math.PI * 2
    });

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);

      dpr = Math.min(
        window.devicePixelRatio || 1,
        1.5
      );

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (state.particles.length === 0) {
        state.particles = Array.from(
          { length: maxParticles },
          makeParticle
        );
      } else {
        state.particles.forEach(p => {
          p.x = Math.min(p.x, width);
          p.y = Math.min(p.y, height);
        });
      }
    };

    const draw = (time) => {
      if (!state.canvasActive || document.hidden) {
        state.rafId = 0;
        return;
      }

      if (time - state.lastFrame < 28) {
        state.rafId = requestAnimationFrame(draw);
        return;
      }

      state.lastFrame = time;

      ctx.clearRect(0, 0, width, height);

      const pointer = state.pointer;

      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.phase += .008;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 115 && distance > 0) {
          p.x -= (dx / distance) * .12;
          p.y -= (dy / distance) * .12;
        }

        const alpha =
          p.alpha * (.75 + Math.sin(p.phase) * .25);

        ctx.beginPath();
        ctx.fillStyle =
          `rgba(190,177,235,${alpha})`;

        ctx.arc(
          p.x,
          p.y,
          p.radius,
          0,
          Math.PI * 2
        );

        ctx.fill();

        for (
          let j = i + 1;
          j < state.particles.length;
          j++
        ) {
          const q = state.particles[j];

          const lx = p.x - q.x;
          const ly = p.y - q.y;
          const dist = Math.hypot(lx, ly);

          if (dist < 95) {
            ctx.beginPath();

            ctx.strokeStyle =
              `rgba(166,153,205,${(1 - dist / 95) * .075})`;

            ctx.lineWidth = .6;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      state.rafId = requestAnimationFrame(draw);
    };

    const start = () => {
      state.canvasActive = true;

      if (!state.rafId) {
        state.rafId = requestAnimationFrame(draw);
      }
    };

    const stop = () => {
      state.canvasActive = false;

      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }

      state.rafId = 0;
    };

    resize();
    start();

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);

      resizeTimer = window.setTimeout(
        resize,
        100
      );
    }, { passive: true });

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop();
        else start();
      }
    );

    window.addEventListener("pagehide", stop, {
      once: true
    });

    window.addEventListener("pageshow", start);

    window.addEventListener(
      "pointermove",
      event => {
        state.pointer.x = event.clientX;
        state.pointer.y = event.clientY;
      },
      { passive: true }
    );
  }

  /* CUSTOM DESKTOP CURSOR */

  function initCursor() {
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    if (
      !finePointer ||
      reduceMotion.matches ||
      !dom.cursorDot ||
      !dom.cursorRing
    ) {
      return;
    }

    document.body.classList.add("has-custom-cursor");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;

    let ringX = pointerX;
    let ringY = pointerY;

    let cursorFrame = 0;

    const move = event => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      dom.cursorDot.style.transform =
        `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%,-50%)`;

      if (!cursorFrame) {
        cursorFrame = requestAnimationFrame(animateRing);
      }
    };

    const animateRing = () => {
      ringX += (pointerX - ringX) * .18;
      ringY += (pointerY - ringY) * .18;

      dom.cursorRing.style.transform =
        `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%,-50%)`;

      if (
        Math.abs(pointerX - ringX) +
        Math.abs(pointerY - ringY) > .3
      ) {
        cursorFrame = requestAnimationFrame(animateRing);
      } else {
        cursorFrame = 0;
      }
    };

    document.addEventListener(
      "pointermove",
      move,
      { passive: true }
    );

    $$("a, button, .panel").forEach(element => {
      element.addEventListener("pointerenter", () => {
        dom.cursorRing.classList.add("is-hover");
      });

      element.addEventListener("pointerleave", () => {
        dom.cursorRing.classList.remove("is-hover");
      });
    });

    /* Magnetic interaction */

    $$(".magnetic").forEach(element => {
      element.addEventListener("pointermove", event => {
        const rect = element.getBoundingClientRect();

        const dx =
          event.clientX -
          (rect.left + rect.width / 2);

        const dy =
          event.clientY -
          (rect.top + rect.height / 2);

        element.style.transform =
          `translate3d(${dx * .045}px, ${dy * .07}px, 0)`;
      });

      element.addEventListener("pointerleave", () => {
        element.style.transform = "";
      });
    });
  }

  /* FOOTER */

  function initFooter() {
    if (dom.currentYear) {
      dom.currentYear.textContent =
        new Date().getFullYear();
    }

    const backTop = $(".back-top");

    if (backTop) {
      backTop.addEventListener("click", event => {
        event.preventDefault();

        window.scrollTo({
          top: 0,
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      });
    }
  }

  /* EXTERNAL LINK SECURITY */

  function secureExternalLinks() {
    $$('a[target="_blank"]').forEach(link => {
      const rel = new Set(
        (link.getAttribute("rel") || "")
          .split(/\s+/)
          .filter(Boolean)
      );

      rel.add("noopener");
      rel.add("noreferrer");

      link.setAttribute(
        "rel",
        [...rel].join(" ")
      );
    });
  }

  /* INITIALIZATION */

  function init() {
    runPreloader();
    initNavigation();
    initReveals();
    initLanguage();
    initParticles();
    initCursor();
    initFooter();
    secureExternalLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
/* =========================================================
   DEVELOPER UNIVERSE
   5 ADVANCED INTERACTIVE FEATURES
   UPDATED COMPACT LAUNCHER VERSION
========================================================= */

(() => {
  "use strict";

  if (window.__DU_ADVANCED__) return;
  window.__DU_ADVANCED__ = true;

  const css = document.createElement("style");

  css.textContent = `
    #du-advanced {
      position:fixed;
      inset:0;
      z-index:999999;
      display:none;
      overflow-y:auto;
      padding:25px;
      color:#f5f3ff;
      background:rgba(7,7,15,.97);
      backdrop-filter:blur(20px);
      font-family:inherit;
      box-sizing:border-box;
    }

    #du-advanced * { box-sizing:border-box; }
    #du-advanced.du-open { display:block; }

    .dua-top {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:15px;
      margin-bottom:25px;
    }

    .dua-top h2 { margin:5px 0; }

    .dua-close,.dua-btn {
      color:white;
      background:#211b38;
      border:1px solid #7554bd;
      border-radius:9px;
      padding:11px 17px;
      cursor:pointer;
    }

    .dua-close:hover,.dua-btn:hover { background:#7046d8; }

    .dua-nav {
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin-bottom:25px;
    }

    .dua-nav button {
      color:#ddd;
      background:#171522;
      border:1px solid #39344d;
      padding:11px 15px;
      border-radius:9px;
      cursor:pointer;
    }

    .dua-nav button.active {
      background:#7046d8;
      color:white;
    }

    .dua-panel { display:none; }
    .dua-panel.active { display:block; }

    .dua-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
      gap:16px;
    }

    .dua-card {
      padding:20px;
      border:1px solid #343047;
      border-radius:14px;
      background:linear-gradient(145deg,#211c35,#11111b);
      transition:.25s;
    }

    .dua-card:hover {
      transform:translateY(-5px);
      border-color:#a78bfa;
    }

    .dua-muted {
      color:#aaa;
      font-size:13px;
      line-height:1.7;
    }

    .dua-input {
      display:block;
      width:100%;
      padding:13px;
      margin:10px 0 18px;
      color:white;
      background:#171525;
      border:1px solid #403957;
      border-radius:9px;
      outline:none;
    }

    .dua-input:focus { border-color:#a78bfa; }

    .dua-canvas {
      display:block;
      width:100%;
      height:380px;
      border:1px solid #39334f;
      border-radius:14px;
      background:radial-gradient(circle at center,#21183d,#080812 75%);
    }

    .dua-profile-wrap {
      display:flex;
      justify-content:center;
      padding:40px 10px;
      perspective:1000px;
    }

    .dua-profile {
      width:min(350px,95%);
      min-height:390px;
      padding:30px;
      text-align:center;
      border:1px solid #8b5cf6;
      border-radius:22px;
      background:linear-gradient(145deg,#292044,#10101b);
      box-shadow:0 25px 70px #0008;
      transform-style:preserve-3d;
      transition:transform .15s;
    }

    .dua-avatar {
      display:grid;
      place-items:center;
      width:100px;
      height:100px;
      margin:20px auto;
      border-radius:50%;
      background:linear-gradient(135deg,#8b5cf6,#06b6d4);
      font-size:30px;
      font-weight:bold;
    }

    .dua-map {
      position:relative;
      min-height:390px;
      overflow:hidden;
      border:1px solid #39334f;
      border-radius:15px;
      background-color:#11101c;
      background-image:
        linear-gradient(#ffffff09 1px,transparent 1px),
        linear-gradient(90deg,#ffffff09 1px,transparent 1px);
      background-size:35px 35px;
    }

    .dua-map svg {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      pointer-events:none;
    }

    .dua-map line {
      stroke:#9b7bfa;
      stroke-width:1.5;
      stroke-dasharray:6 6;
      opacity:.7;
    }

    .dua-node {
      position:absolute;
      z-index:2;
      padding:12px;
      color:white;
      background:#241b3d;
      border:1px solid #8b5cf6;
      border-radius:9px;
      font-size:12px;
      box-shadow:0 0 20px #8b5cf633;
    }

    .dua-result {
      margin-top:18px;
      padding:18px;
      color:#ddd;
      background:#171525;
      border:1px solid #39334f;
      border-radius:10px;
      line-height:1.8;
      white-space:pre-wrap;
    }

    .dua-tag {
      display:inline-block;
      padding:5px 9px;
      margin:4px;
      color:#c4b5fd;
      background:#30264c;
      border-radius:20px;
      font-size:11px;
    }

    /* COMPACT ADVANCED UNIVERSE LAUNCHER */

    #du-advanced-launcher {
      position:fixed;
      right:14px;
      bottom:14px;
      z-index:99998;
      padding:8px 12px;
      font-size:11px;
      font-weight:600;
      letter-spacing:.2px;
      color:white;
      background:linear-gradient(135deg,#7046d8,#38236e);
      border:1px solid #a78bfa;
      border-radius:22px;
      cursor:pointer;
      box-shadow:0 3px 14px #7046d844;
      transition:transform .2s,box-shadow .2s;
    }

    #du-advanced-launcher:hover {
      transform:translateY(-2px);
      box-shadow:0 5px 18px #7046d866;
    }

    @media(max-width:600px) {
      #du-advanced { padding:15px; }
      .dua-canvas { height:280px; }
      .dua-map { min-height:340px; }
      #du-advanced-launcher {
        right:10px;
        bottom:10px;
        padding:7px 10px;
        font-size:10px;
      }
    }
  `;

  document.head.appendChild(css);

  const hub = document.createElement("div");
  hub.id = "du-advanced";

  hub.innerHTML = `
    <div class="dua-top">
      <div>
        <small style="color:#a78bfa;letter-spacing:3px">DEVELOPER UNIVERSE</small>
        <h2>Advanced Systems</h2>
        <p class="dua-muted">Explore interactive developer experiences.</p>
      </div>
      <button class="dua-close" id="dua-close">✕ Close</button>
    </div>

    <div class="dua-nav">
      <button class="active" data-tab="projects">Project Explorer</button>
      <button data-tab="universe">3D Universe</button>
      <button data-tab="builder">Project Builder</button>
      <button data-tab="profile">3D Profile</button>
      <button data-tab="network">Network Map</button>
    </div>

    <section class="dua-panel active" id="dua-projects">
      <h2>AI Project Explorer</h2>
      <p class="dua-muted">Search and explore the project collection.</p>
      <input class="dua-input" id="dua-search" placeholder="Search projects...">
      <div class="dua-grid" id="dua-project-grid"></div>
    </section>

    <section class="dua-panel" id="dua-universe">
      <h2>Interactive 3D Universe</h2>
      <p class="dua-muted">Move your pointer to interact with the particle field.</p>
      <canvas class="dua-canvas" id="dua-canvas"></canvas>
    </section>

    <section class="dua-panel" id="dua-builder">
      <h2>Interactive Project Builder</h2>
      <p class="dua-muted">Generate a project concept using your preferences.</p>

      <label>Project name</label>
      <input class="dua-input" id="dua-name" placeholder="Enter project name">

      <label>Project category</label>
      <select class="dua-input" id="dua-type">
        <option>Portfolio Website</option>
        <option>Web Application</option>
        <option>Game Development</option>
        <option>Digital Marketplace</option>
        <option>Creative Platform</option>
      </select>

      <label>Technology</label>
      <select class="dua-input" id="dua-tech">
        <option>HTML, CSS and JavaScript</option>
        <option>React</option>
        <option>Three.js</option>
        <option>Node.js</option>
        <option>Python</option>
      </select>

      <label>Difficulty</label>
      <select class="dua-input" id="dua-level">
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>

      <button class="dua-btn" id="dua-generate">Generate Project</button>
      <div class="dua-result" id="dua-result">Your project concept will appear here.</div>
    </section>

    <section class="dua-panel" id="dua-profile">
      <h2>3D Interactive Profile Card</h2>
      <p class="dua-muted">Move your pointer over the card.</p>

      <div class="dua-profile-wrap">
        <div class="dua-profile" id="dua-profile-card">
          <div class="dua-avatar" id="dua-avatar">DEV</div>
          <h2 id="dua-profile-name">Developer Name</h2>
          <p style="color:#a78bfa">Digital Creator & Developer</p>
          <p class="dua-muted">Building creative digital experiences through technology, development and imagination.</p>
          <div class="dua-grid">
            <div><strong>01</strong><p class="dua-muted">Creativity</p></div>
            <div><strong>02</strong><p class="dua-muted">Development</p></div>
          </div>
        </div>
      </div>
    </section>

    <section class="dua-panel" id="dua-network">
      <h2>Live Website Network Map</h2>
      <p class="dua-muted">Explore the connected sections of this portfolio.</p>
      <div class="dua-map" id="dua-map">
        <svg id="dua-lines"></svg>
      </div>
    </section>
  `;

  document.body.appendChild(hub);

  const launcher = document.createElement("button");
  launcher.id = "du-advanced-launcher";
  launcher.textContent = "✦ Advanced Universe";
  launcher.addEventListener("click", () => openHub("projects"));
  document.body.appendChild(launcher);

  const $ = id => document.getElementById(id);

  /* NAVIGATION */

  function openHub(tab) {
    hub.classList.add("du-open");
    activateTab(tab || "projects");
  }

  function activateTab(tab) {
    hub.querySelectorAll(".dua-nav button").forEach(button => {
      button.classList.toggle("active",button.dataset.tab === tab);
    });

    hub.querySelectorAll(".dua-panel").forEach(panel => {
      panel.classList.toggle("active",panel.id === "dua-" + tab);
    });

    if (tab === "universe") startUniverse();
    else stopUniverse();

    if (tab === "network") drawNetwork();
  }

  hub.querySelectorAll(".dua-nav button").forEach(button => {
    button.addEventListener("click",() => activateTab(button.dataset.tab));
  });

  $("dua-close").addEventListener("click",() => {
    hub.classList.remove("du-open");
    stopUniverse();
  });

  document.addEventListener("keydown",event => {
    if (event.key === "Escape") {
      hub.classList.remove("du-open");
      stopUniverse();
    }
  });

  /* PROJECT EXPLORER */

  const projects = [
    {
      name:"Developer Portfolio",
      category:"Web Development",
      description:"An interactive portfolio with animations and creative digital experiences.",
      tags:["HTML","CSS","JavaScript"]
    },
    {
      name:"Minecraft Development",
      category:"Game Development",
      description:"A Minecraft inspired development and creative project.",
      tags:["Minecraft","Game Design"]
    },
    {
      name:"Digital Marketplace",
      category:"Digital Business",
      description:"A platform concept for digital products and online services.",
      tags:["Business","Web","UI"]
    },
    {
      name:"Creative Branding",
      category:"Graphic Design",
      description:"A visual identity and branding design experiment.",
      tags:["Branding","Design"]
    },
    {
      name:"Interactive Web Experience",
      category:"Web Development",
      description:"A modern web experience with interactive components.",
      tags:["JavaScript","Animation"]
    }
  ];

  function renderProjects(query = "") {
    const grid = $("dua-project-grid");
    grid.replaceChildren();

    const filtered = projects.filter(project =>
      [project.name,project.category,project.description,...project.tags]
        .join(" ").toLowerCase().includes(query.toLowerCase())
    );

    filtered.forEach(project => {
      const card = document.createElement("article");
      card.className = "dua-card";

      const title = document.createElement("h3");
      title.textContent = project.name;

      const category = document.createElement("small");
      category.style.color = "#a78bfa";
      category.textContent = project.category;

      const description = document.createElement("p");
      description.className = "dua-muted";
      description.textContent = project.description;

      const tags = document.createElement("div");

      project.tags.forEach(tag => {
        const element = document.createElement("span");
        element.className = "dua-tag";
        element.textContent = tag;
        tags.appendChild(element);
      });

      card.append(title,category,description,tags);
      grid.appendChild(card);
    });

    if (!filtered.length) {
      const message = document.createElement("p");
      message.className = "dua-muted";
      message.textContent = "No projects found.";
      grid.appendChild(message);
    }
  }

  $("dua-search").addEventListener("input",event => {
    renderProjects(event.target.value);
  });

  renderProjects();

  /* 3D UNIVERSE */

  const canvas = $("dua-canvas");
  const ctx = canvas.getContext("2d");

  let particles = [];
  let animationFrame = null;
  let universeRunning = false;

  const pointer = {x:-1000,y:-1000};

  function resizeUniverse() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1,2);

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    ctx.setTransform(ratio,0,0,ratio,0,0);

    particles = Array.from({length:90},() => ({
      x:Math.random()*rect.width,
      y:Math.random()*rect.height,
      size:Math.random()*2+.5,
      speed:Math.random()*.5+.1,
      phase:Math.random()*Math.PI*2
    }));
  }

  function animateUniverse() {
    if (!universeRunning) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0,0,width,height);

    particles.forEach((particle,index) => {
      particle.y -= particle.speed;

      if (particle.y < 0) {
        particle.y = height;
        particle.x = Math.random()*width;
      }

      const dx = particle.x-pointer.x;
      const dy = particle.y-pointer.y;
      const distance = Math.hypot(dx,dy);

      if (distance < 110 && distance > 0) {
        particle.x += dx/distance*1.2;
        particle.y += dy/distance*1.2;
      }

      const glow = .5+Math.sin(Date.now()*.001+particle.phase)*.3;

      ctx.beginPath();
      ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2);
      ctx.fillStyle = `rgba(181,151,255,${glow})`;
      ctx.fill();

      for (let j=index+1;j<particles.length;j++) {
        const other = particles[j];
        const d = Math.hypot(particle.x-other.x,particle.y-other.y);

        if (d < 75) {
          ctx.beginPath();
          ctx.moveTo(particle.x,particle.y);
          ctx.lineTo(other.x,other.y);
          ctx.strokeStyle = `rgba(139,92,246,${(1-d/75)*.3})`;
          ctx.stroke();
        }
      }
    });

    animationFrame = requestAnimationFrame(animateUniverse);
  }

  function startUniverse() {
    if (universeRunning) return;
    universeRunning = true;
    resizeUniverse();
    animateUniverse();
  }

  function stopUniverse() {
    universeRunning = false;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  canvas.addEventListener("pointermove",event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX-rect.left;
    pointer.y = event.clientY-rect.top;
  });

  canvas.addEventListener("pointerleave",() => {
    pointer.x = -1000;
    pointer.y = -1000;
  });

  window.addEventListener("resize",() => {
    if (universeRunning) resizeUniverse();
  });

  /* PROJECT BUILDER */

  $("dua-generate").addEventListener("click",() => {
    const name = $("dua-name").value.trim() || "Untitled Project";
    const type = $("dua-type").value;
    const tech = $("dua-tech").value;
    const level = $("dua-level").value;

    const goals = {
      Beginner:"Create a simple working prototype and focus on core functionality.",
      Intermediate:"Build a complete experience with responsive design and interactive features.",
      Advanced:"Develop a scalable experience with advanced architecture and polished interactions."
    };

    $("dua-result").textContent = [
      "PROJECT CONCEPT",
      "────────────────────",
      "Name: "+name,
      "Category: "+type,
      "Technology: "+tech,
      "Complexity: "+level,
      "",
      "PROJECT OBJECTIVE",
      "Create a "+type.toLowerCase()+" using "+tech+".",
      "",
      "DEVELOPMENT PLAN",
      "1. Research and define requirements.",
      "2. Design the interface and structure.",
      "3. Develop the main functionality.",
      "4. Test and improve the experience.",
      "5. Prepare the final release.",
      "",
      "RECOMMENDED APPROACH",
      goals[level]
    ].join("\n");
  });

  /* 3D PROFILE CARD */

  const profile = $("dua-profile-card");

  profile.addEventListener("pointermove",event => {
    const rect = profile.getBoundingClientRect();
    const x = (event.clientX-rect.left)/rect.width;
    const y = (event.clientY-rect.top)/rect.height;

    profile.style.transform =
      `rotateX(${(.5-y)*24}deg) rotateY(${(x-.5)*24}deg) scale(1.03)`;
  });

  profile.addEventListener("pointerleave",() => {
    profile.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  });

  /* WEBSITE NETWORK MAP */

  const mapNodes = [
    {name:"HOME",x:43,y:10},
    {name:"ABOUT",x:12,y:39},
    {name:"PROJECTS",x:70,y:39},
    {name:"SKILLS",x:12,y:75},
    {name:"CONTACT",x:70,y:75},
    {name:"UNIVERSE",x:43,y:55}
  ];

  function drawNetwork() {
    const map = $("dua-map");
    const svg = $("dua-lines");

    map.querySelectorAll(".dua-node").forEach(node => node.remove());
    svg.replaceChildren();

    const width = map.clientWidth;
    const height = map.clientHeight;

    svg.setAttribute("viewBox",`0 0 ${width} ${height}`);

    const positions = mapNodes.map(node => ({
      x:width*node.x/100,
      y:height*node.y/100
    }));

    [[0,1],[0,2],[0,5],[1,3],[2,4],[5,3],[5,4]].forEach(([a,b]) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg","line");

      line.setAttribute("x1",positions[a].x);
      line.setAttribute("y1",positions[a].y);
      line.setAttribute("x2",positions[b].x);
      line.setAttribute("y2",positions[b].y);

      svg.appendChild(line);
    });

    mapNodes.forEach(node => {
      const element = document.createElement("div");
      element.className = "dua-node";
      element.textContent = node.name;
      element.style.left = node.x+"%";
      element.style.top = node.y+"%";
      element.style.transform = "translate(-50%,-50%)";
      map.appendChild(element);
    });
  }

  /* PUBLIC API */

  window.openDeveloperAddons = openHub;

  window.DUAdvanced = {
    open:openHub,

    setProfile:function(name,avatar) {
      $("dua-profile-name").textContent = name;
      $("dua-avatar").textContent =
        avatar || name.slice(0,3).toUpperCase();
    },

    setProjects:function(newProjects) {
      if (!Array.isArray(newProjects)) return;
      projects.length = 0;
      projects.push(...newProjects);
      renderProjects($("dua-search").value);
    },

    close:function() {
      hub.classList.remove("du-open");
      stopUniverse();
    }
  };

  console.log("Developer Universe: 5 advanced features initialized.");

})();
/* REMOVE OLD DEVELOPER OS LAUNCHER */

(() => {
  "use strict";

  function removeDeveloperOS() {
    document.querySelectorAll(
      'button, a, [role="button"], [onclick]'
    ).forEach(element => {
      const text = element.textContent
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^[⌘✦★☆]+\s*/, "")
        .trim();

      if (/^Developer OS$/i.test(text)) {
        element.remove();
      }
    });
  }

  removeDeveloperOS();

  const observer = new MutationObserver(removeDeveloperOS);

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
      
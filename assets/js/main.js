/* Portafolio de Mayco Luciano Correa
   El contenido está en el HTML; este archivo solo agrega comodidades.
   Script clásico (IIFE), sin dependencias. */
(function () {
  "use strict";

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn("[portafolio] " + name, e); }
  }

  var EN = (document.documentElement.lang || "").slice(0, 2) === "en";
  var T = EN ? {
    tap: "Tap a cell to see its content.",
    viz: "Interactive dashboard: ",
    toLight: "Switch to light mode", toDark: "Switch to dark mode",
    copied: "Email copied", pasted: "You can paste it into your email now.",
    copy: "Copy email", copyFail: "Couldn't copy. Select the address and copy it manually."
  } : {
    tap: "Tocá una celda para ver su contenido.",
    viz: "Dashboard interactivo: ",
    toLight: "Cambiar a modo claro", toDark: "Cambiar a modo oscuro",
    copied: "Email copiado", pasted: "Ya podés pegarlo en tu correo.",
    copy: "Copiar email", copyFail: "No se pudo copiar. Seleccioná la dirección y copiala a mano."
  };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Menú en celular ----------
  safe("nav", function () {
    var btn = document.querySelector(".navtoggle");
    var nav = document.getElementById("nav");
    if (!btn || !nav) return;
    function setOpen(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
    }
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  });

  // ---------- Sección actual en el menú ----------
  safe("current", function () {
    if (!("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    var map = {};
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) map[el.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-current"); l.removeAttribute("aria-current"); });
          a.classList.add("is-current"); a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  });

  // ---------- La hoja de la presentación ----------
  safe("sheet", function () {
    var sheet = document.querySelector(".sheet");
    var table = document.querySelector("[data-sheet]");
    var refEl = document.querySelector("[data-ref]");
    var fxEl = document.querySelector("[data-formula]");
    var hint = document.querySelector("[data-hint]");
    if (!sheet || !table || !refEl || !fxEl) return;

    var rows = Array.prototype.slice.call(table.tBodies[0].rows);
    var colHeads = table.tHead ? table.tHead.rows[0].cells : null;
    var grid = rows.map(function (tr) { return Array.prototype.slice.call(tr.querySelectorAll("td")); });
    var letters = ["A", "B"];
    var cur = { r: 0, c: 1 };
    var typingTimer = null;
    var autoplay = true;

    sheet.classList.add("is-live");
    grid.forEach(function (row, r) {
      row.forEach(function (td, c) {
        td.setAttribute("tabindex", "-1");
        td.addEventListener("click", function () { stopAuto(); select(r, c, false); td.focus(); });
        td.addEventListener("focus", function () { if (cur.r !== r || cur.c !== c) { stopAuto(); select(r, c, false); } });
      });
    });

    function stopAuto() {
      if (!autoplay) return;
      autoplay = false;
      clearTimeout(typingTimer);
      fxEl.classList.remove("is-typing");
    }

    function select(r, c, type) {
      var prev = grid[cur.r] && grid[cur.r][cur.c];
      if (prev) { prev.classList.remove("is-sel"); prev.setAttribute("tabindex", "-1"); }
      rows[cur.r].cells[0].classList.remove("is-row");
      if (colHeads) colHeads[cur.c + 1].classList.remove("is-col");

      cur = { r: r, c: c };
      var td = grid[r][c];
      td.classList.add("is-sel");
      td.setAttribute("tabindex", "0");
      rows[r].cells[0].classList.add("is-row");
      if (colHeads) colHeads[c + 1].classList.add("is-col");
      refEl.textContent = letters[c] + (r + 1);

      var text = td.textContent.trim();
      clearTimeout(typingTimer);
      if (!type) { fxEl.classList.remove("is-typing"); fxEl.textContent = text; return; }
      fxEl.textContent = "";
      fxEl.classList.add("is-typing");
      var i = 0;
      (function step() {
        i += 1;
        fxEl.textContent = text.slice(0, i);
        if (i < text.length) typingTimer = setTimeout(step, 18);
        else fxEl.classList.remove("is-typing");
      })();
    }

    table.addEventListener("keydown", function (e) {
      var r = cur.r, c = cur.c;
      if (e.key === "ArrowDown") r = Math.min(rows.length - 1, r + 1);
      else if (e.key === "ArrowUp") r = Math.max(0, r - 1);
      else if (e.key === "ArrowRight") c = Math.min(1, c + 1);
      else if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
      else if (e.key === "Home") c = 0;
      else if (e.key === "End") c = 1;
      else return;
      e.preventDefault();
      stopAuto();
      select(r, c, false);
      grid[r][c].focus();
    });

    select(0, 1, false);
    if (hint) {
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) hint.textContent = T.tap;
      hint.hidden = false;
    }

    // Un solo momento animado al cargar: la selección recorre la columna B
    // escribiendo cada dato en la barra de fórmulas, y vuelve al nombre.
    if (reduceMotion) return;
    var order = [1, 2, 3, 4, 5, 6, 0];
    var k = 0;
    function next() {
      if (!autoplay) return;
      var r = order[k];
      select(r, 1, true);
      k += 1;
      if (k < order.length) {
        var len = grid[r][1].textContent.trim().length;
        typingTimer = setTimeout(next, len * 18 + 340);
      } else {
        autoplay = false;
      }
    }
    typingTimer = setTimeout(next, 700);
  });

  // ---------- Vistas previas y ventana del dashboard interactivo ----------
  safe("previews", function () {
    var previews = Array.prototype.slice.call(document.querySelectorAll(".preview"));
    var wide = window.matchMedia ? window.matchMedia("(min-width: 900px)") : { matches: true };
    var dlg = document.querySelector("[data-viz]");
    var body = dlg && dlg.querySelector("[data-viz-body]");
    var title = dlg && dlg.querySelector("[data-viz-title]");
    var ext = dlg && dlg.querySelector("[data-viz-ext]");
    var closeBtn = dlg && dlg.querySelector("[data-viz-close]");
    var canModal = !!(dlg && typeof dlg.showModal === "function");
    var opener = null;

    function openViz(embed, name, href, from) {
      opener = from;
      title.textContent = name;
      ext.href = href;
      body.innerHTML = "";
      var frame = document.createElement("iframe");
      frame.src = embed;
      frame.title = T.viz + name;
      frame.setAttribute("allowfullscreen", "");
      body.appendChild(frame);
      document.documentElement.classList.add("has-modal");
      dlg.showModal();
      closeBtn.focus();
    }
    function cleanup() {
      body.innerHTML = "";
      document.documentElement.classList.remove("has-modal");
      if (opener) opener.focus();
    }
    if (canModal) {
      closeBtn.addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("close", cleanup);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); // clic fuera
    }

    previews.forEach(function (box) {
      var img = box.querySelector("img");
      var project = box.closest(".project");
      var btn = project && project.querySelector("[data-explore]");

      function broken() { box.classList.add("is-broken"); }
      if (img) {
        if (img.complete && img.naturalWidth === 0) broken();
        img.addEventListener("error", broken);
      }

      // En pantallas anchas, "Explorar Dashboard" abre la ventana grande;
      // en celulares sigue siendo un enlace normal a Tableau Public.
      if (!btn || !canModal || !box.getAttribute("data-embed")) return;
      btn.addEventListener("click", function (e) {
        if (!wide.matches) return;
        e.preventDefault();
        openViz(box.getAttribute("data-embed"), box.getAttribute("data-title") || "", btn.href, btn);
      });
    });
  });

  // ---------- Modo claro / oscuro ----------
  safe("theme", function () {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var root = document.documentElement;
    var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
    function current() { return root.getAttribute("data-theme") || (mq.matches ? "dark" : "light"); }
    function label() { btn.setAttribute("aria-label", current() === "dark" ? T.toLight : T.toDark); }
    label();
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("tema", next); } catch (e) {}
      label();
    });
  });

  // ---------- Barra flotante al desplazarse ----------
  safe("bar", function () {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    function check() { bar.classList.toggle("is-scrolled", window.scrollY > 20); }
    window.addEventListener("scroll", check, { passive: true });
    check();
  });

  // ---------- Volver arriba ----------
  safe("top", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-top]"), function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
      });
    });
  });

  // ---------- Aviso "Desplazate para explorar" ----------
  safe("hint", function () {
    var hint = document.querySelector("[data-scrollhint]");
    if (!hint) return;
    function check() { hint.classList.toggle("is-gone", window.scrollY > 60); }
    window.addEventListener("scroll", check, { passive: true });
    check();
  });

  // ---------- Aparición al desplazarse (bajando y subiendo) ----------
  safe("reveal", function () {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;
    // pequeño escalonado entre elementos hermanos
    items.forEach(function (el) {
      var sib = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute("data-reveal"); }) : [];
      var i = sib.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i, 4) * 90 + "ms");
    });
    document.documentElement.classList.add("reveal-on");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (en.isIntersecting) {
          el.classList.add("is-in"); el.classList.remove("is-up");
        } else {
          el.classList.remove("is-in");
          // si salió por arriba, vuelve a aparecer desde arriba al subir
          el.classList.toggle("is-up", en.boundingClientRect.top < 0);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
    // red de seguridad: si el observador no responde, se muestra todo
    setTimeout(function () {
      var anyIn = items.some(function (el) { return el.classList.contains("is-in"); });
      if (!anyIn && window.scrollY > 0) document.documentElement.classList.remove("reveal-on");
    }, 3000);
  });

  // ---------- Copiar email ----------
  safe("copy", function () {
    var btn = document.querySelector(".copy");
    var status = document.querySelector(".copy__status");
    if (!btn || !navigator.clipboard || !window.isSecureContext) return;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
        btn.textContent = T.copied;
        if (status) status.textContent = T.pasted;
        setTimeout(function () { btn.textContent = T.copy; if (status) status.textContent = ""; }, 3000);
      }, function () {
        if (status) status.textContent = T.copyFail;
      });
    });
  });

  // ---------- Cambio de idioma: conserva la sección en la que estás ----------
  safe("lang", function () {
    var link = document.querySelector("a.lang[href]");
    if (!link) return;
    var es2en = { inicio: "home", proyectos: "projects", trayectoria: "experience", habilidades: "skills", contacto: "contact" };
    var map = {};
    Object.keys(es2en).forEach(function (k) { if (EN) map[es2en[k]] = k; else map[k] = es2en[k]; });
    link.addEventListener("click", function (e) {
      var ids = Object.keys(map), here = null;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) here = id;
      });
      if (!here || here === ids[0]) return;
      e.preventDefault();
      window.location.href = link.getAttribute("href").split("#")[0] + "#" + map[here];
    });
  });

  // ---------- Formulario de contacto (FormSubmit, sin servidor propio) ----------
  safe("form", function () {
    var form = document.querySelector("[data-form]");
    var status = document.querySelector("[data-form-status]");
    if (!form || !window.fetch || !window.FormData) return; // sin JS el formulario se envía igual
    var btn = form.querySelector("button[type=submit]");
    var label = btn ? btn.querySelector("span") : null;
    var M = EN ? {
      sending: "Sending…", ok: "Thanks! Your message was sent. I'll get back to you soon.",
      fail: "The message couldn't be sent. You can write to me at ", send: "Send message"
    } : {
      sending: "Enviando…", ok: "¡Gracias! Tu mensaje se envió. Te respondo pronto.",
      fail: "No se pudo enviar el mensaje. Podés escribirme a ", send: "Enviar mensaje"
    };
    var email = form.getAttribute("action").split("/").pop();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      if (data.get("_honey")) { form.reset(); return; } // bot
      var payload = {};
      data.forEach(function (v, k) { if (k !== "_honey") payload[k] = v; });
      payload._replyto = payload.email;
      btn.disabled = true; if (label) label.textContent = M.sending;
      status.className = "cform__status"; status.textContent = "";
      fetch("https://formsubmit.co/ajax/" + email, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || String(res.j.success) !== "true") throw new Error(res.j.message || "error");
          form.reset();
          status.className = "cform__status is-ok"; status.textContent = M.ok;
        })
        .catch(function () {
          status.className = "cform__status";
          status.textContent = M.fail;
          var a = document.createElement("a"); a.href = "mailto:" + email; a.textContent = email;
          status.appendChild(a); status.appendChild(document.createTextNode("."));
        })
        .then(function () { btn.disabled = false; if (label) label.textContent = M.send; });
    });
  });

  // ---------- Año del pie ----------
  safe("year", function () {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());
  });
})();

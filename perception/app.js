/* PERCEPTION — interactions. Plain JS, no dependencies. */
(function () {
  "use strict";
  var d = document, root = d.documentElement, w = window;
  var RM = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = w.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- pointer state ---------- */
  var px = w.innerWidth / 2, py = w.innerHeight / 3, hasPointer = false;
  w.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    px = e.clientX; py = e.clientY; if (!hasPointer && cur) cur.classList.add("live"); hasPointer = true;
  }, { passive: true });

  /* ---------- custom cursor (desktop only) ---------- */
  var cur = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), txt = $(".cursor__txt");
  var rx = px, ry = py;
  if (FINE && !RM && cur) {
    root.classList.add("has-cursor");
    d.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest("[data-cursor], a, button, input, .tilt") : null;
      cur.classList.remove("is-link", "is-text");
      if (!t) return;
      if (t.hasAttribute("data-cursor") || t.closest("[data-cursor]")) {
        var host = t.closest("[data-cursor]");
        txt.textContent = host.getAttribute("data-cursor");
        cur.classList.add("is-text");
      } else if (t.matches("a, button")) cur.classList.add("is-link");
    });
    d.addEventListener("pointerdown", function () { cur.classList.add("is-down"); });
    d.addEventListener("pointerup", function () { cur.classList.remove("is-down"); });
    d.documentElement.addEventListener("mouseleave", function () { cur.classList.remove("live"); });
    d.documentElement.addEventListener("mouseenter", function () { if (hasPointer) cur.classList.add("live"); });
  }

  /* ---------- hero title split ---------- */
  var title = $("[data-split]");
  if (title) {
    var word = title.textContent;
    title.setAttribute("aria-label", word);
    title.innerHTML = word.split("").map(function (c, i) {
      return '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + c + "</span>";
    }).join("");
  }

  /* ---------- nav ---------- */
  var nav = $("#nav"), toggle = $(".nav__toggle"), menu = $("#menu");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    d.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); } });
  }
  var navLinks = $$('.nav__links a[href^="#"]');
  var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);

  /* ---------- reveal on scroll ---------- */
  var revealIO = "IntersectionObserver" in w ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      revealIO.unobserve(en.target);
      var c = en.target.querySelector("[data-count]"); if (c) countUp(c);
      var s = en.target.querySelector("[data-scramble]"); if (s) scramble(s);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }) : null;
  $$("[data-reveal]").forEach(function (el, i) {
    if (!revealIO || RM) { el.classList.add("in"); return; }
    el.style.transitionDelay = (el.parentElement && el.parentElement.classList.contains("stats") ? (i % 4) * 90 : 0) + "ms";
    revealIO.observe(el);
  });

  /* ---------- counters & scramble ---------- */
  function countUp(el) {
    if (RM) return;
    var end = +el.getAttribute("data-count"), t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = clamp((t - t0) / 1400, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
  function scramble(el) {
    if (RM) return;
    var final = el.textContent, n = 0, frames = 22;
    var iv = setInterval(function () {
      n++;
      el.textContent = final.split("").map(function (c, i) {
        if (i < (n / frames) * final.length) return c;
        return GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }).join("");
      if (n >= frames) { clearInterval(iv); el.textContent = final; }
    }, 40);
  }

  /* ---------- ripples (tap feedback) ---------- */
  d.addEventListener("pointerdown", function (e) {
    var b = e.target.closest ? e.target.closest(".btn") : null;
    if (!b || RM) return;
    var r = b.getBoundingClientRect(), s = d.createElement("span");
    s.className = "ripple";
    s.style.left = (e.clientX - r.left) + "px";
    s.style.top = (e.clientY - r.top) + "px";
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  });

  /* ---------- magnetic buttons + tilt cards (desktop) ---------- */
  if (FINE && !RM) {
    $$(".magnetic").forEach(function (m) {
      m.addEventListener("pointermove", function (e) {
        var r = m.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.32;
        m.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      m.addEventListener("pointerleave", function () { m.style.transform = ""; });
    });
    $$(".tilt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 7).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 9).toFixed(2) + "deg)";
        c.style.setProperty("--sx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--sy", (y * 100).toFixed(1) + "%");
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }


  /* ---------- 3D business card: drag to spin 360, flick for momentum, tap to flip ---------- */
  (function () {
    var tilt = $("#bcTilt"), card = $("#bcCard"), btn = $("#bcFlip"), front = $("#bcFront"), back = $("#bcBack");
    if (!tilt || !card || !btn) return;
    var rotY = 0, rotX = 0, drag = null, vY = 0, vX = 0, raf = 0, lastX = 0, lastY = 0, lastT = 0, hover = false;
    var glares = $$(".bc__glare", card);
    function showingBack() { var n = ((rotY % 360) + 360) % 360; return n > 90 && n < 270; }
    function sync() {
      var f = showingBack();
      btn.setAttribute("aria-pressed", f ? "true" : "false");
      btn.querySelector(".bc__flip-t").textContent = f ? "Flip back" : "Flip card";
      if (f) { back.removeAttribute("inert"); front.setAttribute("inert", ""); }
      else { front.removeAttribute("inert"); back.setAttribute("inert", ""); }
    }
    function draw() {
      card.style.transform = "rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg)";
      var r = rotY * Math.PI / 180, gx = 50 - Math.sin(r) * 55, gy = 35 - rotX * 1.6;
      glares.forEach(function (g) { g.style.setProperty("--gx", gx.toFixed(1) + "%"); g.style.setProperty("--gy", gy.toFixed(1) + "%"); });
      sync();
    }
    function stopAnim() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function settle(target) {
      stopAnim();
      var t0 = performance.now(), y0 = rotY, x0 = rotX, dur = 700;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        rotY = y0 + (target - y0) * e; rotX = x0 * (1 - e); draw();
        if (k < 1) raf = requestAnimationFrame(step); else raf = 0;
      })(t0);
    }
    function nearest() { return Math.round(rotY / 180) * 180; }
    function coast() {
      stopAnim();
      if (RM) { settle(nearest()); return; }
      (function step() {
        rotY += vY; rotX = Math.max(-35, Math.min(35, rotX + vX));
        vY *= 0.95; vX *= 0.85; draw();
        if (Math.abs(vY) > 0.35) raf = requestAnimationFrame(step); else settle(nearest());
      })();
    }
    function begin() { card.classList.add("is-touched"); card.style.transition = "none"; }
    btn.addEventListener("click", function () { begin(); settle(nearest() + 180); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { begin(); settle(nearest() + 180); e.preventDefault(); }
      if (e.key === "ArrowLeft") { begin(); settle(nearest() - 180); e.preventDefault(); }
    });
    tilt.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a")) return;
      begin(); stopAnim();
      drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId, y0: rotY, x0: rotX };
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); vY = vX = 0;
    });
    tilt.addEventListener("pointermove", function (e) {
      if (drag && e.pointerId === drag.id) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved) {
          if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) { drag.moved = true; try { tilt.setPointerCapture(e.pointerId); } catch (_) {} }
          else if (Math.abs(dy) > 10) { drag = null; return; }
          else return;
        }
        var now = performance.now(), dt = Math.max(8, now - lastT);
        vY = (e.clientX - lastX) * 0.7 * (16 / dt); vX = -(e.clientY - lastY) * 0.3 * (16 / dt);
        lastX = e.clientX; lastY = e.clientY; lastT = now;
        rotY = drag.y0 + dx * 0.7; rotX = Math.max(-35, Math.min(35, drag.x0 - dy * 0.3));
        draw();
      } else if (!drag && !raf && FINE && !RM) {
        var r = tilt.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        begin(); hover = true;
        rotX = (0.5 - y) * 14; var base = nearest(); rotY = base + (x - 0.5) * 18; draw();
      }
    });
    function end(e) {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.moved) { if (e && e.type === "pointerup" && !e.target.closest("a")) settle(nearest() + 180); return; }
      if (performance.now() - lastT > 90) { vY = 0; vX = 0; }
      coast();
    }
    tilt.addEventListener("pointerup", end);
    tilt.addEventListener("pointercancel", end);
    tilt.addEventListener("pointerleave", function () { if (!drag && !raf && hover) { hover = false; settle(nearest()); } });
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "ZMS business card. Drag to spin it all the way round, or use the arrow keys or the Flip card button.");
    draw();
  })();

  /* ---------- hero cube ---------- */
  var hero = $(".hero"), stage = $("#stage"), world = $("#world"), cube = $("#cube");
  var faces = cube ? {
    front: $(".f-front", cube), back: $(".f-back", cube), right: $(".f-right", cube),
    left: $(".f-left", cube), top: $(".f-top", cube), bottom: $(".f-bottom", cube)
  } : {};
  var N = { front: [0, 0, 1], back: [0, 0, -1], right: [1, 0, 0], left: [-1, 0, 0], top: [0, -1, 0], bottom: [0, 1, 0] };
  var L = (function () { var v = [-0.35, -1, 0.55], m = Math.hypot(v[0], v[1], v[2]); return [v[0] / m, v[1] / m, v[2] / m]; })();
  var camX = -22, spinY = 38, tCamX = -22, tSpinY = 38, dragging = false, dragX = 0, dragSpin = 0, autoSpin = 0, heroP = 0;
  function shade(ax, ay) {
    var a = ax * Math.PI / 180, b = ay * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    for (var k in N) {
      var n = N[k];
      var x1 = n[0] * cb + n[2] * sb, z1 = -n[0] * sb + n[2] * cb, y1 = n[1];      // rotateY
      var y2 = y1 * ca - z1 * sa, z2 = y1 * sa + z1 * ca;                         // rotateX
      var lit = Math.max(0, x1 * L[0] + y2 * L[1] + z2 * L[2]);
      if (faces[k]) faces[k].style.setProperty("--sh", (0.62 - lit * 0.6).toFixed(3));
    }
  }
  if (stage && !RM) {
    stage.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      dragging = true; dragX = e.clientX; dragSpin = spinY; tSpinY = spinY; autoSpin = 0;
    });
    w.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      tSpinY = dragSpin + (e.clientX - dragX) * 0.6;
    }, { passive: true });
    w.addEventListener("pointerup", function () { dragging = false; });
    w.addEventListener("pointercancel", function () { dragging = false; });
  }

  /* ---------- lens compare ---------- */
  var cmp = $("#compare");
  if (cmp) {
    var range = $(".compare__range", cmp), lname = $("#lens-name");
    var setPos = function (v) { cmp.style.setProperty("--pos", v + "%"); range.value = v; };
    range.addEventListener("input", function () { setPos(range.value); });
    $$("[data-lens]").forEach(function (b) {
      if (b === cmp) return;
      b.addEventListener("click", function () {
        $$(".lens__btns .chip").forEach(function (o) { o.classList.remove("on"); o.setAttribute("aria-pressed", "false"); });
        b.classList.add("on"); b.setAttribute("aria-pressed", "true");
        cmp.setAttribute("data-lens", b.getAttribute("data-lens"));
        lname.textContent = b.textContent;
      });
    });
    // gentle intro sweep once visible
    if (!RM && "IntersectionObserver" in w) {
      var swept = false;
      new IntersectionObserver(function (en, o) {
        if (!en[0].isIntersecting || swept) return;
        swept = true; o.disconnect();
        var t0 = null;
        (function anim(t) {
          if (!t0) t0 = t;
          var p = clamp((t - t0) / 1600, 0, 1);
          setPos((50 + Math.sin(p * Math.PI * 2) * 22).toFixed(1));
          if (p < 1) requestAnimationFrame(anim); else setPos(50);
        })(performance.now());
      }, { threshold: 0.6 }).observe(cmp);
    }
  }

  /* ---------- series sticky stage ---------- */
  var exps = $$(".exp"), stageItems = $$(".stage__item"), stageN = $("#stage-n");
  function setExp(i) {
    exps.forEach(function (e, k) { e.classList.toggle("on", k === i); });
    stageItems.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    if (stageN) stageN.textContent = ("0" + (i + 1)).slice(-2);
  }
  if (exps.length && "IntersectionObserver" in w) {
    var seIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) setExp(+en.target.getAttribute("data-i")); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    exps.forEach(function (e) { seIO.observe(e); });
    setExp(0);
  }

  /* ---------- illusion lab ---------- */
  function hexOf(el) {
    var m = getComputedStyle(el).backgroundColor.match(/\d+/g);
    if (!m) return "";
    return "#" + m.slice(0, 3).map(function (v) { return ("0" + (+v).toString(16)).slice(-2); }).join("").toUpperCase();
  }
  var LAB = {
    "lab-grey": {
      answer: "same",
      proof: function (c) {
        var a = hexOf($(".grey__sq--a", c)), b = hexOf($(".grey__sq--b", c));
        $(".probe--a", c).textContent = a; $(".probe--b", c).textContent = b;
        return "<b>Both squares are " + a + ".</b> The bridge is the same grey too. Context changes everything, including how customers see your brand.";
      }
    },
    "lab-lines": {
      answer: "same",
      proof: function (c) {
        var ls = $$(".ml__line line", c).map(function (l) { return Math.round(l.x2.baseVal.value - l.x1.baseVal.value); });
        $(".ml__len", c).textContent = ls[0] + " = " + ls[1];
        return "<b>Same length: " + ls[0] + " and " + ls[1] + ".</b> The arrows lie. The lines do not.";
      }
    },
    "lab-colour": {
      answer: "same",
      proof: function (c) {
        var fills = $$(".mw__bars rect", c).map(function (r) { return getComputedStyle(r).fill; });
        var same = fills.every(function (f) { return f === fills[0]; });
        return same ? "<b>Every red bar is #E8455A.</b> The yellow and blue neighbours bent the colour. So do brand palettes."
                    : "Neighbours change colour. So do brand palettes.";
      }
    }
  };
  Object.keys(LAB).forEach(function (id) {
    var c = d.getElementById(id); if (!c) return;
    var btn = $("[data-reveal-btn]", c), msg = $(".exp-card__msg", c), base = msg.innerHTML, cfg = LAB[id];
    function reveal(on, guess) {
      c.classList.toggle("is-revealed", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      $("span", btn).textContent = on ? "Reset" : "Reveal";
      if (on) {
        var lead = "";
        if (guess) lead = guess === cfg.answer ? "Sharp eyes. " : "Your brain disagreed. ";
        msg.innerHTML = lead + cfg.proof(c);
      } else {
        msg.innerHTML = base;
        $$(".guess .chip", c).forEach(function (g) { g.classList.remove("picked"); });
      }
    }
    btn.addEventListener("click", function () { reveal(!c.classList.contains("is-revealed")); });
    $$(".guess .chip", c).forEach(function (g) {
      g.addEventListener("click", function () {
        $$(".guess .chip", c).forEach(function (o) { o.classList.remove("picked"); });
        g.classList.add("picked");
        var guess = g.getAttribute("data-guess");
        if (guess !== cfg.answer && !RM) { g.classList.remove("is-wrong"); void g.offsetWidth; g.classList.add("is-wrong"); }
        reveal(true, guess);
      });
    });
  });

  /* ---------- main loop: scroll + cube + cursor ---------- */
  var bigword = $(".bigword"), prog = $(".progress"), lastY = -1;
  function onScroll() {
    var y = w.scrollY, H = root.scrollHeight - w.innerHeight;
    if (prog) prog.style.setProperty("--sp", H > 0 ? (y / H).toFixed(4) : 0);
    nav.classList.toggle("scrolled", y > 24);
    if (hero && !RM) {
      var hh = hero.offsetHeight - w.innerHeight;
      heroP = clamp(y / Math.max(1, hh), 0, 1);
      hero.style.setProperty("--hp", heroP.toFixed(4));
    }
    if (bigword && !RM) {
      var r = bigword.getBoundingClientRect(), p = clamp(1 - (r.top / w.innerHeight), 0, 1.2);
      bigword.style.setProperty("--bw", clamp(p * 110, 0, 100).toFixed(1) + "%");
      bigword.style.setProperty("--bx", ((0.5 - p) * 8).toFixed(2));
    }
    // active nav link
    var mid = w.innerHeight * 0.4, act = null;
    sections.forEach(function (s, i) { var r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) act = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle("active", i === act); });
  }
  w.addEventListener("scroll", onScroll, { passive: true });
  w.addEventListener("resize", onScroll);
  onScroll();

  var t0 = performance.now();
  function frame(t) {
    var time = (t - t0) / 1000;
    // cursor
    if (root.classList.contains("has-cursor")) {
      rx = lerp(rx, px, 0.18); ry = lerp(ry, py, 0.18);
      dot.style.transform = "translate(" + px + "px," + py + "px)";
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)" + (cur.classList.contains("is-down") ? " scale(.85)" : "");
      root.style.setProperty("--mx", px + "px");
      root.style.setProperty("--my", py + "px");
    }
    // cube
    if (cube && !RM) {
      var ease = heroP * heroP * (3 - 2 * heroP);
      var nx = hasPointer ? (px / w.innerWidth - 0.5) : Math.sin(time * 0.5) * 0.25;
      var ny = hasPointer ? (py / w.innerHeight - 0.5) : Math.cos(time * 0.4) * 0.15;
      if (!dragging && !hasPointer) autoSpin += 0.12;
      tCamX = lerp(-22 + ny * 16, -88, ease);
      var spinTarget = (hasPointer ? 38 + nx * 70 : tSpinY + autoSpin) + ease * 45;
      if (dragging) spinTarget = tSpinY;
      camX = lerp(camX, tCamX, 0.08);
      spinY = lerp(spinY, spinTarget, 0.07);
      var bob = -14 - Math.sin(time * 1.3) * 6 * (1 - ease);
      world.style.setProperty("--rx", camX.toFixed(2) + "deg");
      cube.style.setProperty("--ry", spinY.toFixed(2) + "deg");
      cube.style.setProperty("--bob", bob.toFixed(1) + "px");
      shade(camX, spinY);
    }
    requestAnimationFrame(frame);
  }
  if (cube) shade(-22, 38);
  if (!RM || root.classList.contains("has-cursor")) requestAnimationFrame(frame);
})();

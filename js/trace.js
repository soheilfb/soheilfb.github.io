// Hero trace: the name sent as 4-bit samples (two per ASCII letter, high nibble first),
// drawn as a DAC staircase, with a simulated band-limited "received" copy on top.
(function () {
  "use strict";

  var NAME = "SOHEIL FALLAH BAGHERINEZHAD";
  var canvas = document.getElementById("trace");
  if (!canvas || !canvas.getContext) return;
  var tip = document.getElementById("trace-tip");
  var plot = canvas.parentElement;

  // ---- data -------------------------------------------------------------
  var samples = [];
  for (var c = 0; c < NAME.length; c++) {
    var code = NAME.charCodeAt(c);
    samples.push(code >> 4, code & 15);
  }
  var N = samples.length;

  // Received copy: under-damped second-order low-pass plus a little noise.
  var OS = 24;          // points per sample
  var LAG = 0.3 * OS;   // channel delay, in points
  var rx = (function () {
    var out = new Float32Array(N * OS);
    var wn = 0.34, zeta = 0.55, y = samples[0], v = 0, seed = 7;
    function noise() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
    for (var i = 0; i < out.length; i++) {
      var x = samples[Math.floor(i / OS)];
      v += wn * wn * (x - y) - 2 * zeta * wn * v;
      y += v;
      out[i] = y + noise() * 0.22;
    }
    return out;
  })();

  // ---- geometry ---------------------------------------------------------
  var W = 0, H = 0, dpr = 1, progress = 0, hover = -1;
  var PAD_L = 30, PAD_R = 2, PAD_T = 8, PAD_B = 8;
  var LO = -1.2, HI = 16.2; // value range shown (levels 0..15 plus overshoot)

  function xOf(s) { return PAD_L + (s / N) * (W - PAD_L - PAD_R); }
  function yOf(v) { return PAD_T + (1 - (v - LO) / (HI - LO)) * (H - PAD_T - PAD_B); }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function resize() {
    var r = plot.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    PAD_L = W < 480 ? 24 : 30;
    draw();
    if (hover >= 0) placeTip();
  }

  // ---- drawing ----------------------------------------------------------
  function draw() {
    if (!W || !H) return;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var ink2 = css("--ink-2"), grid = css("--grid"), tx = css("--tx"), rxc = css("--rx");
    var x0 = xOf(0), x1 = xOf(N);

    // one hairline per level
    ctx.lineWidth = 1;
    ctx.strokeStyle = grid;
    for (var l = 0; l < 16; l++) {
      var gy = Math.round(yOf(l)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke();
    }

    ctx.fillStyle = ink2;
    ctx.font = '500 12px "Archivo Variable", system-ui, sans-serif';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("15", x0 - 7, yOf(15));
    ctx.fillText("0", x0 - 7, yOf(0));

    if (hover >= 0) {
      ctx.fillStyle = tx;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(xOf(hover * 2), PAD_T, xOf(hover * 2 + 2) - xOf(hover * 2), H - PAD_T - PAD_B);
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 2, 0, (x1 - x0 + 4) * progress, H);
    ctx.clip();

    // sent: staircase
    ctx.strokeStyle = tx;
    ctx.lineWidth = 2;
    ctx.lineJoin = "miter";
    ctx.beginPath();
    for (var s = 0; s < N; s++) {
      var sy = yOf(samples[s]);
      if (s === 0) ctx.moveTo(xOf(0), sy); else ctx.lineTo(xOf(s), sy);
      ctx.lineTo(xOf(s + 1), sy);
    }
    ctx.stroke();

    // received: smooth trace
    ctx.strokeStyle = rxc;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < rx.length; i++) {
      var px = xOf((i + LAG) / OS);
      if (px > x1) break;
      var py = yOf(rx[i]);
      if (!started) { ctx.moveTo(xOf(0), py); started = true; }
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ---- reading the trace ------------------------------------------------
  function setHover(i) {
    hover = i;
    draw();
    if (i < 0) { tip.hidden = true; return; }
    var ch = NAME.charAt(i);
    tip.innerHTML = "<b>" + (ch === " " ? "space" : ch) + "</b>levels " + samples[2 * i] + " and " + samples[2 * i + 1];
    tip.hidden = false;
    placeTip();
  }

  function placeTip() {
    var cx = (xOf(hover * 2) + xOf(hover * 2 + 2)) / 2;
    var half = tip.offsetWidth / 2;
    tip.style.left = Math.max(half, Math.min(W - half, cx)) + "px";
  }

  function charAt(clientX) {
    var r = canvas.getBoundingClientRect();
    var s = Math.floor(((clientX - r.left - PAD_L) / (W - PAD_L - PAD_R)) * N);
    return s < 0 || s >= N ? -1 : Math.floor(s / 2);
  }

  canvas.addEventListener("pointermove", function (e) {
    var i = charAt(e.clientX);
    if (i !== hover) setHover(i);
  });
  canvas.addEventListener("pointerdown", function (e) { setHover(charAt(e.clientX)); });
  canvas.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse" && document.activeElement !== canvas) setHover(-1);
  });
  canvas.addEventListener("focus", function () { if (hover < 0) setHover(0); });
  canvas.addEventListener("blur", function () { setHover(-1); });
  canvas.addEventListener("keydown", function (e) {
    var n = NAME.length;
    if (e.key === "ArrowRight") setHover((hover + 1) % n);
    else if (e.key === "ArrowLeft") setHover((hover - 1 + n) % n);
    else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(n - 1);
    else if (e.key === "Escape") { setHover(-1); canvas.blur(); }
    else return;
    e.preventDefault();
  });

  // ---- start ------------------------------------------------------------
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function sweep() {
    if (reduce) { progress = 1; draw(); return; }
    var t0 = null, DUR = 1900;
    function step(t) {
      if (t0 === null) t0 = t;
      progress = Math.min(1, (t - t0) / DUR);
      draw();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(plot);
  else window.addEventListener("resize", resize);
  resize();

  if (window.matchMedia) {
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    if (dark.addEventListener) dark.addEventListener("change", draw);
  }

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(sweep, sweep);
})();

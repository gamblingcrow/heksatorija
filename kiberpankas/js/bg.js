/* Fonas: YouTube / video failas / sugeneruotas miestas. Plius LCD laikrodis,
   juosta ir „vizualizatorius" kairiajame grotuve. */
(function () {
  const KP = window.KP;
  const cfg = (window.KP_CONFIG || {}).background || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.style.setProperty("--bg-dim", cfg.dim ?? 0.55);

  /* ---------------- video ---------------- */
  function mountVideo() {
    const host = KP.$("#bg-video");
    if (cfg.type === "youtube" && cfg.youtubeId) {
      const id = encodeURIComponent(cfg.youtubeId);
      const p = new URLSearchParams({
        autoplay: 1, mute: 1, loop: 1, playlist: cfg.youtubeId, controls: 0, disablekb: 1,
        modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, start: cfg.youtubeStart || 0
      });
      host.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?${p}" allow="autoplay; encrypted-media" tabindex="-1" title="Fonas"></iframe>`;
      return true;
    }
    if (cfg.type === "file" && cfg.src) {
      const v = document.createElement("video");
      Object.assign(v, { src: cfg.src, autoplay: true, muted: true, loop: true, playsInline: true });
      v.setAttribute("muted", "");
      v.addEventListener("error", () => { v.remove(); startCity(); });
      host.appendChild(v);
      return true;
    }
    return false;
  }

  /* ---------------- sugeneruotas miestas ----------------
     Brutalistiniai bokštai, retos šviečiančios langų eilės, lietus,
     besisukantis prožektorius ir blankūs simbolių stulpeliai. */
  function startCity() {
    const cv = KP.$("#bg-canvas");
    const ctx = cv.getContext("2d");
    const SCALE = 0.5;
    let W, H, towers, drops, glyphCols, t0 = performance.now();

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function build() {
      W = cv.width = Math.ceil(innerWidth * SCALE);
      H = cv.height = Math.ceil(innerHeight * SCALE);
      towers = [];
      for (let layer = 0; layer < 3; layer++) {
        let x = -20;
        while (x < W + 20) {
          const w = rnd(18, 60) * (1 + layer * 0.35);
          const h = rnd(H * 0.18, H * (0.45 + layer * 0.18));
          const wins = [];
          const cols = Math.floor(w / 5), rows = Math.floor(h / 6);
          for (let c = 0; c < cols; c++)
            for (let r = 0; r < rows; r++)
              if (Math.random() < 0.06 - layer * 0.012) wins.push([c * 5 + 2, r * 6 + 3, Math.random()]);
          towers.push({ x, w, h, layer, wins, antenna: Math.random() < 0.25, red: Math.random() < 0.08 });
          x += w + rnd(2, 14);
        }
      }
      drops = Array.from({ length: Math.floor(W / 3) }, () => ({ x: rnd(0, W), y: rnd(0, H), v: rnd(4, 9), l: rnd(5, 14) }));
      glyphCols = Array.from({ length: Math.floor(W / 14) }, (_, i) => ({ x: i * 14 + 4, y: rnd(-H, H), v: rnd(0.4, 1.4) }));
    }

    const GLYPHS = "ĄČĘĖĮŠŲŪŽ01KP#/<>=+ｱｲｳ";

    function frame(now) {
      const t = (now - t0) / 1000;
      // dangus
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#030403"); g.addColorStop(0.55, "#0b0e0d"); g.addColorStop(1, "#141816");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // simbolių stulpeliai (labai blankūs)
      ctx.font = "10px monospace";
      for (const c of glyphCols) {
        c.y += c.v; if (c.y > H + 120) c.y = rnd(-200, -20);
        for (let k = 0; k < 8; k++) {
          ctx.fillStyle = `rgba(67,255,123,${0.08 - k * 0.009})`;
          ctx.fillText(GLYPHS[(Math.floor(t * 3 + c.x + k) % GLYPHS.length)], c.x, c.y - k * 11);
        }
      }

      // prožektorius
      const ang = Math.sin(t * 0.18) * 0.55 - Math.PI / 2;
      const sx = W * 0.62, sy = H;
      ctx.save();
      ctx.translate(sx, sy); ctx.rotate(ang + Math.PI / 2);
      const bg = ctx.createLinearGradient(0, 0, 0, -H * 1.3);
      bg.addColorStop(0, "rgba(205,210,204,.10)"); bg.addColorStop(1, "rgba(205,210,204,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-H * 0.22, -H * 1.3); ctx.lineTo(H * 0.22, -H * 1.3); ctx.lineTo(6, 0); ctx.fill();
      ctx.restore();

      // bokštai
      for (const tw of towers) {
        const shade = [11, 16, 22][tw.layer];
        ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 1})`;
        const top = H - tw.h;
        ctx.fillRect(tw.x, top, tw.w, tw.h);
        if (tw.antenna) { ctx.fillRect(tw.x + tw.w / 2, top - 14, 1, 14); }
        if (tw.antenna && Math.sin(t * 3 + tw.x) > 0.6) { ctx.fillStyle = "#c1121f"; ctx.fillRect(tw.x + tw.w / 2 - 1, top - 16, 3, 2); }
        if (tw.red) { ctx.fillStyle = "rgba(193,18,31,.55)"; ctx.fillRect(tw.x + tw.w * 0.3, top + 6, tw.w * 0.4, Math.min(tw.h * 0.5, 60)); }
        for (const [wx, wy, ph] of tw.wins) {
          const on = Math.sin(t * 0.4 + ph * 40) > -0.7;
          if (!on) continue;
          ctx.fillStyle = ph > 0.92 ? "rgba(67,255,123,.7)" : ph > 0.85 ? "rgba(255,190,120,.5)" : "rgba(205,210,204,.35)";
          ctx.fillRect(tw.x + wx, top + wy, 2, 2);
        }
      }

      // rūkas apačioje
      const fg = ctx.createLinearGradient(0, H * 0.7, 0, H);
      fg.addColorStop(0, "rgba(30,34,32,0)"); fg.addColorStop(1, "rgba(30,34,32,.55)");
      ctx.fillStyle = fg; ctx.fillRect(0, H * 0.7, W, H * 0.3);

      // lietus
      ctx.strokeStyle = "rgba(170,180,175,.22)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of drops) {
        d.y += d.v; d.x -= d.v * 0.18;
        if (d.y > H) { d.y = rnd(-20, 0); d.x = rnd(0, W + 40); }
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.18, d.y - d.l);
      }
      ctx.stroke();

      if (!reduce) requestAnimationFrame(frame);
    }

    build();
    addEventListener("resize", build);
    requestAnimationFrame(frame);
  }

  if (!mountVideo()) startCity();

  /* ---------------- LCD: laikrodis, data, juosta ---------------- */
  const clock = KP.$("#lcd-clock"), date = KP.$("#lcd-date");
  function tickClock() {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" });
    // žaidimo pasaulyje visada 2023-ieji
    date.textContent = `2023.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }
  tickClock(); setInterval(tickClock, 10000);

  const items = (window.KP_CONFIG.ticker || []).join("   ///   ");
  KP.$("#lcd-ticker").textContent = items + "   ///   ";

  /* ---------------- LCD vizualizatorius ---------------- */
  const vz = KP.$("#lcd-viz"), vc = vz.getContext("2d");
  const N = 29, bars = new Array(N).fill(0), peaks = new Array(N).fill(0);
  function viz(now) {
    vc.clearRect(0, 0, vz.width, vz.height);
    const t = now / 1000;
    for (let i = 0; i < N; i++) {
      const target = (Math.sin(t * 2.1 + i * 0.7) * 0.5 + 0.5) * (Math.sin(t * 0.9 + i * 0.23) * 0.5 + 0.5) * (1 - i / N * 0.45) + Math.random() * 0.12;
      bars[i] += (target - bars[i]) * 0.25;
      peaks[i] = Math.max(peaks[i] - 0.012, bars[i]);
      const h = Math.round(bars[i] * 15) * 2;
      for (let y = 0; y < h; y += 2) {
        vc.fillStyle = y > 24 ? "#ff2d3d" : y > 16 ? "#d6ff5a" : "#43ff7b";
        vc.fillRect(i * 8, vz.height - y - 2, 6, 1);
      }
      vc.fillStyle = "#9dffbb";
      vc.fillRect(i * 8, vz.height - Math.round(peaks[i] * 15) * 2 - 3, 6, 1);
    }
    if (!reduce) requestAnimationFrame(viz);
  }
  requestAnimationFrame(viz);
})();

/* Eteris: transliacija (Twitch / YouTube) + prisijungimas prie Foundry VTT. */
(function () {
  const KP = window.KP;
  const cfg = KP_CONFIG.live;

  /* Foundry turi viešą /api/status (JSON). Jei CORS neleidžia – būsena „nežinoma". */
  async function foundryStatus() {
    if (!cfg.foundryUrl) return { state: "none" };
    try {
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(cfg.foundryUrl.replace(/\/$/, "") + "/api/status", { signal: ctl.signal });
      const j = await r.json();
      return { state: j.active ? "on" : "idle", users: j.users, world: j.world, version: j.version };
    } catch { return { state: "unknown" }; }
  }

  function staticNoise(cv) {
    const ctx = cv.getContext("2d");
    cv.width = 160; cv.height = 90;
    let raf;
    const img = ctx.createImageData(160, 90);
    const draw = () => {
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 60 | 0;
        img.data[i] = v; img.data[i + 1] = v + (Math.random() < 0.002 ? 120 : 0); img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      raf = setTimeout(() => requestAnimationFrame(draw), 70);
    };
    draw();
    return () => clearTimeout(raf);
  }

  KP.views.live = {
    async mount(root) {
      let player = "";
      if (cfg.twitchChannel) {
        player = `<iframe src="https://player.twitch.tv/?channel=${encodeURIComponent(cfg.twitchChannel)}&parent=${encodeURIComponent(location.hostname || "localhost")}&muted=true" allowfullscreen title="Transliacija"></iframe>`;
      } else if (cfg.youtubeLiveId) {
        player = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(cfg.youtubeLiveId)}?autoplay=1&mute=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Transliacija"></iframe>`;
      }
      const onAir = !!player;
      KP.$("#lcd-live").classList.toggle("on", onAir);
      KP.$("#lcd-live").textContent = onAir ? "ON AIR" : "OFF AIR";

      root.innerHTML = `
        <p class="kicker">Eteris · sesijos tiesiogiai</p>
        <h1>Jungtis</h1>
        <div class="live-grid">
          <section class="panel">
            <div class="panel-h">Transliacija <span class="r">${onAir ? (cfg.twitchChannel ? "TWITCH · " + KP.esc(cfg.twitchChannel) : "YOUTUBE") : "NĖRA SIGNALO"}</span></div>
            <div class="screen">${player || `<canvas id="noise"></canvas><div class="off">NĖRA SIGNALO<small>Transliacijos kanalas nenurodytas · js/config.js → live</small></div>`}</div>
          </section>
          <div style="display:flex;flex-direction:column;gap:12px">
            <section class="panel">
              <div class="panel-h">Foundry VTT <span class="r" id="fstat"><span class="lamp unk"></span> tikrinama</span></div>
              <div class="panel-b">
                <ol class="steps">
                  <li><span>Paspausk <b>Jungtis prie stalo</b> — Foundry atsidarys naujame lange.</span></li>
                  <li><span>${KP.esc(cfg.foundryNote)}</span></li>
                  <li><span>Žiūrėk transliaciją čia arba Discord'e, kalbėk ten.</span></li>
                </ol>
                <div class="btn-row" style="margin-top:12px">
                  ${cfg.foundryUrl ? `<a class="btn btn--red" href="${KP.esc(cfg.foundryUrl.replace(/\/$/, ""))}/join" target="_blank" rel="noopener" style="flex:1">Jungtis prie stalo ↗</a>`
                                   : `<button class="btn" disabled style="flex:1">Foundry adresas nenurodytas</button>`}
                  ${cfg.discordUrl ? `<a class="btn" href="${KP.esc(cfg.discordUrl)}" target="_blank" rel="noopener">Discord ↗</a>` : ""}
                </div>
                <p class="muted" id="fworld" style="font-size:11px;margin:10px 0 0"></p>
              </div>
            </section>
            <section class="panel">
              <div class="panel-h">Kita sesija</div>
              <div class="countdown inset" style="margin:10px">${KP.countdown(cfg.nextSession) || "TBA"}
                <small>${cfg.nextSession ? new Date(cfg.nextSession).toLocaleString("lt-LT") : "GM DAR NEPASKELBĖ"}</small></div>
            </section>
          </div>
        </div>`;

      const stop = !player ? staticNoise(KP.$("#noise", root)) : null;
      foundryStatus().then((s) => {
        const el = KP.$("#fstat", root); if (!el) return;
        const map = { none: ["", "NENUSTATYTA"], unknown: ["unk", "BŪSENA NEŽINOMA"], idle: ["bad", "PASAULIS NEPALEISTAS"], on: ["ok", "STALAS ATVIRAS"] };
        const [cls, txt] = map[s.state];
        el.innerHTML = `<span class="lamp ${cls}"></span> ${txt}`;
        if (s.state === "on") KP.$("#fworld", root).textContent = `Pasaulis: ${s.world || "?"} · prisijungę: ${s.users ?? "?"} · v${s.version || "?"}`;
      });
      return { destroy: () => stop?.() };
    }
  };
})();

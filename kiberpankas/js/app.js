/* Maršrutizatorius (#/...) ir bendras apvalkalas. */
(function () {
  const KP = window.KP;
  const view = KP.$("#view");

  const ROUTES = [
    { re: /^\/?$/, name: "home", title: "Pagrindinis" },
    { re: /^\/wiki(?:\/(.*))?$/, name: "wiki", title: "Archyvas" },
    { re: /^\/gop\/?$/, name: "gop", title: "Grupuotės · Organizacijos · Partijos" },
    { re: /^\/zemelapis\/?$/, name: "map", title: "Žemėlapis — Kaunas" },
    { re: /^\/parduotuve(?:\/(.*))?$/, name: "shop", title: "Parduotuvė" },
    { re: /^\/eteris\/?$/, name: "live", title: "Eteris / Foundry" },
    { re: /^\/terminalas\/?$/, name: "me", title: "Terminalas" }
  ];

  let current = null;

  async function route() {
    const path = decodeURIComponent(location.hash.replace(/^#/, "") || "/");
    const r = ROUTES.find((x) => x.re.test(path)) || ROUTES[0];
    const arg = (path.match(r.re) || [])[1] || "";

    KP.$$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === r.name));
    KP.$("#win-title").textContent = r.title;
    document.title = (r.name === "home" ? "KiberPankas — Kaunas 2023" : `${r.title} · KiberPankas`);

    if (current?.name === r.name && current.update) { current.update(arg); return; }
    current?.destroy?.();
    view.innerHTML = "";
    view.scrollTop = 0;
    KP.status("KRAUNAMA…");
    try {
      const mod = KP.views[r.name];
      current = { name: r.name, ...(await mod.mount(view, arg)) };
      KP.status("SISTEMA PARUOŠTA");
    } catch (e) {
      console.error(e);
      view.innerHTML = `<p class="kicker">Klaida</p><h2>Signalas pamestas</h2><p class="muted">${KP.esc(e.message)}</p>`;
      KP.status("KLAIDA");
      current = { name: r.name };
    }
    if (innerWidth > 860) view.focus({ preventScroll: true });
  }

  /* ---- kairiojo grotuvo vartotojo blokas ---- */
  function renderUser(u) {
    const box = KP.$("#deck-user");
    const mode = KP.auth.mode === "demo" ? "DEMO REŽIMAS" : "TINKLAS";
    KP.$("#sbar-mode").textContent = mode;
    if (u) {
      box.innerHTML = `
        <div class="who">&gt; ${KP.esc(u.callsign)}</div>
        <div class="sub">${u.role === "gm" ? "GM · " : ""}PRISIJUNGTA · ${mode}</div>
        <div class="btn-row"><a class="btn btn--sm" href="#/terminalas">Veikėjas</a><button class="btn btn--sm" id="logout">Atsijungti</button></div>`;
      KP.$("#logout", box).onclick = () => KP.auth.signOut();
      KP.$("#nav-me").textContent = u.callsign.length > 14 ? u.callsign.slice(0, 13) + "…" : u.callsign;
      KP.$("#nav-me-tag").textContent = "OK";
    } else {
      box.innerHTML = `
        <div class="sub" style="margin-top:0">ŽAIDĖJO TERMINALAS UŽRAKINTAS</div>
        <a class="btn btn--red" style="width:100%" href="#/terminalas">Prisijungti</a>`;
      KP.$("#nav-me").textContent = "Terminalas";
      KP.$("#nav-me-tag").textContent = "LOCK";
    }
  }

  const live = KP_CONFIG.live || {};
  if (live.twitchChannel || live.youtubeLiveId) { KP.$("#lcd-live").classList.add("on"); KP.$("#lcd-live").textContent = "ON AIR"; }

  KP.$("#shade-btn").onclick = () => KP.$("#deck").classList.toggle("shaded");

  /* žmogiškumo slankiklis kartais „trūkčioja" — dėl nuotaikos */
  const thumb = KP.$("#humanity-thumb");
  setInterval(() => { thumb.style.left = (62 + Math.random() * 14) + "%"; }, 2600);

  addEventListener("hashchange", route);
  KP.auth.onChange((u) => {
    renderUser(u);
    if (current?.name === "me" || current?.name === "shop") { current.destroy?.(); current = null; route(); }
  });

  KP.auth.init().catch((e) => { console.error(e); KP.toast("Paskyrų serveris nepasiekiamas", true); renderUser(null); }).finally(route);
})();

(function () {
  const KP = window.KP;

  KP.countdown = (iso) => {
    if (!iso) return null;
    const ms = new Date(iso) - Date.now();
    if (isNaN(ms)) return null;
    if (ms <= 0) return "DABAR";
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    return `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  KP.views.home = {
    async mount(root) {
      const live = KP_CONFIG.live || {};
      root.innerHTML = `
        <section class="hero">
          <div>
            <p class="kicker">Stalo vaidmenų žaidimas · Cyberpunk RED pagrindu</p>
            <h1>Kaunas,<span>2023</span></h1>
            <p class="lede">Vilnius atiduotas EEC. Vyriausybė persikėlė į Kauną. Arasaka jau turi čia pastatą, o Militech
              atidaro duris po savaitės. Vakarų Europa čia verčia senas technologijas ir žmones, kurių nenori.
              Kaunas iki šiol buvo gana saugus. Tas laikas baigiasi.</p>
            <span class="slogan">Kaunas saugus · kol kas</span>
          </div>
          <img class="hero-emblem" src="img/emblem.svg" alt="">
        </section>

        <div class="tiles">
          ${tile("#/wiki", "01 · Archyvas", "Pasaulis", "Istorija, vietos, korporacijos, taisyklės. Obsidian užrašai.")}
          ${tile("#/gop", "02 · GOP", "Grupuotės", "25 gaujos, 26 organizacijos, 11 partijų. Kas kur sėdi ir ko nori.")}
          ${tile("#/zemelapis", "03 · Kartografija", "Žemėlapis", "Slabotkė, Aleksotas, Šančiai, VII fortas. Kur geriau neiti naktį.")}
          ${tile("#/parduotuve", "04 · Juodoji rinka", "Parduotuvė", "Ginklai, šarvai, kibernetika. Kainos eurobaksais.")}
          ${tile("#/eteris", "05 · Eteris", "Jungtis", "Transliacija ir prisijungimas prie Foundry stalo.")}
        </div>

        <div class="home-grid">
          <section class="panel">
            <div class="panel-h">Naujienų kanalas <span class="r">KNS-24</span></div>
            <div id="news"><div class="news-item muted">Kraunama…</div></div>
          </section>
          <div style="display:flex;flex-direction:column;gap:12px">
            <section class="panel">
              <div class="panel-h">Kita sesija</div>
              <div class="countdown inset" style="margin:10px" id="cd">${KP.countdown(live.nextSession) || "TBA"}
                <small>${live.nextSession ? new Date(live.nextSession).toLocaleString("lt-LT", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "GM DAR NEPASKELBĖ"}</small>
              </div>
              <div class="panel-b" style="padding-top:0"><a class="btn btn--red" href="#/eteris" style="width:100%">Prisijungti prie stalo</a></div>
            </section>
            <section class="panel">
              <div class="panel-h">Situacija</div>
              <div class="panel-b">
                <ul class="dlist">
                  <li><span>Prezidentas</span><span>J. Ramanauskas</span></li>
                  <li><span>Sostinė (de facto)</span><span>Kaunas</span></li>
                  <li><span>Vilnius</span><span>EEC / Lenkija</span></li>
                  <li><span>Arasaka</span><span>VEIKIA</span></li>
                  <li><span>Militech</span><span class="red">−7 D.</span></li>
                  <li><span>Baltijos Lyga</span><span>DERYBOS</span></li>
                </ul>
              </div>
            </section>
          </div>
        </div>`;

      const cd = KP.$("#cd", root);
      const timer = setInterval(() => {
        const v = KP.countdown(live.nextSession);
        if (v && cd.firstChild) cd.firstChild.textContent = v;
      }, 30000);

      try {
        const news = await KP.fetchJSON("data/news.json");
        KP.$("#news", root).innerHTML = news.map((n) => `
          <article class="news-item">
            <div class="d">${KP.esc(n.date)} · ${KP.esc(n.source || "KNS")}</div>
            <div class="t">${KP.esc(n.title)}</div>
            <p>${KP.esc(n.text)}</p>
          </article>`).join("");
      } catch {
        KP.$("#news", root).innerHTML = `<div class="news-item muted">Kanalas tylus.</div>`;
      }

      return { destroy: () => clearInterval(timer) };
    }
  };

  function tile(href, k, big, txt) {
    return `<a class="tile panel" href="${href}"><div class="panel-h">${k}</div><div class="panel-b"><div class="big">${big}</div><p>${txt}</p></div></a>`;
  }
})();

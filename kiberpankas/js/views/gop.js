/* GOP — Grupuotės / Organizacijos / Politinės partijos (data/gop.json) */
(function () {
  const KP = window.KP;

  /* Reputacija/bazinė agresija: -5 … +1 → 7 langeliai */
  function agg(v) {
    const n = Number(v) || 0;
    const cells = [-5, -4, -3, -2, -1, 0, 1].map((x) => {
      const on = n < 0 ? x < 0 && x >= n : n > 0 ? x >= 0 && x <= n : x === 0;
      return `<i class="${on ? "on " + (x < 0 ? "neg" : x > 0 ? "pos" : "zero") : ""}"></i>`;
    }).join("");
    return `<div><div class="agg" title="Bazinė agresija ${n}">${cells}</div><div class="agg-lbl"><span>PRIEŠIŠKI</span><span>${n > 0 ? "+" + n : n}</span><span>DRAUGIŠKI</span></div></div>`;
  }

  KP.views.gop = {
    async mount(root) {
      const data = await KP.fetchJSON("data/gop.json");
      let tab = "gangs", term = "";

      root.innerHTML = `
        <p class="kicker">Kauno galios žemėlapis</p>
        <h1>GOP</h1>
        <p class="lede" style="margin-top:12px">Grupuotės, Organizacijos ir Politinės partijos. Agresijos skalė rodo, kaip jie reaguos, kai pirmą kartą užkliūsi.</p>
        <div class="filters">
          <button class="btn" data-t="gangs">Grupuotės · ${data.gangs.length}</button>
          <button class="btn" data-t="orgs">Organizacijos · ${data.orgs.length}</button>
          <button class="btn" data-t="parties">Partijos · ${data.parties.length}</button>
          <input class="inp" id="gq" placeholder="filtruoti…" aria-label="Filtruoti">
        </div>
        <div class="gop-grid" id="gg"></div>`;

      const paint = () => {
        KP.$$("[data-t]", root).forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
        const t = term.toLowerCase();
        const list = data[tab].filter((x) => !t || JSON.stringify(x).toLowerCase().includes(t));
        KP.$("#gg", root).innerHTML = list.map((x, i) => card(tab, x, data[tab].indexOf(x) + 1)).join("") || `<p class="muted">Nieko.</p>`;
      };
      KP.$$("[data-t]", root).forEach((b) => (b.onclick = () => { tab = b.dataset.t; paint(); }));
      KP.$("#gq", root).oninput = (e) => { term = e.target.value; paint(); };
      paint();
      return {};
    }
  };

  function card(tab, x, n) {
    const no = String(n).padStart(2, "0");
    if (tab === "gangs") return `
      <article class="gcard panel">
        <div class="panel-h">Grupuotė ${no}${x.tag ? ` <span class="r">${KP.esc(x.tag)}</span>` : ""}</div>
        <div class="panel-b">
          <div class="gcard-top"><div class="gcard-no">${no}</div><h3>${KP.esc(x.name)}</h3></div>
          <div class="q">„${KP.esc(x.quote)}“</div>
          <div class="d">${KP.esc(x.desc)}</div>
          ${agg(x.rep)}
          <div class="base">◢ ${KP.esc(x.base)}${x.vibe ? ` · Muzika: ${KP.esc(x.vibe)}` : ""}</div>
        </div>
      </article>`;
    if (tab === "orgs") return `
      <article class="gcard panel">
        <div class="panel-h">Organizacija ${no}</div>
        <div class="panel-b">
          <div class="gcard-top"><div class="gcard-no">${no}</div><h3>${KP.esc(x.name)}</h3></div>
          ${x.slogan ? `<div class="q">„${KP.esc(x.slogan)}“</div>` : ""}
          <div class="d">${KP.esc(x.desc || "Duomenų nėra.")}</div>
          ${x.lead ? `<div class="base">◢ ${KP.esc(x.lead)}</div>` : ""}
        </div>
      </article>`;
    return `
      <article class="gcard panel">
        <div class="panel-h">Partija ${no}</div>
        <div class="panel-b">
          <div class="gcard-top"><div class="gcard-no">${no}</div><h3>${KP.esc(x.name)}</h3></div>
          <div class="d">${KP.esc(x.desc)}</div>
        </div>
      </article>`;
  }
})();

/* Terminalas: prisijungimas + žaidėjo veikėjo dosjė. */
(function () {
  const KP = window.KP;

  KP.views.me = {
    async mount(root) {
      if (!KP.auth.user) return gate(root);
      return dossier(root);
    }
  };

  /* ================= PRISIJUNGIMAS ================= */
  function gate(root) {
    const demo = KP.auth.mode === "demo";
    let mode = "in";
    root.innerHTML = `
      <div class="gate panel">
        <div class="panel-h">KP-TERM v2.3 <span class="r">${demo ? "DEMO" : "SECURE"}</span></div>
        <div class="panel-b">
          <div class="gate-head" id="gh"></div>
          <div class="tabs"><button class="btn on" data-m="in">Prisijungti</button><button class="btn" data-m="up">Nauja paskyra</button></div>
          <form id="gf" autocomplete="on">
            <div class="field"><label for="g1">${demo ? "Šaukinys" : "El. paštas"}</label>
              <input class="inp" id="g1" name="login" ${demo ? "" : 'type="email"'} required autocomplete="username" placeholder="${demo ? "pvz. demo" : "vardas@pastas.lt"}"></div>
            <div class="field up-only" hidden><label for="g3">Šaukinys (rodomas kitiems)</label>
              <input class="inp" id="g3" name="callsign" placeholder="pvz. @LV1S"></div>
            <div class="field"><label for="g2">Slaptažodis</label>
              <input class="inp" id="g2" name="pass" type="password" required autocomplete="current-password"></div>
            <button class="btn btn--red" style="width:100%" id="gb">Jungtis</button>
          </form>
          ${demo ? `<div class="notice"><b>Demo režimas.</b> Paskyros saugomos tik šioje naršyklėje. Išbandyk: šaukinys <code>demo</code>, slaptažodis <code>demo</code>. Tikroms paskyroms — žr. README (Supabase).</div>` : ""}
        </div>
      </div>`;

    KP.typeOut(KP.$("#gh", root), "> RYŠYS UŽMEGZTAS\n> KAUNO TINKLO MAZGAS 07\n> TAPATYBĖ NEPATVIRTINTA_");

    KP.$$("[data-m]", root).forEach((b) => (b.onclick = () => {
      mode = b.dataset.m;
      KP.$$("[data-m]", root).forEach((x) => x.classList.toggle("on", x === b));
      KP.$$(".up-only", root).forEach((x) => (x.hidden = mode !== "up" || demo));
      KP.$("#g2", root).autocomplete = mode === "up" ? "new-password" : "current-password";
      KP.$("#gb", root).textContent = mode === "up" ? "Sukurti paskyrą" : "Jungtis";
    }));

    KP.$("#gf", root).onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const btn = KP.$("#gb", root);
      btn.disabled = true;
      try {
        if (mode === "up") {
          const r = await KP.auth.signUp(f.get("login"), f.get("pass"), f.get("callsign"));
          if (r === "confirm") KP.toast("Patikrink el. paštą ir patvirtink paskyrą");
        } else await KP.auth.signIn(f.get("login"), f.get("pass"));
      } catch (err) {
        KP.toast(err.message, true);
        KP.$("#gh", root).textContent = "> PRIEIGA ATMESTA\n> " + err.message.toUpperCase();
      } finally { btn.disabled = false; }
    };
    return {};
  }

  /* ================= DOSJĖ ================= */
  async function dossier(root) {
    const u = KP.auth.user;
    let ch = await KP.auth.getCharacter();
    const orders = await KP.auth.listOrders();

    const meter = (label, cur, max, cls = "") => {
      const on = Math.round((Math.max(0, cur) / Math.max(1, max)) * 40);
      return `<div class="meter"><div class="meter-top"><span>${label}</span><span class="v">${cur}/${max}</span></div>
        <div class="meter-bar ${cls}">${Array.from({ length: 40 }, (_, i) => `<i class="${i < on ? "on" : ""}"></i>`).join("")}</div></div>`;
    };
    const list = (arr, fmt) => (arr?.length ? `<ul class="dlist">${arr.map(fmt).join("")}</ul>` : `<p class="muted" style="font-size:12px">Tuščia.</p>`);
    const lines = (arr) => (arr || []).join("\n");

    function paint(editing = false) {
      root.innerHTML = `
        <p class="kicker">Veikėjo dosjė · ${KP.esc(u.callsign)}</p>
        <h1>${KP.esc(ch.name || "Bevardis")}</h1>
        <div class="btn-row" style="margin-top:14px">
          ${ch.handle ? `<span class="tag tag--lcd">„${KP.esc(ch.handle)}“</span>` : ""}
          ${ch.role ? `<span class="tag tag--red">${KP.esc(ch.role)}</span>` : ""}
          <span style="flex:1"></span>
          ${ch.sheetUrl ? `<a class="btn" href="${KP.esc(ch.sheetUrl)}" target="_blank" rel="noopener">Pilnas lapas ↗</a>` : ""}
          <button class="btn ${editing ? "btn--red" : ""}" id="edit">${editing ? "Išsaugoti" : "Redaguoti"}</button>
          ${editing ? `<button class="btn" id="cancel">Atšaukti</button>` : ""}
        </div>

        <div class="dossier ${editing ? "editing" : ""}">
          <div>
            <div class="portrait" style="${ch.portrait ? `background-image:url('${encodeURI(ch.portrait)}')` : ""}">
              ${ch.portrait ? "" : `<img class="ph" src="img/emblem.svg" alt="">`}
            </div>
            <div class="edit-only" style="margin-top:10px">
              ${fld("name", "Vardas", ch.name)}${fld("handle", "Klyčkė", ch.handle)}${fld("role", "Rolė", ch.role)}
              ${fld("portrait", "Portreto URL", ch.portrait)}${fld("sheetUrl", "Lapo nuoroda (Sheets/PDF)", ch.sheetUrl)}
            </div>
            <section class="panel" style="margin-top:10px">
              <div class="panel-h">Finansai</div>
              <div class="panel-b">
                <div class="view-only"><div class="price">${KP.fmtNum(ch.bank)} <small style="font-size:20px">EB</small></div>
                  <ul class="dlist" style="margin-top:6px"><li><span>Prenumeratos</span><span>${KP.fmtNum(ch.subscriptions)}</span></li>
                  <li><span>REP</span><span>${ch.rep ?? 0}</span></li><li><span>IP</span><span>${ch.ip ?? 0}</span></li></ul></div>
                <div class="edit-only">${fld("bank", "Bankas (EB)", ch.bank, "number")}${fld("subscriptions", "Prenumeratos", ch.subscriptions, "number")}${fld("rep", "REP", ch.rep, "number")}${fld("ip", "IP", ch.ip, "number")}</div>
              </div>
            </section>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
            <section class="panel"><div class="panel-h">Statai</div><div class="panel-b">
              <div class="statbox">${KP.STATS.map((s) => `<div><b>${s}</b>${editing ? `<input type="number" data-stat="${s}" value="${ch.stats?.[s] ?? 0}" aria-label="${s}">` : `<span>${ch.stats?.[s] ?? 0}</span>`}</div>`).join("")}</div>
              <div class="view-only">${meter("HP", ch.hp.cur, ch.hp.max, "hp")}${meter("Žmogiškumas", ch.humanity.cur, ch.humanity.max)}</div>
              <div class="edit-only cols-2" style="margin-top:10px">
                ${fld("hp.cur", "HP dabar", ch.hp.cur, "number")}${fld("hp.max", "HP max", ch.hp.max, "number")}
                ${fld("humanity.cur", "Žmogiškumas dabar", ch.humanity.cur, "number")}${fld("humanity.max", "Žmogiškumas max", ch.humanity.max, "number")}
              </div>
            </div></section>

            <div class="cols-2">
              <section class="panel"><div class="panel-h">Ginklai</div><div class="panel-b">
                <div class="view-only">${list(ch.weapons, (w) => `<li><span>${KP.esc(w.name)}</span><span>${KP.esc(w.dmg || "")}</span></li>`)}</div>
                <div class="edit-only">${area("weapons", "Vienas eilutėje: pavadinimas | žala | ROF | apkaba", (ch.weapons || []).map((w) => [w.name, w.dmg, w.rof, w.ammo].join(" | ")).join("\n"))}</div>
              </div></section>
              <section class="panel"><div class="panel-h">Šarvai / rūbai</div><div class="panel-b">
                <div class="view-only">${list(ch.armor, (a) => `<li><span>${KP.esc(a.name)}</span><span>SP ${KP.esc(a.sp)}</span></li>`)}</div>
                <div class="edit-only">${area("armor", "pavadinimas | SP | tier", (ch.armor || []).map((a) => [a.name, a.sp, a.tier].join(" | ")).join("\n"))}</div>
              </div></section>
              <section class="panel"><div class="panel-h">Įgūdžiai</div><div class="panel-b">
                <div class="view-only">${list(ch.skills, (s) => `<li><span>${KP.esc(s.name)} <small class="muted">${KP.esc(s.stat)}</small></span><span>${s.rank} → ${(Number(ch.stats?.[s.stat]) || 0) + (Number(s.rank) || 0)}</span></li>`)}</div>
                <div class="edit-only">${area("skills", "įgūdis | STAT | rank", (ch.skills || []).map((s) => [s.name, s.stat, s.rank].join(" | ")).join("\n"))}</div>
              </div></section>
              <section class="panel"><div class="panel-h">Kibernetika</div><div class="panel-b">
                <div class="view-only">${list(ch.cyberware, (c) => `<li><span>${KP.esc(c)}</span><span></span></li>`)}</div>
                <div class="edit-only">${area("cyberware", "viena eilutėje", lines(ch.cyberware))}</div>
              </div></section>
            </div>

            <section class="panel"><div class="panel-h">Inventorius <span class="r">${(ch.gear || []).length}</span></div><div class="panel-b">
              <div class="view-only">${ch.gear?.length ? `<div class="btn-row">${ch.gear.map((g) => `<span class="tag">${KP.esc(g)}</span>`).join("")}</div>` : `<p class="muted" style="font-size:12px">Tuščia.</p>`}</div>
              <div class="edit-only">${area("gear", "viena eilutėje", lines(ch.gear))}</div>
            </div></section>

            <section class="panel"><div class="panel-h">Užrašai</div><div class="panel-b">
              <div class="view-only" style="white-space:pre-wrap;font-size:13px">${KP.esc(ch.notes || "—")}</div>
              <div class="edit-only">${area("notes", "", ch.notes || "")}</div>
            </div></section>

            <section class="panel"><div class="panel-h">Užsakymai <span class="r">${orders.length}</span></div><div class="panel-b">
              ${list(orders, (o) => `<li><span>${KP.esc(o.item?.name)} <small class="muted">${KP.esc(o.item?.shop || "")}</small></span><span>${KP.fmtNum(o.item?.price)} EB · ${KP.esc(o.status)}</span></li>`)}
            </div></section>
          </div>
        </div>`;

      KP.$("#edit", root).onclick = async () => {
        if (!editing) return paint(true);
        ch = collect();
        try { await KP.auth.saveCharacter(ch); KP.toast("Dosjė išsaugota"); paint(false); }
        catch (e) { KP.toast(e.message, true); }
      };
      const c = KP.$("#cancel", root); if (c) c.onclick = () => paint(false);
    }

    function fld(key, label, val, type = "text") {
      return `<div class="field"><label>${label}</label><input class="inp" data-k="${key}" type="${type}" value="${KP.esc(val ?? "")}"></div>`;
    }
    function area(key, ph, val) {
      return `<textarea class="inp" data-a="${key}" placeholder="${KP.esc(ph)}" aria-label="${KP.esc(key)}">${KP.esc(val)}</textarea>`;
    }
    function collect() {
      const n = structuredClone(ch);
      KP.$$("[data-k]", root).forEach((el) => {
        const v = el.type === "number" ? Number(el.value) || 0 : el.value.trim();
        const [a, b] = el.dataset.k.split(".");
        if (b) n[a][b] = v; else n[a] = v;
      });
      KP.$$("[data-stat]", root).forEach((el) => (n.stats[el.dataset.stat] = Number(el.value) || 0));
      const rows = (k) => KP.$(`[data-a="${k}"]`, root).value.split("\n").map((l) => l.trim()).filter(Boolean);
      const parts = (l) => l.split("|").map((s) => s.trim());
      n.weapons = rows("weapons").map((l) => { const [name, dmg, rof, ammo] = parts(l); return { name, dmg, rof, ammo }; });
      n.armor = rows("armor").map((l) => { const [name, sp, tier] = parts(l); return { name, sp, tier }; });
      n.skills = rows("skills").map((l) => { const [name, stat, rank] = parts(l); return { name, stat: (stat || "").toUpperCase(), rank: Number(rank) || 0 }; });
      n.cyberware = rows("cyberware");
      n.gear = rows("gear");
      n.notes = KP.$('[data-a="notes"]', root).value;
      return n;
    }

    paint(false);
    return {};
  }
})();

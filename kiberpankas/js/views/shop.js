/* Parduotuvė: prekės iš Google Sheets CSV arba data/shop.json.
   Prisijungęs žaidėjas gali pateikti užsakymą — GM jį patvirtina. */
(function () {
  const KP = window.KP;
  const cfg = KP_CONFIG.shop;

  async function load() {
    const json = await KP.fetchJSON(cfg.json).catch(() => ({ shops: [], items: [] }));
    if (!cfg.sheetCsv) return { ...json, source: "data/shop.json" };
    try {
      const rows = KP.parseCSV(await KP.fetchText(cfg.sheetCsv));
      const items = rows.map((r) => ({
        shop: r.parduotuve || "Kita", name: r.pavadinimas, type: r.tipas, price: Number(String(r.kaina).replace(/[^\d.]/g, "")) || 0,
        dmg: r.zala, rof: r.rof, ammo: r.apkaba, range: r.atstumas, desc: r.aprasymas, stock: r.kiekis, rarity: r.retumas
      })).filter((i) => i.name);
      const names = [...new Set(items.map((i) => i.shop))];
      const shops = names.map((n) => json.shops.find((s) => s.name === n) || { id: KP.slug(n), name: n });
      return { shops, items, source: "Google Sheets" };
    } catch (e) {
      console.warn("Sheets nepasiekiamas", e);
      return { ...json, source: "data/shop.json (Sheets nepasiekiamas)" };
    }
  }

  const cell = (v) => (v == null || v === "" ? "—" : KP.esc(v));

  KP.views.shop = {
    async mount(root, arg) {
      const data = await load();
      const user = KP.auth.user;
      let shopId = arg || data.shops[0]?.id, sel = null, term = "", type = "";

      root.innerHTML = `
        <p class="kicker">Juodoji rinka · kainos ${KP.esc(cfg.currency)}</p>
        <h1>Parduotuvė</h1>
        <div class="filters" id="stabs"></div>
        <div class="filters" style="margin-top:0">
          <input class="inp" id="sq" placeholder="ieškoti prekės…" aria-label="Ieškoti prekės">
          <select class="inp" id="st" style="width:200px" aria-label="Tipas"></select>
          <span class="lbl-px" style="margin-left:auto">Šaltinis: ${KP.esc(data.source)}</span>
        </div>
        <div class="shop">
          <div class="panel"><div class="panel-h" id="shead">Prekės</div>
            <div class="shop-table inset"><table class="tbl"><thead><tr>
              <th>#</th><th>Pavadinimas</th><th>Tipas</th><th>Žala</th><th>ROF</th><th>Apkaba</th><th>Atstumas</th><th class="num">Kaina</th>
            </tr></thead><tbody id="sbody"></tbody></table></div>
          </div>
          <aside class="panel shop-detail"><div class="panel-h">Prekė</div><div class="panel-b" id="sdet"></div></aside>
        </div>

        <section class="panel datafort" style="padding:14px">
          <img src="img/emblem.svg" alt="" width="46">
          <div>
            <div class="big">DATAFORT</div>
            <div class="muted" style="font-size:12px">Atskira duomenų tvirtovė su papildoma prekyba ir įrašais. Naršyklė gali rodyti įspėjimą — puslapis saugus, tiesiog primena prisijungimo formą.</div>
          </div>
          <div class="btn-row">
            <a class="btn btn--red" href="${KP.esc(cfg.datafortUrl)}" target="_blank" rel="noopener">Atidaryti ↗</a>
            <button class="btn" id="dfembed">Įterpti čia</button>
          </div>
        </section>`;

      const tabs = KP.$("#stabs", root);
      tabs.innerHTML = data.shops.map((s) => `<a class="btn" href="#/parduotuve/${encodeURIComponent(s.id)}" data-id="${KP.esc(s.id)}">${KP.esc(s.name)}</a>`).join("");

      KP.$("#dfembed", root).onclick = (e) => {
        const sec = e.target.closest(".datafort");
        if (sec.querySelector("iframe")) return sec.querySelector("iframe").remove();
        sec.insertAdjacentHTML("beforeend", `<iframe src="${KP.esc(cfg.datafortUrl)}" title="Datafort" referrerpolicy="no-referrer"></iframe>`);
      };

      const paint = () => {
        const shop = data.shops.find((s) => s.id === shopId) || data.shops[0];
        KP.$$("[data-id]", tabs).forEach((b) => b.classList.toggle("on", b.dataset.id === shop?.id));
        const inShop = data.items.filter((i) => !shop || i.shop === shop.name || i.shop === shop.id);
        const types = [...new Set(inShop.map((i) => i.type).filter(Boolean))];
        const st = KP.$("#st", root);
        st.innerHTML = `<option value="">visi tipai</option>` + types.map((t) => `<option ${t === type ? "selected" : ""}>${KP.esc(t)}</option>`).join("");
        const t = term.toLowerCase();
        const list = inShop.filter((i) => (!type || i.type === type) && (!t || `${i.name} ${i.desc}`.toLowerCase().includes(t)));
        KP.$("#shead", root).innerHTML = `${KP.esc(shop?.name || "Prekės")}<span class="r">${shop?.keeper && shop.keeper !== "—" ? "savininkas: " + KP.esc(shop.keeper) + " · " : ""}${list.length} vnt.</span>`;
        KP.$("#sbody", root).innerHTML = list.map((i, n) => `
          <tr data-n="${data.items.indexOf(i)}" class="${sel === i ? "sel" : ""}">
            <td>${String(n + 1).padStart(2, "0")}</td><td>${KP.esc(i.name)}</td><td>${cell(i.type)}</td><td>${cell(i.dmg)}</td>
            <td>${cell(i.rof)}</td><td>${cell(i.ammo)}</td><td>${cell(i.range)}</td><td class="num">${KP.fmtNum(i.price)}</td>
          </tr>`).join("") || `<tr><td colspan="8" class="muted">Tuščia lentyna.</td></tr>`;
        detail(sel && list.includes(sel) ? sel : null, shop);
      };

      const detail = (i, shop) => {
        const d = KP.$("#sdet", root);
        if (!i) {
          d.innerHTML = `<p class="mono-lcd" style="font-size:20px">&gt; pasirink prekę iš sąrašo</p><p class="muted" style="font-size:12px">${KP.esc(shop?.desc || "")}</p>`;
          return;
        }
        d.innerHTML = `
          <span class="tag ${i.rarity === "reta" || i.rarity === "nelegali" ? "tag--red" : "tag--lcd"}">${KP.esc(i.rarity || i.type || "prekė")}</span>
          <div class="big" style="margin-top:10px">${KP.esc(i.name)}</div>
          <div class="price">${KP.fmtNum(i.price)} <small style="font-size:22px">${KP.esc(cfg.currency)}</small></div>
          <div class="stat-grid">
            <div><b>ŽALA</b><span>${cell(i.dmg)}</span></div><div><b>ROF</b><span>${cell(i.rof)}</span></div>
            <div><b>APKABA</b><span>${cell(i.ammo)}</span></div><div><b>ATSTUMAS</b><span>${cell(i.range)}</span></div>
          </div>
          <p style="font-size:12.5px;color:var(--steel-2)">${KP.esc(i.desc || "")}</p>
          ${i.stock ? `<p class="lbl-px">Likutis: ${KP.esc(i.stock)}</p>` : ""}
          ${user ? `<button class="btn btn--red" id="buy" style="width:100%">Užsakyti</button><p class="muted" style="font-size:11px;margin-top:8px">Užsakymą patvirtina GM sesijos metu. Pinigai nurašomi tik tada.</p>`
                 : `<a class="btn" href="#/terminalas" style="width:100%">Prisijunk, kad užsakytum</a>`}`;
        const b = KP.$("#buy", d);
        if (b) b.onclick = async () => {
          try {
            await KP.auth.createOrder({ name: i.name, price: i.price, shop: shop?.name });
            KP.toast(`Užsakyta: ${i.name}`);
          } catch (e) { KP.toast(e.message, true); }
        };
      };

      KP.$("#sbody", root).onclick = (e) => {
        const tr = e.target.closest("tr[data-n]"); if (!tr) return;
        sel = data.items[tr.dataset.n]; paint();
      };
      KP.$("#sq", root).oninput = (e) => { term = e.target.value; paint(); };
      KP.$("#st", root).onchange = (e) => { type = e.target.value; paint(); };
      paint();

      return { update: (a) => { shopId = a || data.shops[0]?.id; sel = null; type = ""; paint(); } };
    }
  };
})();

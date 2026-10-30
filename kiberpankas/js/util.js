/* Bendri įrankiai: DOM, fetch, CSV, saugykla, pranešimai. */
(function () {
  const KP = (window.KP = window.KP || {});
  KP.views = {};

  KP.$ = (sel, root = document) => root.querySelector(sel);
  KP.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  KP.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Elementas iš HTML eilutės */
  KP.html = (str) => {
    const t = document.createElement("template");
    t.innerHTML = str.trim();
    return t.content.firstElementChild;
  };

  KP.fetchText = async (url) => {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.text();
  };
  KP.fetchJSON = async (url) => JSON.parse(await KP.fetchText(url));

  /* CSV su kabutėmis (Google Sheets „Publish to web" formatas) */
  KP.parseCSV = (text) => {
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map((h) => KP.slug(h).replace(/-/g, ""));
    return rows
      .filter((r) => r.some((v) => v.trim() !== ""))
      .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
  };

  /* lietuviškos raidės → lotyniškos, tarpai → brūkšniai */
  KP.slug = (s) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  /* localStorage gali būti užblokuotas — niekada nelūžtame */
  KP.store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };

  let toastT;
  KP.toast = (msg, err = false) => {
    KP.$(".toast")?.remove();
    const el = KP.html(`<div class="toast${err ? " err" : ""}" role="status">&gt; ${KP.esc(msg)}</div>`);
    document.body.appendChild(el);
    clearTimeout(toastT);
    toastT = setTimeout(() => el.remove(), 3200);
  };

  KP.status = (msg) => { const el = KP.$("#sbar-left"); if (el) el.textContent = msg; };

  /* „rašomosios mašinėlės" efektas LCD tekstui */
  KP.typeOut = (el, text, speed = 14) =>
    new Promise((res) => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = text; return res(); }
      let i = 0;
      el.textContent = "";
      const tick = () => {
        el.textContent = text.slice(0, ++i) + (i < text.length ? "█" : "");
        if (i < text.length) setTimeout(tick, speed); else res();
      };
      tick();
    });

  KP.fmtNum = (n) => Number(n || 0).toLocaleString("lt-LT");
})();

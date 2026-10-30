/* Wiki: Obsidian užrašų skaitytuvas.
   Palaiko [[nuorodas]], [[nuoroda|tekstas]], ![[paveikslas.png]], ==žymes==,
   %%komentarus%%, > [!callout] blokus ir YAML frontmatter (tags, aliases). */
(function () {
  const KP = window.KP;
  const cfg = KP_CONFIG.wiki;
  let index = null;            // [{path, name, dir}]
  let assets = [];             // paveikslėlių keliai
  const cache = new Map();     // path -> md tekstas

  const IMG = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
  const noteUrl = (p) => "#/wiki/" + p.replace(/\.md$/i, "").split("/").map(encodeURIComponent).join("/");
  const fileUrl = (p) => cfg.root + p.split("/").map(encodeURIComponent).join("/");
  const base = (p) => p.split("/").pop().replace(/\.md$/i, "");

  async function loadIndex() {
    if (index) return index;
    let list = null;
    try { list = await KP.fetchJSON(cfg.manifest); } catch {}
    if (!list && cfg.github?.repo) {
      try {
        const g = cfg.github;
        const r = await KP.fetchJSON(`https://api.github.com/repos/${g.owner}/${g.repo}/git/trees/${g.branch}?recursive=1`);
        const pre = g.path.replace(/\/$/, "") + "/";
        list = r.tree.filter((x) => x.type === "blob" && x.path.startsWith(pre)).map((x) => x.path.slice(pre.length));
      } catch {}
    }
    // manifeste įrašas gali būti eilutė arba { path, aliases }
    const entries = (list || []).map((e) => (typeof e === "string" ? { path: e } : e))
      .filter((e) => e.path && !e.path.split("/").some((s) => s.startsWith(".")));
    assets = entries.map((e) => e.path).filter((p) => IMG.test(p));
    index = entries.filter((e) => /\.md$/i.test(e.path)).map(({ path, aliases }) => ({
      path, aliases: aliases || [], name: base(path), dir: path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ""
    }));
    return index;
  }

  function resolve(target) {
    const t = target.trim().replace(/\.md$/i, "").toLowerCase();
    return index.find((f) => f.path.replace(/\.md$/i, "").toLowerCase() === t)
        || index.find((f) => f.name.toLowerCase() === t)
        || index.find((f) => (f.aliases || []).some((a) => a.toLowerCase() === t));
  }
  const resolveAsset = (name) => {
    const n = name.toLowerCase();
    return assets.find((a) => a.toLowerCase() === n) || assets.find((a) => a.split("/").pop().toLowerCase() === n);
  };

  async function getText(f) {
    if (cache.has(f.path)) return cache.get(f.path);
    let txt;
    try { txt = await KP.fetchText(fileUrl(f.path)); }
    catch (e) {
      const g = cfg.github;
      if (!g?.repo) throw e;
      txt = await KP.fetchText(`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch}/${g.path}/${f.path.split("/").map(encodeURIComponent).join("/")}`);
    }
    cache.set(f.path, txt);
    return txt;
  }

  function frontmatter(md) {
    const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return { meta: {}, body: md };
    const meta = {};
    let key = null;
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([\w-]+):\s*(.*)$/);
      if (kv) {
        key = kv[1];
        const v = kv[2].trim();
        meta[key] = v.startsWith("[") ? v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : v ? v.replace(/^["']|["']$/g, "") : [];
      } else if (key && /^\s*-\s+/.test(line)) {
        (meta[key] = Array.isArray(meta[key]) ? meta[key] : []).push(line.replace(/^\s*-\s+/, "").trim().replace(/^["']|["']$/g, ""));
      }
    }
    return { meta, body: md.slice(m[0].length) };
  }

  function obsidianToHtml(md) {
    md = md.replace(/%%[\s\S]*?%%/g, "");
    // ![[paveikslas.png|300]]
    md = md.replace(/!\[\[([^\]|]+)(?:\|(\d+))?\]\]/g, (_, name, w) => {
      const a = resolveAsset(name.trim());
      if (a) return `<img src="${fileUrl(a)}" alt="${KP.esc(name)}"${w ? ` width="${w}"` : ""}>`;
      const n = resolve(name);
      return n ? `<a class="wl" href="${noteUrl(n.path)}">↳ ${KP.esc(n.name)}</a>` : `<span class="muted">[${KP.esc(name)}]</span>`;
    });
    // [[Užrašas#antraštė|tekstas]]
    md = md.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, name, _h, alias) => {
      const n = resolve(name);
      const label = KP.esc(alias || name);
      return n ? `<a class="wl" href="${noteUrl(n.path)}">${label}</a>` : `<a class="wl missing" title="Užrašas dar nesukurtas">${label}</a>`;
    });
    md = md.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
    const html = marked.parse(md, { gfm: true, breaks: false });

    // > [!type] Pavadinimas  →  callout
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.querySelectorAll("blockquote").forEach((bq) => {
      const p = bq.querySelector("p");
      const m = p && p.innerHTML.match(/^\[!(\w+)\][+-]?\s*([^\n<]*)(?:\n|<br>)?/);
      if (!m) return;
      p.innerHTML = p.innerHTML.slice(m[0].length);
      const box = document.createElement("div");
      box.className = "callout " + m[1].toLowerCase();
      box.innerHTML = `<div class="callout-t">${KP.esc(m[2] || m[1])}</div><div class="callout-b"></div>`;
      box.lastChild.append(...bq.childNodes);
      if (!box.lastChild.textContent.trim()) box.lastChild.remove();
      bq.replaceWith(box);
    });
    tmp.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
    return tmp.innerHTML;
  }

  function tree(files, activePath) {
    const root = { dirs: {}, files: [] };
    for (const f of files) {
      let node = root;
      if (f.dir) for (const part of f.dir.split("/")) node = node.dirs[part] ||= { dirs: {}, files: [] };
      node.files.push(f);
    }
    const sort = (a, b) => a.localeCompare(b, "lt");
    const render = (node) =>
      Object.keys(node.dirs).sort(sort).map((d) => `<li><span class="dir">${KP.esc(d)}</span><ul>${render(node.dirs[d])}</ul></li>`).join("") +
      node.files.sort((a, b) => sort(a.name, b.name)).map((f) =>
        `<li><a href="${noteUrl(f.path)}" class="${f.path === activePath ? "active" : ""}">${KP.esc(f.name)}</a></li>`).join("");
    return render(root);
  }

  KP.views.wiki = {
    async mount(root, arg) {
      await loadIndex();
      root.innerHTML = `
        <div class="wiki">
          <aside class="wiki-side panel">
            <div class="panel-h">Archyvas <span class="r">${index.length}</span></div>
            <div class="panel-b">
              <input class="inp" id="wq" placeholder="ieškoti…" aria-label="Ieškoti archyve" style="margin-bottom:8px">
              <ul class="wtree" id="wtree"></ul>
            </div>
          </aside>
          <article class="md" id="wdoc"></article>
        </div>`;

      const q = KP.$("#wq", root);
      q.addEventListener("input", () => search(q.value));
      KP.$("#wtree", root).addEventListener("click", (e) => {
        if (e.target.classList.contains("dir")) e.target.classList.toggle("shut");
      });

      const self = this;
      async function search(term) {
        term = term.trim().toLowerCase();
        if (!term) return paintTree(self._active);
        let hits = index.filter((f) => f.path.toLowerCase().includes(term));
        if (term.length >= 3) {
          await Promise.all(index.map((f) => getText(f).catch(() => "")));
          const more = index.filter((f) => !hits.includes(f) && (cache.get(f.path) || "").toLowerCase().includes(term));
          hits = hits.concat(more);
        }
        KP.$("#wtree", root).innerHTML = hits.length
          ? hits.map((f) => `<li><a href="${noteUrl(f.path)}">${KP.esc(f.name)}<br><small class="muted">${KP.esc(f.dir)}</small></a></li>`).join("")
          : `<li class="muted" style="font-size:12px">Nieko nerasta.</li>`;
      }
      function paintTree(active) { KP.$("#wtree", root).innerHTML = tree(index, active); }

      this._root = root;
      this._paintTree = paintTree;
      await this.update(arg);
      return { update: (a) => this.update(a) };
    },

    async update(arg) {
      const root = this._root;
      const doc = KP.$("#wdoc", root);
      if (!index.length) {
        doc.innerHTML = `<p class="kicker">Archyvas tuščias</p><h1>Nėra užrašų</h1><p class="lede">Įkelk Obsidian užrašus į <code>kiberpankas/wiki/</code> ir paleisk <code>node tools/build-wiki-index.mjs</code>.</p>`;
        return;
      }
      const f = resolve(arg || cfg.home) || resolve(cfg.home) || index[0];
      this._active = f.path;
      this._paintTree(f.path);
      doc.innerHTML = `<p class="mono-lcd">&gt; atidaroma ${KP.esc(f.name)}…</p>`;
      try {
        const { meta, body } = frontmatter(await getText(f));
        const tags = [].concat(meta.tags || []);
        const hasH1 = /^#\s/m.test(body);
        doc.innerHTML = `
          <p class="kicker">${KP.esc(f.dir || "Archyvas")}</p>
          ${hasH1 ? "" : `<h1>${KP.esc(f.name)}</h1>`}
          ${obsidianToHtml(body)}
          <section class="backlinks" id="bl"></section>`;
        if (tags.length) {
          doc.querySelector("h1")?.insertAdjacentHTML("afterend", `<div class="meta">${tags.map((t) => `<span class="tag">#${KP.esc(t)}</span>`).join("")}</div>`);
        }
        root.closest(".main-body")?.scrollTo(0, 0);
        KP.status(`ARCHYVAS / ${f.path.toUpperCase()}`);
        backlinks(f, KP.$("#bl", doc));
      } catch (e) {
        doc.innerHTML = `<h2>Failas sugadintas</h2><p class="muted">${KP.esc(e.message)}</p>`;
      }
    }
  };

  async function backlinks(f, el) {
    await Promise.all(index.map((x) => getText(x).catch(() => "")));
    const re = new RegExp(`\\[\\[(${[f.name, f.path.replace(/\.md$/i, "")].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(#[^\\]|]*)?(\\|[^\\]]*)?\\]\\]`, "i");
    const refs = index.filter((x) => x.path !== f.path && re.test(cache.get(x.path) || ""));
    if (!refs.length || !el.isConnected) return;
    el.innerHTML = `<div class="panel"><div class="panel-h">Nuorodos į šį užrašą <span class="r">${refs.length}</span></div>
      <div class="panel-b"><ul class="wtree">${refs.map((r) => `<li><a href="${noteUrl(r.path)}">${KP.esc(r.name)}</a></li>`).join("")}</ul></div></div>`;
  }
})();

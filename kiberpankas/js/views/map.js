/* Žemėlapis: Leaflet + tamsūs CARTO kvadratėliai, taškai iš KML (Google Earth
   eksportas) arba data/map.geojson. */
(function () {
  const KP = window.KP;
  const cfg = KP_CONFIG.map;
  const COLORS = { gauja: "#ff2d3d", korporacija: "#d6c27a", rajonas: "#43ff7b", vieta: "#9fb6ff", policija: "#7fe8ff" };
  const LABELS = { gauja: "Grupuotė", korporacija: "Korporacija", rajonas: "Rajonas", vieta: "Vieta", policija: "Valdžia" };

  async function loadFeatures() {
    if (cfg.kml) {
      try {
        const xml = new DOMParser().parseFromString(await KP.fetchText(cfg.kml), "text/xml");
        return toGeoJSON.kml(xml).features;
      } catch (e) { console.warn("KML nepasikrovė", e); }
    }
    return (await KP.fetchJSON(cfg.geojson)).features;
  }

  KP.views.map = {
    async mount(root) {
      root.innerHTML = `
        <p class="kicker">Kartografija · Kaunas</p>
        <h1>Žemėlapis</h1>
        <div class="btn-row" style="margin-top:16px">
          <a class="btn btn--red" href="${KP.esc(cfg.googleEarthUrl)}" target="_blank" rel="noopener">Atidaryti Google Earth projektą ↗</a>
          <span id="mcats" class="btn-row"></span>
        </div>
        <div class="map-wrap">
          <div class="panel"><div class="panel-h">Kaunas · 2023 <span class="r" id="mcoord">54.8985 N · 23.9036 E</span></div><div id="kp-map"></div></div>
          <aside class="panel"><div class="panel-h">Taškai <span class="r" id="mcount"></span></div><div class="map-list" id="mlist"></div></aside>
        </div>`;

      const map = L.map(KP.$("#kp-map", root), { zoomControl: true, attributionControl: true }).setView(cfg.center, cfg.zoom);
      L.tileLayer(cfg.tiles, { subdomains: "abcd", maxZoom: 19, attribution: "© OpenStreetMap · © CARTO" }).addTo(map);
      if (cfg.labels) L.tileLayer(cfg.labels, { subdomains: "abcd", maxZoom: 19, opacity: 0.55 }).addTo(map);
      map.on("mousemove", (e) => { KP.$("#mcoord", root).textContent = `${e.latlng.lat.toFixed(4)} N · ${e.latlng.lng.toFixed(4)} E`; });

      const feats = await loadFeatures();
      const groups = {};
      const items = [];
      for (const f of feats) {
        if (f.geometry?.type !== "Point") {
          L.geoJSON(f, { style: { color: "#43ff7b", weight: 1, fillOpacity: 0.08 } }).addTo(map);
          continue;
        }
        const p = { ...(f.properties || {}) };
        // Google Earth aprašymai būna HTML — paliekam tik tekstą
        if (p.description && typeof p.description === "object") p.description = p.description.value;
        if (p.description) p.description = new DOMParser().parseFromString(String(p.description), "text/html").body.textContent.trim();
        // kategoriją galima nurodyti aprašyme, pvz. „[gauja] Skerdikų teritorija"
        const tagCat = (p.description || "").match(/^\[(\w+)\]\s*/);
        if (tagCat) p.description = p.description.slice(tagCat[0].length);
        const cat = p.category || tagCat?.[1].toLowerCase() || "vieta";
        const color = COLORS[cat] || COLORS.vieta;
        const [lng, lat] = f.geometry.coordinates;
        const icon = L.divIcon({
          className: "", iconSize: [14, 14], iconAnchor: [7, 7],
          html: `<div style="--pin:${color}"><div class="kp-pin"></div><div class="kp-pin-lbl">${KP.esc(p.name)}</div></div>`
        });
        const m = L.marker([lat, lng], { icon }).bindPopup(`
          <span class="tag" style="border-color:${color};color:${color}">${KP.esc(LABELS[cat] || cat)}</span>
          <h4 style="margin-top:8px">${KP.esc(p.name)}</h4>
          <div>${p.description ? KP.esc(p.description) : ""}</div>
          ${p.wiki ? `<p style="margin:8px 0 0"><a href="#/wiki/${encodeURIComponent(p.wiki)}">Archyvas →</a></p>` : ""}`);
        (groups[cat] ||= L.layerGroup().addTo(map)).addLayer(m);
        items.push({ p, cat, m, lat, lng });
      }

      KP.$("#mcount", root).textContent = items.length;
      KP.$("#mlist", root).innerHTML = items.map((it, i) => `
        <button data-i="${i}"><span class="n" style="color:${COLORS[it.cat] || COLORS.vieta}">${KP.esc(it.p.name)}</span><span class="c">${KP.esc(LABELS[it.cat] || it.cat)}</span></button>`).join("");
      KP.$("#mlist", root).onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        const it = items[b.dataset.i];
        map.flyTo([it.lat, it.lng], 15, { duration: 0.8 });
        it.m.openPopup();
      };
      KP.$("#mcats", root).innerHTML = Object.keys(groups).map((c) => `<button class="btn on" data-c="${c}" style="color:${COLORS[c]}">${LABELS[c] || c}</button>`).join("");
      KP.$("#mcats", root).onclick = (e) => {
        const b = e.target.closest("[data-c]"); if (!b) return;
        const on = b.classList.toggle("on");
        on ? groups[b.dataset.c].addTo(map) : map.removeLayer(groups[b.dataset.c]);
      };
      setTimeout(() => map.invalidateSize(), 50);
      return { destroy: () => map.remove() };
    }
  };
})();

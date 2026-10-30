/* ==========================================================================
   KIBERPANKAS — KONFIGŪRACIJA
   Šitą failą redaguoji tu. Viskas kas keičiasi „ant greito" yra čia.
   ========================================================================== */

window.KP_CONFIG = {

  /* ---- FONINIS VIDEO ----------------------------------------------------
     type:
       "procedural" – sugeneruotas fonas (veikia visada, nieko nereikia)
       "youtube"    – YouTube video, kartojamas be garso (įrašyk id)
       "file"       – tavo mp4/webm failas arba nuoroda į jį (src)
     Jei YouTube/failas nepasikrauna, automatiškai grįžtama į procedural. */
  background: {
    type: "procedural",
    youtubeId: "",            // pvz. "dQw4w9WgXcQ" (tik id, ne visa nuoroda)
    youtubeStart: 0,          // nuo kurios sekundės pradėti
    src: "media/bg-loop.mp4", // naudojama kai type: "file"
    dim: 0.55                 // kiek patamsinti video (0 – nieko, 1 – juoda)
  },

  /* ---- PRISIJUNGIMAS / PASKYROS -----------------------------------------
     Kol supabase.url tuščias, svetainė veikia DEMO režimu: paskyros
     saugomos tik naršyklėje (localStorage). Tai tinka išbandymui.
     Tikroms paskyroms susikurk nemokamą projektą supabase.com,
     paleisk supabase/schema.sql ir įrašyk url + anonKey čia. */
  supabase: {
    url: "",
    anonKey: ""
  },

  /* ---- WIKI (Obsidian) --------------------------------------------------
     Užrašai yra .md failai aplanke kiberpankas/wiki/.
     manifest – wiki/index.json sąrašas (sugeneruojamas tools/build-wiki-index.mjs)
     github   – jei manifesto nėra, failų sąrašas paimamas iš GitHub repo
                (tinka su Obsidian Git įskiepiu – push'ini ir viskas atsinaujina). */
  wiki: {
    root: "wiki/",
    manifest: "wiki/index.json",
    github: { owner: "gamblingcrow", repo: "heksatorija", branch: "main", path: "kiberpankas/wiki" },
    home: "Kaunas 2023"
  },

  /* ---- ŽEMĖLAPIS --------------------------------------------------------
     Google Earth projektų negalima įterpti į kitą puslapį (Google tai
     blokuoja), todėl: eksportuok projektą kaip KML (Earth → ⋮ → Export
     as KML file), įmesk į data/ ir įrašyk kelią į kml. Kol kml nėra,
     rodomi data/map.geojson taškai. */
  map: {
    googleEarthUrl: "https://earth.google.com/earth/d/1F_m-x8izxfgkOm4d1QWUzG_jGQZeUEiS?usp=sharing",
    kml: "",                       // pvz. "data/kaunas.kml"
    geojson: "data/map.geojson",
    center: [54.8985, 23.9036],    // Kaunas
    zoom: 12,
    tiles: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    labels: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
  },

  /* ---- PARDUOTUVĖ -------------------------------------------------------
     Greičiausias būdas atnaujinti „ant greito": Google Sheets lentelė.
     File → Share → Publish to web → pasirink lapą → CSV → nukopijuok
     nuorodą į sheetCsv. Stulpeliai (pirma eilutė):
       parduotuve, pavadinimas, tipas, kaina, zala, rof, apkaba, atstumas,
       aprasymas, kiekis, retumas
     Kol sheetCsv tuščias, naudojamas data/shop.json. */
  shop: {
    sheetCsv: "",
    json: "data/shop.json",
    datafortUrl: "https://datafort.kiberpankas.net/",
    currency: "EB"
  },

  /* ---- TRANSLIACIJA + FOUNDRY ------------------------------------------- */
  live: {
    foundryUrl: "",        // pvz. "https://foundry.kiberpankas.net" arba "http://TAVO-IP:30000"
    foundryNote: "Prisijungimas atsidarys naujame lange. Pasirink savo vartotoją ir įvesk slaptažodį, kurį davė GM.",
    twitchChannel: "",     // pvz. "kiberpankas"
    youtubeLiveId: "",     // alternatyva Twitch: YouTube transliacijos video id
    discordUrl: "",
    nextSession: ""        // ISO data, pvz. "2026-11-08T19:00:00+02:00"
  },

  /* ---- NAUJIENŲ JUOSTA (LCD ekranėlis viršuje) --------------------------- */
  ticker: [
    "MILITECH ATIDARO KAUNO FILIALĄ — LIKO 7 DIENOS",
    "ARASAKA: „MUMS RŪPI“",
    "BALTIJOS LYGOS SUSIJUNGIMO DERYBOS PAGREITĖJA",
    "SLABOTKĖ: SKERDIKAI VĖL AKTYVŪS ŠIAURĖS VAKARUOSE",
    "OMNIX — SU MUMIS BŪSI VISUR",
    "VILNIUS LIEKA EEC ADMINISTRUOJAMAS MIESTAS",
    "AGURKĖLIS: KOKS TRAŠKUS IR TOKS GARDUS"
  ]
};

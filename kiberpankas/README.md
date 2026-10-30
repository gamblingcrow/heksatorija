# KiberPankas — svetainė

Viskas apie KiberPanką vienoje vietoje: pasaulio wiki (Obsidian), grupuotės, Kauno žemėlapis, parduotuvė, transliacija + Foundry jungtis ir žaidėjų paskyros su veikėjų dosjė.

Gryna statinė svetainė: jokio build žingsnio, jokio serverio. Veikia GitHub Pages, Netlify, Cloudflare Pages ar bet kur, kur galima įkelti failus.

```
kiberpankas/
  index.html            apvalkalas (grotuvo langai)
  css/kp.css            visas stilius
  js/config.js          ← ČIA KEIČI NUSTATYMUS
  js/views/*.js         puslapiai
  data/                 grupuotės, parduotuvė, žemėlapio taškai, naujienos
  wiki/                 Obsidian užrašai (.md)
  supabase/schema.sql   duomenų bazė tikroms paskyroms
  tools/                wiki indekso generatorius
  vendor/               bibliotekos (marked, leaflet, supabase-js) — nieko krauti nereikia
```

## Paleisti savo kompiuteryje

```bash
cd kiberpankas
python3 -m http.server 8000
```

Atsidaryk http://localhost:8000. (Tiesiog dukart spustelėti `index.html` neužteks: naršyklė neleis pakrauti duomenų failų.)

## Paskelbti (GitHub Pages)

Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. Svetainė bus `https://gamblingcrow.github.io/heksatorija/kiberpankas/`. Jei nori savo domeno (pvz. `kiberpankas.net`), geriau perkelk šį aplanką į atskirą repo ir pridėk CNAME.

---

## Kaip atnaujinti „ant greito“

### Foninis video
`js/config.js` → `background`:
- `type: "procedural"`: sugeneruotas miestas (brutalistiniai bokštai, lietus, prožektorius, simbolių stulpeliai). Veikia visada, nieko nekainuoja.
- `type: "youtube"`, `youtubeId: "..."`: bet koks YouTube video, kartojamas be garso.
- `type: "file"`, `src: "media/kazkas.mp4"`: tavo failas.

`dim` nustato, kiek video patamsintas, kad tekstas liktų įskaitomas.

### Wiki (Obsidian)
1. Obsidian'e atidaryk `kiberpankas/wiki/` kaip vault'ą (arba nukopijuok savo vault'o failus čia).
2. Rašyk kaip įprasta: veikia `[[nuorodos]]`, `[[nuoroda|tekstas]]`, `![[paveikslas.png]]`, `==žymėjimas==`, `%%slapti komentarai%%`, callout'ai (`> [!note]`, `> [!warning]`, `> [!gm]`), frontmatter `tags` ir `aliases`.
3. Paleisk `node kiberpankas/tools/build-wiki-index.mjs` ir įkelk į repo. Jis sukuria `index.json` (failų sąrašą) ir `bundle.json` (visus užrašus viename faile, kad paieška būtų greita).

**Be jokio paleidinėjimo:** įdiek Obsidian įskiepį **Obsidian Git** ir ištrink `wiki/index.json` ir `wiki/bundle.json`. Tada svetainė failų sąrašą ims tiesiai iš GitHub (`config.wiki.github`), ir kiekvienas tavo push'as iškart matysis svetainėje.

> `%%komentarai%%` paslepiami tik svetainėje. Repo vis tiek viešas, todėl tikrų GM paslapčių į jį nedėk.

### Parduotuvė
Greičiausias būdas: **Google Sheets**.
1. Sukurk lentelę su stulpeliais: `parduotuve, pavadinimas, tipas, kaina, zala, rof, apkaba, atstumas, aprasymas, kiekis, retumas`
2. File → Share → **Publish to web** → pasirink lapą → **CSV** → Publish.
3. Nuorodą įklijuok į `config.shop.sheetCsv`.

Nuo tada užtenka pakeisti lentelę, ir svetainė parodys naujas kainas per kelias minutes (Google atnaujina kas ~5 min.). Kol nuorodos nėra, naudojamas `data/shop.json`.

Datafort (brolio svetainė) turi savo skydelį su nuoroda ir mygtuku „Įterpti čia“. Jei Datafort neleidžia įterpimo (X-Frame-Options), veiks tik nuoroda.

### Žemėlapis
Google Earth projektų negalima įterpti į kitą svetainę (Google tai blokuoja), todėl:
1. Google Earth → atidaryk projektą → ⋮ → **Export as KML file**.
2. Įmesk failą į `kiberpankas/data/` ir įrašyk kelią į `config.map.kml`.

Taškų aprašyme gali nurodyti kategoriją: `[gauja] Skerdikų teritorija`. Kategorijos: `gauja`, `korporacija`, `rajonas`, `vieta`, `policija`. Mygtukas „Atidaryti Google Earth projektą“ visada veda į originalą.

Kol KML nėra, rodomi `data/map.geojson` taškai (koordinatės apytikslės, pagal lore).

### Transliacija ir Foundry
`config.live`:
- `foundryUrl`: tavo Foundry adresas (pvz. `https://foundry.kiberpankas.net`). Mygtukas veda į `/join`. Svetainė bando nuskaityti `/api/status` ir parodyti, ar pasaulis paleistas.
- `twitchChannel` arba `youtubeLiveId`: grotuvas puslapyje „Eteris“. Kai nustatyta, LCD ekranėlyje dega ON AIR.
- `discordUrl`, `nextSession` (ISO data): atgalinis laikmatis pagrindiniame ir „Eteris“ puslapiuose.

**Foundry ant Raspberry Pi (home lab).** Kad žaidėjai galėtų prisijungti iš interneto, Pi turi būti pasiekiamas iš išorės. Saugiausias ir paprasčiausias būdas, kai domenas jau yra:
1. Perkelk `kiberpankas.net` DNS į Cloudflare (nemokamai).
2. Ant Pi įdiek `cloudflared` ir sukurk tunelį: `foundry.kiberpankas.net` → `http://localhost:30000`.
3. Foundry nustatymuose (`options.json`) įrašyk `"hostname": "foundry.kiberpankas.net"`, `"proxySSL": true`, `"proxyPort": 443`.
4. Į `config.live.foundryUrl` įrašyk `https://foundry.kiberpankas.net`.

Taip nereikia atidarinėti portų maršrutizatoriuje, o namų IP lieka paslėptas. Svetainė pati nieko nehostina, ji tik nukreipia.

### Naujienos ir LCD juosta
`data/news.json` (naujienų kanalas pagrindiniame puslapyje) ir `config.ticker` (bėganti eilutė grotuvo ekranėlyje).

---

## Paskyros

**Demo režimas** (numatytasis): paskyros saugomos tik naršyklėje. Šaukinys `demo`, slaptažodis `demo` atidaro pavyzdinį veikėją (Benas „BO“ Osvilskis). Tinka išbandyti, bet ne tikriems žaidėjams.

**Tikros paskyros (Supabase, nemokama):**
1. Susikurk projektą https://supabase.com.
2. SQL Editor → įklijuok `supabase/schema.sql` → Run.
3. Project Settings → API → nukopijuok **Project URL** ir **anon public** raktą į `config.supabase`.
4. Užsiregistruok svetainėje, tada SQL Editor'iuje padaryk save GM:
   `update public.profiles set role = 'gm' where callsign = 'TAVO_ŠAUKINYS';`

Žaidėjas mato ir redaguoja tik savo veikėją ir savo užsakymus. GM mato ir keičia viską (kol kas per Supabase lentelių redaktorių: `characters`, `orders`). `anon` raktas skirtas viešinti, jį dėti į `config.js` saugu. Duomenis saugo RLS taisyklės.

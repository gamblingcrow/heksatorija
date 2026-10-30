/* Paskyros ir veikėjų duomenys.
   Du režimai, ta pati sąsaja:
     supabase – tikros paskyros (kai KP_CONFIG.supabase užpildytas)
     demo     – viskas naršyklėje, tik išbandymui                       */
(function () {
  const KP = window.KP;
  const sb = (window.KP_CONFIG || {}).supabase || {};
  const listeners = new Set();

  const STATS = ["INT", "REF", "DEX", "TECH", "COOL", "WILL", "LUCK", "MOVE", "BODY", "EMP"];
  KP.STATS = STATS;

  KP.blankCharacter = (name = "") => ({
    name, handle: "", role: "", portrait: "",
    stats: Object.fromEntries(STATS.map((s) => [s, 5])),
    hp: { cur: 40, max: 40 }, humanity: { cur: 50, max: 50 },
    bank: 0, subscriptions: 0, rep: 0, ip: 0,
    armor: [], weapons: [], skills: [], gear: [], cyberware: [],
    notes: "", sheetUrl: ""
  });

  /* Pavyzdinis veikėjas demo paskyrai (pagal PCs lentelę) */
  const DEMO_CHAR = {
    name: "Benas Osvilskis", handle: "BO", role: "Fixer", portrait: "",
    stats: { INT: 8, REF: 8, DEX: 7, TECH: 10, COOL: 10, WILL: 5, LUCK: 5, MOVE: 7, BODY: 8, EMP: 4 },
    hp: { cur: 33, max: 45 }, humanity: { cur: 17, max: 40 },
    bank: 4544, subscriptions: -875, rep: 0, ip: 10,
    armor: [
      { name: "Kevlarinė maikė, liemenė", sp: 10, tier: 2 },
      { name: "Sunki odinė striukė", sp: 4, tier: 2 },
      { name: "Optishields (antidazzle)", sp: 8, tier: 2 }
    ],
    weapons: [
      { name: "Colt Alpha-Omega .45", dmg: "2d6+2", rof: 2, ammo: "8", notes: "" },
      { name: "Kovinis peilis", dmg: "1d6", rof: 2, ammo: "—", notes: "" },
      { name: "Tazeris", dmg: "stun", rof: 1, ammo: "—", notes: "" }
    ],
    skills: [
      { name: "Intimidate", stat: "COOL", rank: 10 }, { name: "Interrogation", stat: "COOL", rank: 5 },
      { name: "Electronics/Security", stat: "TECH", rank: 4 }, { name: "Drive", stat: "REF", rank: 3 },
      { name: "Martial Arts (Judo)", stat: "DEX", rank: 3 }, { name: "Basic Tech", stat: "TECH", rank: 2 },
      { name: "Cybertech", stat: "TECH", rank: 2 }, { name: "Demolitions", stat: "TECH", rank: 2 },
      { name: "Handgun", stat: "REF", rank: 2 }, { name: "Human Perception", stat: "EMP", rank: 1 }
    ],
    gear: ["Mini-printeris", "Image Wallet", "Advanced Alarm Removal Kit", "Kvapnios cigaretės (šokol.)", "Nešiojamas kompiuteris",
      "Cardlock Decryptor", "Binoglasses", "Electronics Toolkit", "Basic Tech Kit", "Glowstik ×6", "Duomenų lustai ×2",
      "Naujas paketas Chipolinui", "Dronas", "Racija"],
    cyberware: [],
    notes: "Čia tavo asmeniniai užrašai. Matai tik tu (ir GM).",
    sheetUrl: ""
  };

  /* ================= DEMO ================= */
  async function hash(s) {
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("kp:" + s));
      return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
    } catch { return "plain:" + s; }
  }
  const demo = {
    users() {
      const u = KP.store.get("kp.demo.users", null);
      if (u) return u;
      const seed = { demo: { pass: null, plain: "demo", role: "player", char: DEMO_CHAR, orders: [] } };
      KP.store.set("kp.demo.users", seed);
      return seed;
    },
    save(u) { KP.store.set("kp.demo.users", u); },
    async signIn(callsign, pass) {
      const key = callsign.trim().toLowerCase();
      const u = demo.users()[key];
      if (!u) throw new Error("Tokio šaukinio nėra");
      const ok = u.pass ? u.pass === (await hash(pass)) : u.plain === pass;
      if (!ok) throw new Error("Neteisingas slaptažodis");
      KP.store.set("kp.demo.session", key);
      return { id: key, callsign: key, role: u.role };
    },
    async signUp(callsign, pass) {
      const key = callsign.trim().toLowerCase();
      if (!/^[a-z0-9_@.\-]{2,24}$/.test(key)) throw new Error("Šaukinys: 2–24 simboliai, be tarpų");
      if (pass.length < 4) throw new Error("Slaptažodis per trumpas");
      const users = demo.users();
      if (users[key]) throw new Error("Šaukinys užimtas");
      users[key] = { pass: await hash(pass), role: "player", char: KP.blankCharacter(callsign), orders: [] };
      demo.save(users);
      KP.store.set("kp.demo.session", key);
      return { id: key, callsign: key, role: "player" };
    },
    current() {
      const key = KP.store.get("kp.demo.session", null);
      const u = key && demo.users()[key];
      return u ? { id: key, callsign: key, role: u.role } : null;
    }
  };

  /* ================= SUPABASE ================= */
  let client = null;
  if (sb.url && sb.anonKey && window.supabase) client = window.supabase.createClient(sb.url, sb.anonKey);

  const A = (KP.auth = {
    mode: client ? "supabase" : "demo",
    user: null,

    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    _emit() { listeners.forEach((cb) => cb(A.user)); },

    async init() {
      if (A.mode === "demo") { A.user = demo.current(); A._emit(); return; }
      const { data } = await client.auth.getSession();
      await A._loadProfile(data.session?.user);
      client.auth.onAuthStateChange((_e, s) => A._loadProfile(s?.user));
    },

    async _loadProfile(u) {
      if (!u) { A.user = null; return A._emit(); }
      const { data } = await client.from("profiles").select("callsign, role").eq("id", u.id).maybeSingle();
      A.user = { id: u.id, email: u.email, callsign: data?.callsign || u.user_metadata?.callsign || u.email, role: data?.role || "player" };
      A._emit();
    },

    async signIn(login, pass) {
      if (A.mode === "demo") { A.user = await demo.signIn(login, pass); return A._emit(); }
      const { error } = await client.auth.signInWithPassword({ email: login.trim(), password: pass });
      if (error) throw new Error(error.message);
    },

    async signUp(login, pass, callsign) {
      if (A.mode === "demo") { A.user = await demo.signUp(login, pass); return A._emit(); }
      const { error, data } = await client.auth.signUp({
        email: login.trim(), password: pass, options: { data: { callsign: (callsign || "").trim() } }
      });
      if (error) throw new Error(error.message);
      if (!data.session) return "confirm";
    },

    async signOut() {
      if (A.mode === "demo") { KP.store.del("kp.demo.session"); A.user = null; return A._emit(); }
      await client.auth.signOut();
    },

    /* ---- veikėjas ---- */
    async getCharacter() {
      if (!A.user) return null;
      if (A.mode === "demo") return demo.users()[A.user.id]?.char || KP.blankCharacter();
      const { data, error } = await client.from("characters").select("id, data").eq("owner", A.user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      if (data) { A._charId = data.id; return { ...KP.blankCharacter(), ...data.data }; }
      return KP.blankCharacter(A.user.callsign);
    },

    async saveCharacter(ch) {
      if (A.mode === "demo") { const u = demo.users(); u[A.user.id].char = ch; return demo.save(u); }
      const row = { owner: A.user.id, data: ch, updated_at: new Date().toISOString() };
      const q = A._charId ? client.from("characters").update(row).eq("id", A._charId).select("id").single()
                          : client.from("characters").insert(row).select("id").single();
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      A._charId = data.id;
    },

    /* ---- užsakymai iš parduotuvės ---- */
    async listOrders() {
      if (!A.user) return [];
      if (A.mode === "demo") return demo.users()[A.user.id]?.orders || [];
      const { data } = await client.from("orders").select("*").eq("owner", A.user.id).order("created_at", { ascending: false });
      return data || [];
    },

    async createOrder(item) {
      if (!A.user) throw new Error("Pirma prisijunk");
      const rec = { item, status: "laukia", created_at: new Date().toISOString() };
      if (A.mode === "demo") { const u = demo.users(); u[A.user.id].orders.unshift(rec); return demo.save(u); }
      const { error } = await client.from("orders").insert({ owner: A.user.id, item });
      if (error) throw new Error(error.message);
    }
  });
})();

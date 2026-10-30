// Sugeneruoja kiberpankas/wiki/index.json – visų wiki failų sąrašą.
// Paleisk po to, kai įkėlei naujus Obsidian užrašus:
//   node kiberpankas/tools/build-wiki-index.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "wiki");
const out = [];

function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".") || name === "index.json") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const rel = relative(root, p).split("\\").join("/");
    if (!/\.md$/i.test(name)) { out.push(rel); continue; }
    // aliases iš frontmatter, kad [[Sinonimas]] nuorodos veiktų
    const fm = readFileSync(p, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const m = fm && fm[1].match(/^aliases:\s*\[(.*)\]\s*$/m);
    const aliases = m ? m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : [];
    out.push(aliases.length ? { path: rel, aliases } : rel);
  }
}

walk(root);
writeFileSync(join(root, "index.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`wiki/index.json: ${out.length} failų`);

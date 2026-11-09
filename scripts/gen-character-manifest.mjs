// Scans public/characters/ and writes src/lib/character-manifest.json with the
// character images that actually exist, e.g. { "buzz": "/characters/buzz.png" }.
// Runs automatically before `dev` and `build` (see package.json).
import { readdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(root, "public", "characters");
const out = path.join(root, "src", "lib", "character-manifest.json");
const KEYS = ["woody", "buzz", "aliens", "jessie", "rex", "hamm", "lotso"];
const EXT = ["webp", "png", "avif", "jpg", "jpeg", "svg"];

const files = existsSync(dir) ? readdirSync(dir) : [];
const manifest = {};
for (const key of KEYS) {
  const ext = EXT.find((e) => files.includes(`${key}.${e}`));
  if (ext) manifest[key] = `/characters/${key}.${ext}`;
}
const json = JSON.stringify(manifest, null, 2) + "\n";
if (!existsSync(out) || readFileSync(out, "utf8") !== json) writeFileSync(out, json);
const found = Object.keys(manifest);
console.log(`[characters] ${found.length}/${KEYS.length} found${found.length ? `: ${found.join(", ")}` : ""}`);

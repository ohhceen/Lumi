import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CHARACTER_KEYS } from "@/lib/characters";

const root = path.resolve(__dirname, "../..");
const dir = path.join(root, "public", "characters");
const manifestPath = path.join(root, "src", "lib", "character-manifest.json");

describe("character image manifest", () => {
  it("covers exactly the seven slots", () => {
    expect(CHARACTER_KEYS).toEqual(["woody", "buzz", "aliens", "jessie", "rex", "hamm", "lotso"]);
  });

  it("only lists images that exist, and drops them again when removed", () => {
    const original = readFileSync(manifestPath, "utf8");
    const tmp = path.join(dir, "rex.webp");
    expect(existsSync(tmp)).toBe(false);
    // a 1x1 neutral test file (not character artwork)
    writeFileSync(tmp, Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64"));
    try {
      execFileSync("node", ["scripts/gen-character-manifest.mjs"], { cwd: root });
      expect(JSON.parse(readFileSync(manifestPath, "utf8"))).toMatchObject({ rex: "/characters/rex.webp" });
    } finally {
      rmSync(tmp);
      execFileSync("node", ["scripts/gen-character-manifest.mjs"], { cwd: root });
    }
    expect(readFileSync(manifestPath, "utf8")).toBe(original);
  });
});

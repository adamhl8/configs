import fs from "node:fs/promises"

/*
 * Some types we depend on from knip (e.g. `IssueRecords`, `IssueType`, `RawConfigurationOrFn`)
 * live in `knip/dist/types/*` but aren't exposed via knip's package exports. Without this,
 * we'd have to import them via relative paths into `node_modules/`.
 *
 * This script adds subpath exports to knip's `package.json` so those types resolve as
 * `knip/types/<name>`. It is idempotent and safe to re-run (e.g. as a `postinstall` hook).
 */

const KNIP_PACKAGE_JSON_PATH = "./node_modules/knip/package.json"

const SUBPATH_EXPORTS: Record<string, { types: string; default: string }> = {
  "./types/issues": {
    default: "./dist/types/issues.js",
    types: "./dist/types/issues.d.ts",
  },
}

interface KnipPackageJson {
  exports: Record<string, unknown>
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const pkg = JSON.parse(await fs.readFile(KNIP_PACKAGE_JSON_PATH, "utf8")) as KnipPackageJson

const added: string[] = []
for (const [subpath, value] of Object.entries(SUBPATH_EXPORTS)) {
  if (pkg.exports[subpath]) continue
  pkg.exports[subpath] = value
  added.push(subpath)
}

if (added.length === 0) console.log("knip is already patched")
else {
  await fs.writeFile(KNIP_PACKAGE_JSON_PATH, `${JSON.stringify(pkg, undefined, 2)}\n`)
  console.log(`knip patched: added subpath exports ${added.map((s) => `'${s}'`).join(", ")}`)
}

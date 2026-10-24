import { existsSync } from "node:fs"

import { list, task } from "@adamhl8/bask"
import bun, { $, Glob } from "bun"

import { resolveProjectTailwind } from "#utils.ts"

const inCi = Boolean(process.env["CI"])

/** Lists tracked and untracked files matching the pathspecs, skipping gitignored ones. */
const lsFiles = async (pathspecs: string[]) => {
  const output = await $`git ls-files -z --cached --others --exclude-standard -- ${pathspecs}`.quiet().text()
  return output.split("\0").filter(Boolean)
}

/** Checks that we're not in CI, the repo has a root tofu module, and the aws profile exists on this machine. */
const canRunTofu = async () => {
  if (inCi) return false
  const tofuFiles = await Array.fromAsync(new Glob("*.tofu").scan())
  if (tofuFiles.length === 0) return false
  const profiles = await $`aws configure list-profiles`.nothrow().quiet().text()
  return profiles.split("\n").includes("adamhl8")
}

export const tofuCheck = task(async ({ sh }) => {
  if (await canRunTofu()) await sh`tofu plan -detailed-exitcode -concise -compact-warnings`
})

export const prepare = task(async ({ sh }) => {
  // Skip `lefthook install` in CI so commits made by the workflows don't run the hooks.
  if (!inCi) await sh`lefthook install`
  await sh`bun adamhl8-gitignore`
  await sh`bun adamhl8-bunfig`
  await sh`bun oxfmt bunfig.toml`
  if (await canRunTofu()) await sh`tofu init -upgrade`
})

export const bumpDeps = task(async ({ sh }) => {
  await sh`bunx npm-check-updates --upgrade --format group`
  await sh`rm -f bun.lock`
  await sh`rm -rf node_modules/`
  await sh`bun install --no-summary --no-cache`
})

export const test = task(async ({ sh }) => {
  await sh`bun test --pass-with-no-tests`.echo(false)
})

export const lint = task(async ({ sh }) => {
  await sh`bun markdown-toc -i --bullets - --maxdepth 3 ./README.md`
  await sh`bun oxlint --fix --fix-suggestions --fix-dangerously`
  await sh`bun oxfmt`

  if (resolveProjectTailwind()) {
    // Check for `.astro` files first so projects without them don't need tailwint installed.
    const astroFiles = await lsFiles([":(glob)**/*.astro"])
    // Skip `--fix` because tailwint resolves a class conflict by deleting a class by position, not by which one wins.
    if (astroFiles.length > 0) await sh`bun tailwint "**/*.astro"`
  }

  const tofuFiles = await lsFiles([
    ":(glob)**/*.tf",
    ":(glob)**/*.tofu",
    ":(glob)**/*.tfvars",
    ":(glob)**/*.tftest.hcl",
    ":(glob)**/*.tofutest.hcl",
  ])
  if (tofuFiles.length > 0) await sh`tofu fmt ${tofuFiles}`

  await sh`bun knip-bun`
  if (existsSync(".github/workflows")) await sh`actionlint`
  await test()
})

export const build = task(async ({ sh }) => {
  await lint()
  if (await bun.file("tsdown.config.ts").exists()) await sh`bun tsdown`
  // Fail in CI if the build changed or created any files, because lint fixes and formatting are applied in place.
  // `--intent-to-add` makes untracked files show up in the diff.
  if (inCi) {
    await sh`git add --intent-to-add --all`
    await sh`git diff --exit-code`
  }
  await tofuCheck()
})

export const release = task(async ({ sh }) => {
  await sh`gh workflow run release.yml`
})

export const releaseRun = task({ hidden: true }, async ({ sh }) => {
  await sh`bun release-it -VV --ci`
})

export const commitTypes = task(async ({ sh }) => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - trust the shape that `commitlint --print-config json` prints
  const config = (await sh`bun commitlint --print-config json`.echo(false).json()) as {
    rules: { "type-enum": [number, string, string[]] }
  }
  const { 2: types } = config.rules["type-enum"]
  console.log(`Commit types:\n    ${types.join("\n    ")}`)
})

list.after(async () => {
  console.log()
  await commitTypes()
})

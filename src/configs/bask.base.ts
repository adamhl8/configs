import { existsSync } from "node:fs"

import { CommandError, list, task } from "@adamhl8/bask"
import bun, { $, Glob } from "bun"

import { prepareDependencyReport } from "#configs/bask/dep-report.ts"
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

const TOFU_PLAN_CHANGES_EXIT_CODE = 2

export const tofuCheck = task(async ({ sh }) => {
  if (!(await canRunTofu())) return
  const plan = await sh`tofu plan -detailed-exitcode -concise -compact-warnings`.nothrow()
  // Exit with tofu's code for drift without reporting a failed task, because the plan output already shows the drift.
  if (plan.exitCode === TOFU_PLAN_CHANGES_EXIT_CODE) process.exitCode = TOFU_PLAN_CHANGES_EXIT_CODE
  else if (plan.exitCode !== 0) throw new CommandError("tofu plan", plan)
})

export const prepare = task(async ({ sh }) => {
  // Skip `lefthook install` in CI so commits made by the workflows don't run the hooks.
  if (!inCi) await sh`lefthook install`
  await sh`adamhl8-gitignore`
  await sh`adamhl8-bunfig`
  await sh`adamhl8-tsconfig`
  await sh`oxfmt bunfig.toml`
  if (await canRunTofu()) await sh`tofu init -upgrade`
})

let reportDependencyChanges: (() => Promise<void>) | undefined

export const bumpDeps = task(
  { args: { report: { short: "r", desc: "Ask Claude Code to report what the changes mean for the project" } } },
  async ({ sh }) => {
    await sh`bunx npm-check-updates --upgrade --format group`
    await sh`rm -f bun.lock`
    await sh`rm -rf node_modules/`
    await sh`bun install --no-summary --no-cache`
    await reportDependencyChanges?.()
  },
)

// Register the snapshot here so it runs before a project's own `before` hooks, which can bump ranges too.
bumpDeps.before(async ({ args }) => {
  if (args.report) reportDependencyChanges = await prepareDependencyReport()
})

export const test = task(async ({ sh }) => {
  await sh`bun test --pass-with-no-tests`.echo(false)
})

export const lint = task(async ({ sh }) => {
  await sh`markdown-toc -i --bullets - --maxdepth 3 ./README.md`
  await sh`oxlint --fix --fix-suggestions --fix-dangerously`
  await sh`oxfmt`

  if (resolveProjectTailwind()) {
    // Check for `.astro` files first so projects without them don't need tailwint installed.
    const astroFiles = await lsFiles([":(glob)**/*.astro"])
    // Skip `--fix` because tailwint resolves a class conflict by deleting a class by position, not by which one wins.
    if (astroFiles.length > 0) await sh`tailwint "**/*.astro"`
  }

  const tofuFiles = await lsFiles([
    ":(glob)**/*.tf",
    ":(glob)**/*.tofu",
    ":(glob)**/*.tfvars",
    ":(glob)**/*.tftest.hcl",
    ":(glob)**/*.tofutest.hcl",
  ])
  if (tofuFiles.length > 0) await sh`tofu fmt ${tofuFiles}`

  await sh`tsc`
  await sh`knip-bun`
  await sh`knip-bun --production`
  if (existsSync(".github/workflows")) await sh`actionlint`
  await test()
})

export const bundle = task(async ({ sh }) => {
  if (await bun.file("tsdown.config.ts").exists()) await sh`tsdown`
})

export const build = task(async ({ sh }) => {
  await lint()
  await bundle()
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
  await sh`release-it -VV --ci`
})

export const commitTypes = task(async ({ sh }) => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - trust the shape that `commitlint --print-config json` prints
  const config = (await sh`commitlint --print-config json`.echo(false).json()) as {
    rules: { "type-enum": [number, string, string[]] }
  }
  const { 2: types } = config.rules["type-enum"]
  console.log(`Commit types:\n    ${types.join("\n    ")}`)
})

list.after(async () => {
  console.log()
  await commitTypes()
})

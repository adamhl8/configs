import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { $ } from "bun"
import { isPlainObject } from "es-toolkit/predicate"
import { difference, findMinimumForRange, tryParseRange } from "verkit"

const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const

/** Reads every dependency range in the project's `package.json`, keyed by `<field> <name>`. */
const readDependencyRanges = () => {
  const packageJson: unknown = JSON.parse(readFileSync("package.json", "utf8"))
  const fields = isPlainObject(packageJson) ? packageJson : {}

  const ranges = new Map<string, string>()
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies: unknown = fields[field]
    if (!isPlainObject(dependencies)) continue
    for (const [name, range] of Object.entries(dependencies))
      if (typeof range === "string") ranges.set(`${field} ${name}`, range)
  }
  return ranges
}

/** Returns the lowest version a range allows, or nothing for a missing or non-semver range like `workspace:*`. */
const lowestVersion = (range: string | undefined) => {
  const parsedRange = range === undefined ? undefined : tryParseRange(range)
  return parsedRange ? findMinimumForRange(parsedRange) : undefined
}

/** Checks whether a range change only bumps the patch version of a 1.0+ package. */
const isPatchOnlyChange = (oldRange: string | undefined, newRange: string | undefined) => {
  const oldVersion = lowestVersion(oldRange)
  const newVersion = lowestVersion(newRange)
  if (!oldVersion || !newVersion) return false
  // Keep 0.x patch bumps because a 0.x patch release can add features or break things.
  return oldVersion.major > 0 && difference(oldVersion, newVersion) === "patch"
}

/** Lists each range that changed by more than a patch as `<field> <name>: <old> -> <new>`. */
const listRangeChanges = (before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>) => {
  const keys = new Set([...before.keys(), ...after.keys()])
  return [...keys]
    .filter((key) => before.get(key) !== after.get(key) && !isPatchOnlyChange(before.get(key), after.get(key)))
    .map((key) => `${key}: ${before.get(key) ?? "(none)"} -> ${after.get(key) ?? "(none)"}`)
}

interface ClaudeResult {
  is_error: boolean
  result: string
  session_id: string
  total_cost_usd?: number
}

/**
 * Snapshots the project's dependency ranges and loads the prompt. Returns a function that asks Claude Code to research
 * the ranges that changed since the snapshot and prints its report. That function skips the report when nothing changed
 * or `claude` isn't installed.
 */
export const prepareDependencyReport = async () => {
  const rangesBefore = readDependencyRanges()
  // Read the prompt now because the reinstall can move this package to a new folder and delete the old one.
  const instructions = await Bun.file(fileURLToPath(new URL("prompt.md", import.meta.url))).text()

  return async () => {
    const changes = listRangeChanges(rangesBefore, readDependencyRanges())
    if (changes.length === 0) return
    if (!Bun.which("claude")) {
      console.log("\nSkipping the dependency report because `claude` isn't installed.")
      return
    }

    console.log("\nAsking Claude to review the dependency changes. This takes a few minutes.")
    const prompt = `${instructions}\n${changes.join("\n")}\n`

    // Use `auto` because the research runs commands that an allowlist can't predict.
    // Deny the file tools because the report must not change the project.
    const output =
      await $`claude -p ${prompt} --output-format json --permission-mode auto --disallowedTools Edit,Write,NotebookEdit --name ${"bump-deps report"}`
        .nothrow()
        .quiet()

    // Report a failure without throwing because the dependencies are already bumped.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - trust the shape that `claude --output-format json` prints
    const parsed = output.exitCode === 0 ? (output.json() as ClaudeResult) : undefined
    if (!parsed || parsed.is_error) {
      console.log(`\nThe dependency report failed:\n${output.stderr.toString() || output.stdout.toString()}`)
      return
    }

    console.log(`\n${parsed.result}`)
    const cost = parsed.total_cost_usd === undefined ? "" : ` (cost: $${parsed.total_cost_usd.toFixed(2)})`
    console.log(`\nFollow up with: claude --resume ${parsed.session_id}${cost}`)
  }
}

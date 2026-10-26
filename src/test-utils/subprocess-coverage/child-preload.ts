// Records coverage of the installed package in every Bun process that a test starts.
// Tests load this file through `BUN_OPTIONS` once a project imports `subprocess-coverage`.
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import { createInstrumenter } from "@vitest/istanbul-lib-instrument"
import type { InputSourceMap } from "@vitest/istanbul-lib-instrument"
import bun from "bun"

import { SUBPROCESS_COVERAGE_SETTINGS_VAR } from "#test-utils/subprocess-coverage/env.ts"
import type { CoverageSettings } from "#test-utils/subprocess-coverage/env.ts"

const INSTRUMENTER_COVERAGE_VARIABLE = "subprocessCoverage"

const isCoverageSettings = (value: unknown): value is CoverageSettings =>
  typeof value === "object"
  && value !== null
  && "rawDir" in value
  && typeof value.rawDir === "string"
  && "root" in value
  && typeof value.root === "string"
  && "packageName" in value
  && typeof value.packageName === "string"

/** Reads the coverage settings from the environment, and throws when they're missing or invalid. */
const readCoverageSettings = () => {
  const settings = process.env[SUBPROCESS_COVERAGE_SETTINGS_VAR]
  if (settings === undefined)
    throw new Error(`the subprocess coverage preload loaded without ${SUBPROCESS_COVERAGE_SETTINGS_VAR}`)
  const parsed: unknown = JSON.parse(settings)
  if (!isCoverageSettings(parsed)) throw new Error(`${SUBPROCESS_COVERAGE_SETTINGS_VAR} isn't valid: ${settings}`)
  return parsed
}

const { rawDir, root, packageName } = readCoverageSettings()

const isSourceMap = (value: unknown): value is InputSourceMap =>
  typeof value === "object" && value !== null && "sources" in value && Array.isArray(value.sources)

/** Points each source in the installed package's map at the same file in the project, so reports name `src/`. */
const readSourceMap = async (file: string, packageDir: string, projectDir: string) => {
  const sourceMap: unknown = await bun.file(`${file}.map`).json()
  if (!isSourceMap(sourceMap)) throw new Error(`no source map for ${file}`)
  const sources = sourceMap.sources.map((source) => {
    const installedSource = path.resolve(path.dirname(file), source ?? "")
    return path.join(projectDir, path.relative(packageDir, installedSource))
  })
  return { ...sourceMap, sources }
}

const instrumenter = createInstrumenter({ esModules: true, coverageVariable: INSTRUMENTER_COVERAGE_VARIABLE })
// Match the built files of the copy that a test project installs, and capture its package dir.
const installedDist = new RegExp(String.raw`^(.*/node_modules/${RegExp.escape(packageName)})/dist/.*\.js$`, "v")

bun.plugin({
  name: "subprocess-coverage",
  setup: (build) => {
    build.onLoad({ filter: installedDist }, async ({ path: file }) => {
      const [, packageDir = ""] = installedDist.exec(file) ?? []
      const code = await bun.file(file).text()
      const sourceMap = await readSourceMap(file, packageDir, root)
      return { contents: instrumenter.instrumentSync(code, file, sourceMap), loader: "js" }
    })
  },
})

const hasCoverage = (value: object): value is Record<typeof INSTRUMENTER_COVERAGE_VARIABLE, unknown> =>
  INSTRUMENTER_COVERAGE_VARIABLE in value

const writeCoverage = () => {
  // Copy `globalThis` to a local because TypeScript doesn't narrow `globalThis` itself.
  const globalScope: object = globalThis
  // Skip a process that never loaded the package, because only instrumented code creates the global.
  if (!hasCoverage(globalScope)) return
  fs.writeFileSync(
    path.join(rawDir, `${crypto.randomUUID()}.json`),
    JSON.stringify(globalScope[INSTRUMENTER_COVERAGE_VARIABLE]),
  )
}

process.on("exit", writeCoverage)

// Move `writeCoverage` behind each later exit listener so the coverage file includes what those listeners run.
// Wait a microtask because `newListener` fires before the new listener is added.
// A listener added in the same tick as a synchronous `process.exit()` still runs after the write.
process.on("newListener", (event, listener) => {
  if (event !== "exit" || listener === writeCoverage) return
  queueMicrotask(() => {
    process.removeListener("exit", writeCoverage)
    process.on("exit", writeCoverage)
  })
})

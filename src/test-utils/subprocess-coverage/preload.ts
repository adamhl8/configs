// Turns on coverage for the package's own bins and modules that tests run in child processes.
// Import it once, from the test preload, in the package's repo.
import { afterAll } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"

import bun from "bun"

import { SUBPROCESS_COVERAGE_SETTINGS_VAR } from "#test-utils/subprocess-coverage/env.ts"
import type { CoverageSettings } from "#test-utils/subprocess-coverage/env.ts"
import { reportCoverage } from "#test-utils/subprocess-coverage/report.ts"

// Match this file's extension so the preload is the `.ts` source in this repo and the built `.js` in `dist/`.
const CHILD_PRELOAD = path.join(import.meta.dir, `child-preload${path.extname(import.meta.path)}`)

const hasName = (value: unknown): value is { name: string } =>
  typeof value === "object" && value !== null && "name" in value && typeof value.name === "string"

const root = process.cwd()
const packageJson: unknown = await bun.file(path.join(root, "package.json")).json()
if (!hasName(packageJson)) throw new Error(`subprocess coverage needs a package name in ${root}/package.json`)

const rawDir = await fs.mkdtemp(path.join(os.tmpdir(), "subprocess-coverage-"))
const settings: CoverageSettings = { rawDir, root, packageName: packageJson.name }

// Set these on `process.env` so `subprocessCoverageEnv` and shells that inherit `process.env` pass them on.
process.env["BUN_OPTIONS"] = `--preload=${CHILD_PRELOAD}`
process.env[SUBPROCESS_COVERAGE_SETTINGS_VAR] = JSON.stringify(settings)

afterAll(async () => {
  await reportCoverage(rawDir, path.join(root, "coverage"))
  await fs.rm(rawDir, { recursive: true, force: true })
})

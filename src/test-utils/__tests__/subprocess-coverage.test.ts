import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"

import bun from "bun"

import { minimalEnv } from "#test-utils/shell/env.ts"
import { createShell } from "#test-utils/shell/shell.ts"
import { subprocessCoverageEnv } from "#test-utils/subprocess-coverage/env.ts"

const ROOT = path.resolve(import.meta.dir, "../../..")
const COVERAGE_PACKAGE = path.join(import.meta.dir, "fixtures/coverage-package")

/** Returns the lcov record for `source`, which lcov names relative to the project root. */
const getRecord = (lcov: string, source: string) => {
  const start = lcov.indexOf(`SF:${source}\n`)
  if (start === -1) return ""
  return lcov.slice(start, lcov.indexOf("end_of_record", start))
}

const removeOutputs = async () => {
  await Promise.all(
    ["node_modules", "dist", "coverage"].map(async (dir) =>
      fs.rm(path.join(COVERAGE_PACKAGE, dir), { recursive: true, force: true }),
    ),
  )
}

describe("subprocess coverage", () => {
  // Run the fixture in place so its `tsdown` and this package's dependencies resolve from the repo.
  beforeAll(async () => {
    await createShell({ cwd: ROOT })`bun tsdown`
    await removeOutputs()
    await fs.mkdir(path.join(COVERAGE_PACKAGE, "node_modules/@adamhl8"), { recursive: true })
    await fs.symlink(ROOT, path.join(COVERAGE_PACKAGE, "node_modules/@adamhl8/configs"))
  }, 120_000)

  afterAll(removeOutputs)

  it("returns no variables when the project doesn't import it", () => {
    expect(subprocessCoverageEnv()).toEqual({})
  })

  it("reports the source coverage of a bin that a test runs from the packed package", async () => {
    const run = createShell({ cwd: COVERAGE_PACKAGE, env: minimalEnv() })

    const { stdout } = await run`bun test`
    const lcov = await bun.file(path.join(COVERAGE_PACKAGE, "coverage/lcov.info")).text()
    const cliRecord = getRecord(lcov, "src/cli.ts")
    const greetRecord = getRecord(lcov, "src/greet.ts")

    expect(stdout).toContain(" cli.ts ")
    expect(cliRecord).toContain("BRDA:5,0,0,0")
    expect(cliRecord).toContain("BRDA:5,0,1,1")
    expect(greetRecord).toContain("DA:1,1")
  }, 120_000)
})

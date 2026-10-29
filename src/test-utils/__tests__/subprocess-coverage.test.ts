import { beforeAll, describe, expect, it } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"

import bun from "bun"

import { copyFixture } from "#test-utils/fixture.ts"
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

const readLcov = async (file: string) => {
  const lcov = bun.file(file)
  return (await lcov.exists()) ? lcov.text() : ""
}

/**
 * Copies the fixture, links this package and `tsdown` from the repo into it, and runs its tests. Returns the test
 * output and the lcov that Bun and the subprocess report each wrote.
 */
const runCoveragePackage = async (bunfigCoverage: boolean) => {
  const { dir, run } = await copyFixture(COVERAGE_PACKAGE, { shell: { env: minimalEnv() } })
  await fs.mkdir(path.join(dir, "node_modules/@adamhl8"), { recursive: true })
  await fs.mkdir(path.join(dir, "node_modules/.bin"))
  await fs.symlink(ROOT, path.join(dir, "node_modules/@adamhl8/configs"))
  await fs.symlink(path.join(ROOT, "node_modules/tsdown"), path.join(dir, "node_modules/tsdown"))
  await fs.symlink(path.join(ROOT, "node_modules/.bin/tsdown"), path.join(dir, "node_modules/.bin/tsdown"))
  const bunfig = path.join(dir, "bunfig.toml")
  await bun.write(bunfig, (await bun.file(bunfig).text()).replace("coverage = true", `coverage = ${bunfigCoverage}`))

  const { stdout } = await run`bun test`
  const [bunLcov, subprocessLcov] = await Promise.all([
    readLcov(path.join(dir, "coverage/lcov.info")),
    readLcov(path.join(dir, "coverage/subprocess/lcov.info")),
  ])
  return { stdout, bunLcov, subprocessLcov }
}

describe("subprocess coverage", () => {
  let withBunCoverage = { stdout: "", bunLcov: "", subprocessLcov: "" }
  let withoutBunCoverage = { stdout: "", bunLcov: "", subprocessLcov: "" }

  beforeAll(async () => {
    await createShell({ cwd: ROOT })`bun tsdown`
    ;[withBunCoverage, withoutBunCoverage] = await Promise.all([runCoveragePackage(true), runCoveragePackage(false)])
  }, 120_000)

  it("returns no variables when the project doesn't import it", () => {
    expect(subprocessCoverageEnv()).toEqual({})
  })

  it("reports the source coverage of a bin that a test runs from the packed package", () => {
    const cliRecord = getRecord(withBunCoverage.subprocessLcov, "src/cli.ts")

    expect(withBunCoverage.stdout).toContain("Subprocess coverage")
    expect(withBunCoverage.stdout).toContain(" cli.ts ")
    expect(cliRecord).toContain("BRDA:6,0,0,0")
    expect(cliRecord).toContain("BRDA:6,0,1,1")
  })

  it("reports the coverage of an exit listener that the bin registers after the preload", () => {
    expect(getRecord(withBunCoverage.subprocessLcov, "src/cli.ts")).toContain("DA:9,1")
  })

  it("leaves a file that Bun's coverage doesn't ignore to Bun's report", () => {
    expect(getRecord(withBunCoverage.subprocessLcov, "src/shout.ts")).toBe("")
    expect(getRecord(withBunCoverage.bunLcov, "src/shout.ts")).toContain("DA:1,1")
  })

  it("reports a file that Bun's coverage ignores", () => {
    expect(getRecord(withBunCoverage.bunLcov, "src/greet.ts")).toBe("")
    expect(getRecord(withBunCoverage.subprocessLcov, "src/greet.ts")).toContain("DA:1,1")
  })

  it("reports every file when Bun's coverage is off", () => {
    expect(getRecord(withoutBunCoverage.subprocessLcov, "src/cli.ts")).toContain("DA:9,1")
    expect(getRecord(withoutBunCoverage.subprocessLcov, "src/shout.ts")).not.toBe("")
  })

  // Read the coverage-off run because the other run leaves `shout.ts` to Bun.
  it("reports code that a package entry with no source map re-exports", () => {
    expect(getRecord(withoutBunCoverage.subprocessLcov, "src/shout.ts")).toContain("FNH:1")
  })
})

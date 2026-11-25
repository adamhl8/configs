import { beforeAll, describe, expect, it } from "bun:test"
import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { copyFixture } from "#test-utils/fixture.ts"
import { createShell } from "#test-utils/shell.ts"
import { minimalEnv } from "#test-utils/shell/env.ts"

const ROOT = path.resolve(import.meta.dir, "../../..")
const PRELOAD_PROJECT = path.join(import.meta.dir, "fixtures/preload-project")
const TEMP_DIR_LINE = /^TEMP_DIR=(?<dir>.+)$/mv

/** Copies the project that uses the preload, with this package linked in. */
const createPreloadProject = async () => {
  const { dir, run } = await copyFixture(PRELOAD_PROJECT, { shell: { env: minimalEnv() } })
  // Link this package in because the export imports only `bun` and `node:` builtins, so nothing needs installing.
  await fs.mkdir(path.join(dir, "node_modules/@adamhl8"), { recursive: true })
  await fs.symlink(ROOT, path.join(dir, "node_modules/@adamhl8/configs"))
  return run
}

describe("preload", () => {
  // Build so the project loads the current `dist/test-utils/` through the package exports.
  beforeAll(async () => {
    await createShell({ cwd: ROOT })`bun tsdown`
  }, 120_000)

  it("removes tracked temp dirs after the consumer's test run", async () => {
    const run = await createPreloadProject()

    const { stdout } = await run`bun test`
    const tempDir = TEMP_DIR_LINE.exec(stdout)?.groups?.["dir"]

    expect(tempDir).toBeString()
    expect(existsSync(String(tempDir))).toBe(false)
  }, 30_000)

  it("gives the removal more time than the default hook timeout", async () => {
    const run = await createPreloadProject()

    const { stderr } = await run`bun test --timeout 1`.nothrow()

    expect(stderr).toContain("0 fail")
  }, 30_000)
})

import { beforeAll, describe, expect, it } from "bun:test"
import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { copyFixture } from "#test-utils/fixture.ts"
import { minimalEnv } from "#test-utils/shell/env.ts"
import { createShell } from "#test-utils/shell/shell.ts"

const ROOT = path.resolve(import.meta.dir, "../../..")
const PRELOAD_PROJECT = path.join(import.meta.dir, "fixtures/preload-project")
const TEMP_DIR_LINE = /^TEMP_DIR=(?<dir>.+)$/mv

describe("preload", () => {
  // Build so the project loads the current `dist/test-utils/` through the package exports.
  beforeAll(async () => {
    await createShell({ cwd: ROOT })`bun tsdown`
  }, 120_000)

  it("removes tracked temp dirs after the consumer's test run", async () => {
    const { dir, run } = await copyFixture(PRELOAD_PROJECT, { shell: { env: minimalEnv() } })
    // Link this package in because the export imports only `bun` and `node:` builtins, so nothing needs installing.
    await fs.mkdir(path.join(dir, "node_modules/@adamhl8"), { recursive: true })
    await fs.symlink(ROOT, path.join(dir, "node_modules/@adamhl8/configs"))

    const { stdout } = await run`bun test`
    const tempDir = TEMP_DIR_LINE.exec(stdout)?.groups?.["dir"]

    expect(tempDir).toBeString()
    expect(existsSync(String(tempDir))).toBe(false)
  }, 30_000)
})

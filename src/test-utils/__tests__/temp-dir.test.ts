import { describe, expect, it } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"

import { makeTempDir } from "#test-utils/temp-dir.ts"

describe("makeTempDir", () => {
  it("makes a dir in the OS temp dir named after the current project", async () => {
    const dir = await makeTempDir()
    const projectName = path.basename(process.cwd())

    expect(path.dirname(dir)).toBe(os.tmpdir())
    expect(path.basename(dir).startsWith(`${projectName}-`)).toBe(true)
    expect((await fs.stat(dir)).isDirectory()).toBe(true)
  })

  it("makes a new dir on each call", async () => {
    const first = await makeTempDir()
    const second = await makeTempDir()

    expect(first).not.toBe(second)
  })
})

import { describe, expect, it } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { makeTempDir } from "#test-utils/temp-dir.ts"

describe("makeTempDir", () => {
  it("makes a dir in the OS temp dir with the prefix", async () => {
    const dir = await makeTempDir("configs-temp-")

    expect(path.dirname(dir)).toBe(os.tmpdir())
    expect(path.basename(dir).startsWith("configs-temp-")).toBe(true)
    expect((await fs.stat(dir)).isDirectory()).toBe(true)
  })

  it("makes a new dir on each call", async () => {
    const first = await makeTempDir("configs-temp-")
    const second = await makeTempDir("configs-temp-")

    expect(first).not.toBe(second)
  })
})

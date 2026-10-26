import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import bun from "bun"

import { copyFixture } from "#test-utils/fixture.ts"

const TINY_CONSUMER = path.join(import.meta.dir, "fixtures/tiny-consumer")

describe("copyFixture", () => {
  it("copies the fixture into a new temp dir", async () => {
    const { dir } = await copyFixture(TINY_CONSUMER, { prefix: "configs-fixture-" })

    expect(path.dirname(dir)).toBe(os.tmpdir())
    expect(path.basename(dir).startsWith("configs-fixture-")).toBe(true)
    expect(await bun.file(path.join(dir, "package.json")).exists()).toBe(true)
  })

  it("defaults the prefix to the fixture's name", async () => {
    const { dir } = await copyFixture(TINY_CONSUMER)

    expect(path.basename(dir).startsWith("tiny-consumer-")).toBe(true)
  })

  it("binds the returned shell to the copy", async () => {
    const { dir, run } = await copyFixture(TINY_CONSUMER)

    expect(fs.realpathSync((await run`pwd`).stdout)).toBe(fs.realpathSync(dir))
  })

  it("passes shell options through", async () => {
    const { run } = await copyFixture(TINY_CONSUMER, { shell: { env: { ONLY: "1" }, localBins: false } })

    expect((await run`echo $ONLY`).stdout).toBe("1")
  })
})

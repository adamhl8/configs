import { beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test"
import path from "node:path"

import bun from "bun"

import { copyFixture } from "#test-utils/fixture.ts"
import { packPackage } from "#test-utils/pack.ts"

setDefaultTimeout(60_000)

const TINY_PACKAGE = path.join(import.meta.dir, "fixtures/tiny-package")
const TINY_CONSUMER = path.join(import.meta.dir, "fixtures/tiny-consumer")

describe("packPackage", () => {
  let tarball = ""

  // Pack once because concurrent tests would race on the fixture's `dist/`.
  beforeAll(async () => {
    tarball = await packPackage(TINY_PACKAGE)
  })

  it("builds and packs a package into a tarball", async () => {
    expect(path.isAbsolute(tarball)).toBe(true)
    expect(path.basename(tarball)).toBe("tiny-package-1.0.0.tgz")
    expect(await bun.file(tarball).exists()).toBe(true)
  })

  // `files` ships only `dist/`, so this also proves the build ran.
  it("packs a tarball that installs and imports", async () => {
    const { run } = await copyFixture(TINY_CONSUMER)

    await run`bun add ${tarball}`
    const { stdout } = await run`bun -e ${'import { tiny } from "tiny-package"; console.log(tiny)'}`

    expect(stdout).toBe("tiny")
  })
})

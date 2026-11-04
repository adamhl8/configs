import { describe, expect, it, setDefaultTimeout } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import bun from "bun"

import { copyFixture } from "#test-utils/fixture.ts"
import { packPackage } from "#test-utils/pack.ts"

setDefaultTimeout(60_000)

const TINY_PACKAGE = path.join(import.meta.dir, "fixtures/tiny-package")
const TINY_CONSUMER = path.join(import.meta.dir, "fixtures/tiny-consumer")

describe("packPackage", () => {
  it("builds and packs a package into a tarball", async () => {
    const tarball = await packPackage(TINY_PACKAGE)

    expect(path.isAbsolute(tarball)).toBe(true)
    expect(path.basename(tarball)).toBe("tiny-package-1.0.0.tgz")
    expect(await bun.file(tarball).exists()).toBe(true)
  })

  // `files` ships only `dist/`, so this also proves the build ran.
  it("packs a tarball that installs and imports", async () => {
    const tarball = await packPackage(TINY_PACKAGE)
    const { run } = await copyFixture(TINY_CONSUMER)

    await run`bun add ${tarball}`
    const { stdout } = await run`bun -e ${'import { tiny } from "tiny-package"; console.log(tiny)'}`

    expect(stdout).toBe("tiny")
  })

  it("builds once and returns the same tarball for calls with the same resolved root", async () => {
    const { dir } = await copyFixture(TINY_PACKAGE)
    // Stand in for `tsdown` because this test only counts builds and the other tests cover the real one.
    const tsdownBin = path.join(dir, "node_modules/.bin/tsdown")
    await bun.write(tsdownBin, "#!/bin/sh\necho build >> builds.log\n")
    await fs.chmod(tsdownBin, 0o755)

    const [first, overlapping] = await Promise.all([packPackage(dir), packPackage(dir)])
    const relativeRoot = await packPackage(path.relative(process.cwd(), dir))

    expect(overlapping).toBe(first)
    expect(relativeRoot).toBe(first)
    expect(await bun.file(path.join(dir, "builds.log")).text()).toBe("build\n")
  })
})

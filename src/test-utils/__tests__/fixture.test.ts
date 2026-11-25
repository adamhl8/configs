import { beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"

import bun from "bun"

import { copyFixture } from "#test-utils/fixture.ts"
import { packPackage } from "#test-utils/pack.ts"

setDefaultTimeout(60_000)

const FIXTURES = path.join(import.meta.dir, "fixtures")
const TINY_CONSUMER = path.join(FIXTURES, "tiny-consumer")
const IMPORT_SCOPED = 'import { scoped } from "@tiny/package"; console.log(scoped)'

/** Copies a package fixture and adds a packed dependency to it, so it installs without the registry. */
const createPackage = async (name: string) => {
  const { dir, run } = await copyFixture(path.join(FIXTURES, name))
  const tarball = await packPackage(path.join(FIXTURES, "local-dependency"))
  await run`bun pm pkg set dependencies.local-dependency=${tarball}`
  return dir
}

const copyWithPackage = async (packageRoot: string) => copyFixture(TINY_CONSUMER, { packageRoot })

/** Returns the real path of an entry in the copy's `node_modules`. */
const getInstalledPath = (dir: string, entry: string) => fs.realpathSync(path.join(dir, "node_modules", entry))

describe("copyFixture", () => {
  it("copies the fixture into a new temp dir", async () => {
    const { dir } = await copyFixture(TINY_CONSUMER)

    expect(path.dirname(dir)).toBe(os.tmpdir())
    expect(await bun.file(path.join(dir, "package.json")).exists()).toBe(true)
  })

  it("binds the returned shell to the copy", async () => {
    const { dir, run } = await copyFixture(TINY_CONSUMER)

    expect(fs.realpathSync((await run`pwd`).stdout)).toBe(fs.realpathSync(dir))
  })

  it("passes shell options through", async () => {
    const { run } = await copyFixture(TINY_CONSUMER, { shell: { env: { ONLY: "1" }, localBins: false } })

    expect((await run`echo $ONLY`).stdout).toBe("1")
  })

  it("adds no node_modules without packageRoot", async () => {
    const { dir } = await copyFixture(TINY_CONSUMER)

    expect(fs.existsSync(path.join(dir, "node_modules"))).toBe(false)
  })
})

describe("copyFixture with packageRoot", () => {
  let binPackage = ""
  let scopedPackage = ""

  beforeAll(async () => {
    ;[binPackage, scopedPackage] = await Promise.all([createPackage("bin-package"), createPackage("scoped-package")])
  })

  it("makes the package available, with its bin and its dependencies", async () => {
    const { run } = await copyWithPackage(binPackage)

    expect((await run`bin-package`).stdout).toBe("bin-package: hello")
  })

  it("makes a scoped package with no bins available", async () => {
    const { run } = await copyWithPackage(scopedPackage)

    expect((await run`bun -e ${IMPORT_SCOPED}`).stdout).toBe("scoped: hello")
  })

  it("adds only the package and its bins, and leaves the fixture's own files alone", async () => {
    const { dir } = await copyWithPackage(binPackage)
    const entries = await fs.promises.readdir(dir)
    const installedEntries = await fs.promises.readdir(path.join(dir, "node_modules"))
    const packageJson = await bun.file(path.join(dir, "package.json")).text()

    expect(entries.toSorted()).toEqual(["node_modules", "package.json"])
    expect(installedEntries.toSorted()).toEqual([".bin", "bin-package"])
    expect(packageJson).toBe(await bun.file(path.join(TINY_CONSUMER, "package.json")).text())
  })

  it("gives each copy its own files for the package", async () => {
    const [first, second] = await Promise.all([copyWithPackage(binPackage), copyWithPackage(binPackage)])

    await bun.write(path.join(first.dir, "node_modules/bin-package/cli.js"), 'console.log("edited")\n')
    const later = await copyWithPackage(binPackage)

    expect((await first.run`bun node_modules/.bin/bin-package`).stdout).toBe("edited")
    expect((await second.run`bin-package`).stdout).toBe("bin-package: hello")
    expect((await later.run`bin-package`).stdout).toBe("bin-package: hello")
  })

  it("gives each copy its own files for a scoped package", async () => {
    const [first, second] = await Promise.all([copyWithPackage(scopedPackage), copyWithPackage(scopedPackage)])

    await bun.write(path.join(first.dir, "node_modules/@tiny/package/index.js"), 'export const scoped = "edited"\n')

    expect((await first.run`bun -e ${IMPORT_SCOPED}`).stdout).toBe("edited")
    expect((await second.run`bun -e ${IMPORT_SCOPED}`).stdout).toBe("scoped: hello")
  })

  it("gives each copy its own bins", async () => {
    const [first, second] = await Promise.all([copyWithPackage(binPackage), copyWithPackage(binPackage)])

    await fs.promises.rm(path.join(first.dir, "node_modules/.bin/bin-package"))

    expect((await second.run`bin-package`).stdout).toBe("bin-package: hello")
  })

  it("shares one install's dependencies between copies with the same resolved root", async () => {
    const [first, overlapping] = await Promise.all([copyWithPackage(binPackage), copyWithPackage(binPackage)])
    const { dir: relativeDir } = await copyWithPackage(path.relative(process.cwd(), binPackage))
    const entry = "bin-package/node_modules/local-dependency"
    const sharedPath = getInstalledPath(first.dir, entry)

    expect(sharedPath.startsWith(fs.realpathSync(first.dir))).toBe(false)
    expect(getInstalledPath(overlapping.dir, entry)).toBe(sharedPath)
    expect(getInstalledPath(relativeDir, entry)).toBe(sharedPath)
  })
})

import { beforeAll, expect, it, setDefaultTimeout } from "bun:test"
import path from "node:path"

import { copyFixture, minimalEnv, packPackage, subprocessCoverageEnv } from "@adamhl8/configs/test"

setDefaultTimeout(60_000)

let tarball = ""

beforeAll(async () => {
  tarball = await packPackage(import.meta.dir)
})

it("runs the installed bin", async () => {
  const { run } = await copyFixture(path.join(import.meta.dir, "consumer"), {
    shell: { env: minimalEnv(subprocessCoverageEnv()) },
  })
  await run`bun add ${tarball}`

  const { stdout } = await run`coverage-cli`

  expect(stdout).toBe("hello")
})

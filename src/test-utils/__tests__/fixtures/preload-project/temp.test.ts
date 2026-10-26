import { expect, it } from "bun:test"
import { existsSync } from "node:fs"

import { makeTempDir } from "@adamhl8/configs/test"

it("makes a tracked temp dir", async () => {
  const dir = await makeTempDir("preload-project-temp-")

  expect(existsSync(dir)).toBe(true)
  console.log(`TEMP_DIR=${dir}`)
})

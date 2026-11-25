import { expect, it } from "bun:test"
import { existsSync } from "node:fs"
import path from "node:path"

import { makeTempDir } from "@adamhl8/configs/test"
import bun from "bun"

// Give the test its own timeout, because one of the runs lowers the default.
it("makes a tracked temp dir", async () => {
  const dir = await makeTempDir()
  // Write enough files that removing them takes longer than that default.
  const files = Array.from({ length: 1000 }, (_, index) => path.join(dir, `${index}.txt`))
  await Promise.all(files.map(async (file) => bun.write(file, "")))

  expect(existsSync(dir)).toBe(true)
  console.log(`TEMP_DIR=${dir}`)
}, 30_000)

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const tempDirs: string[] = []

/** Makes a temp dir whose name starts with `prefix`, and records it for `removeTempDirs`. */
export const makeTempDir = async (prefix: string) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

/** Removes every dir made by `makeTempDir`. */
export const removeTempDirs = async () => {
  await Promise.all(tempDirs.map(async (dir) => fs.rm(dir, { recursive: true, force: true })))
}

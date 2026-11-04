import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"

const tempDirs: string[] = []

/** Makes a temp dir named after the current project, and records it for `removeTempDirs`. */
export const makeTempDir = async () => {
  // Start the name with the project so a dir left behind by a killed run shows where it came from.
  const projectName = path.basename(process.cwd())
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `${projectName}-`))
  tempDirs.push(dir)
  return dir
}

/** Removes every dir made by `makeTempDir`. */
export const removeTempDirs = async () => {
  await Promise.all(tempDirs.map(async (dir) => fs.rm(dir, { recursive: true, force: true })))
}

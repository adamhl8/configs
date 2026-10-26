import path from "node:path"

import bun from "bun"

import { createShell } from "#test-utils/shell/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

/** Builds the package at `root` when it has a tsdown config, packs it into a temp dir, and returns the tarball path. */
export const packPackage = async (root: string) => {
  const run = createShell({ cwd: root })
  if (await bun.file(path.join(root, "tsdown.config.ts")).exists()) await run`bun tsdown`

  const destination = await makeTempDir(`${path.basename(root)}-pack-`)
  // Skip lifecycle scripts because a `prepare` script would rebuild and run the package's own tasks.
  const { stdout } = await run`bun pm pack --ignore-scripts --quiet --destination ${destination}`
  return path.resolve(destination, stdout)
}

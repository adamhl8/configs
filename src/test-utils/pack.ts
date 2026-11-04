import path from "node:path"

import bun from "bun"

import { createShell } from "#test-utils/shell/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

const packs = new Map<string, Promise<string>>()

const buildAndPack = async (root: string) => {
  const run = createShell({ cwd: root })
  if (await bun.file(path.join(root, "tsdown.config.ts")).exists()) await run`bun tsdown`

  const destination = await makeTempDir()
  // Skip lifecycle scripts because a `prepare` script would rebuild and run the package's own tasks.
  const { stdout } = await run`bun pm pack --ignore-scripts --quiet --destination ${destination}`
  return path.resolve(destination, stdout)
}

/**
 * Builds the package at `root` when it has a tsdown config, packs it into a temp dir, and returns the tarball path.
 * Runs once per resolved root for the life of the test process.
 */
export const packPackage = async (root: string) => {
  const resolvedRoot = path.resolve(root)
  const existingPack = packs.get(resolvedRoot)
  if (existingPack) return existingPack

  // Cache the promise so concurrent callers share one build.
  const pack = buildAndPack(resolvedRoot)
  packs.set(resolvedRoot, pack)
  return pack
}

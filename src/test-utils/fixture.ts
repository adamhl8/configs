import fs from "node:fs/promises"

import { installPackage } from "#test-utils/fixture/install.ts"
import type { ShellOptions } from "#test-utils/shell.ts"
import { createShell } from "#test-utils/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

export interface CopyFixtureOptions {
  /**
   * The root of a package to add to the copy's `node_modules`, built and packed first. Its dependencies are installed
   * once and shared by every copy, so a test must not edit a dependency.
   */
  packageRoot?: string
  /** Options for the returned shell, which always runs in the copy. */
  shell?: Omit<ShellOptions, "cwd">
}

/** Copies `fixture` into a new temp dir, and returns the dir and a shell that runs there. */
export const copyFixture = async (fixture: string, options: CopyFixtureOptions = {}) => {
  const { packageRoot, shell } = options
  const dir = await makeTempDir()
  await fs.cp(fixture, dir, { recursive: true })
  if (packageRoot !== undefined) await installPackage(packageRoot, dir)

  const run = createShell({ ...shell, cwd: dir })
  return { dir, run }
}

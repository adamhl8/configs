import fs from "node:fs/promises"

import { createShell } from "#test-utils/shell/shell.ts"
import type { ShellOptions } from "#test-utils/shell/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

export interface CopyFixtureOptions {
  /** Options for the returned shell, which always runs in the copy. */
  shell?: Omit<ShellOptions, "cwd">
}

/** Copies `fixture` into a new temp dir, and returns the dir and a shell that runs there. */
export const copyFixture = async (fixture: string, { shell }: CopyFixtureOptions = {}) => {
  const dir = await makeTempDir()
  await fs.cp(fixture, dir, { recursive: true })
  const run = createShell({ ...shell, cwd: dir })
  return { dir, run }
}

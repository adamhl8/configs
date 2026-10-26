import fs from "node:fs/promises"
import path from "node:path"

import { createShell } from "#test-utils/shell/shell.ts"
import type { ShellOptions } from "#test-utils/shell/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

export interface CopyFixtureOptions {
  /**
   * The start of the temp dir's name.
   *
   * @default `${path.basename(fixture)}-`
   */
  prefix?: string
  /** Options for the returned shell, which always runs in the copy. */
  shell?: Omit<ShellOptions, "cwd">
}

/** Copies `fixture` into a new temp dir, and returns the dir and a shell that runs there. */
export const copyFixture = async (fixture: string, { prefix, shell }: CopyFixtureOptions = {}) => {
  const dir = await makeTempDir(prefix ?? `${path.basename(fixture)}-`)
  await fs.cp(fixture, dir, { recursive: true })
  const run = createShell({ ...shell, cwd: dir })
  return { dir, run }
}

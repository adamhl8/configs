import path from "node:path"

import type { ShellEnv } from "#test-utils/shell/shell.ts"

/** Lists `node_modules/.bin` for `dir` and each of its parents, nearest first. */
const getBinDirs = (dir: string): string[] => {
  const binDir = path.join(dir, "node_modules", ".bin")
  const parent = path.dirname(dir)
  return parent === dir ? [binDir] : [binDir, ...getBinDirs(parent)]
}

/** Puts `node_modules/.bin` of `cwd` and each of its parents first on `PATH`. */
export const addBinDirs = (cwd: string, env: ShellEnv): ShellEnv => {
  // Drop an empty `PATH` because the shell reads a trailing empty entry as the cwd.
  const PATH = [...getBinDirs(cwd), env["PATH"]].filter(Boolean).join(path.delimiter)

  return { ...env, PATH }
}

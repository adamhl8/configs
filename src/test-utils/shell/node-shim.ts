import path from "node:path"

import type { ShellEnv } from "#test-utils/shell/shell.ts"

const NODE_SHIM_DIR = /^(?:bask|bun)-node-/v

/** Checks for a folder that `bask` or `bun run --bun` puts on `PATH` so `node` runs Bun. */
const isNodeShimDir = (dir: string) => NODE_SHIM_DIR.test(path.basename(dir))

/** Takes every `node` shim off `PATH` so `node` is the real Node however the tests started. */
export const removeNodeShims = (env: ShellEnv): ShellEnv => {
  const currentPath = env["PATH"]
  if (currentPath === undefined) return env

  const pathDirs = currentPath.split(path.delimiter)
  const PATH = pathDirs.filter((dir) => !isNodeShimDir(dir)).join(path.delimiter)

  return { ...env, PATH }
}

import process from "node:process"

import type { ShellEnv } from "#test-utils/shell/shell.ts"

/** Returns `PATH` and `HOME` from `process.env`, merged with `extra`. */
export const minimalEnv = (extra: ShellEnv = {}): ShellEnv => ({
  PATH: process.env["PATH"],
  HOME: process.env["HOME"],
  ...extra,
})

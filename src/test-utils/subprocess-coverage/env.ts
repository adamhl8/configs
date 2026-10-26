import process from "node:process"

import type { ShellEnv } from "#test-utils/shell/shell.ts"

/** Holds the JSON settings that tell a child's preload where to write coverage and what to instrument. */
export const SUBPROCESS_COVERAGE_SETTINGS_VAR = "ADAMHL8_SUBPROCESS_COVERAGE_SETTINGS"

export interface CoverageSettings {
  rawDir: string
  root: string
  packageName: string
}

/**
 * Returns the variables that make child Bun processes record coverage, for a shell that doesn't inherit `process.env`.
 * Returns nothing when the project doesn't import `@adamhl8/configs/test/subprocess-coverage`.
 */
export const subprocessCoverageEnv = (): ShellEnv => {
  const settings = process.env[SUBPROCESS_COVERAGE_SETTINGS_VAR]
  if (settings === undefined) return {}
  return { BUN_OPTIONS: process.env["BUN_OPTIONS"], [SUBPROCESS_COVERAGE_SETTINGS_VAR]: settings }
}

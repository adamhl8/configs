import process from "node:process"

import bun from "bun"
import type { ShellExpression } from "bun"

import { ShellCommand } from "#test-utils/shell/command.ts"

export type ShellEnv = Record<string, string | undefined>

export interface ShellOptions {
  /**
   * The working directory for commands. Relative paths resolve against `process.cwd()`.
   *
   * @default process.cwd()
   */
  cwd?: string
  /**
   * The environment for commands. Replaces `process.env`.
   *
   * @default process.env without `FORCE_COLOR`
   */
  env?: ShellEnv
  /**
   * Put `node_modules/.bin` of the cwd and each of its parents first on `PATH`.
   *
   * @default true
   */
  localBins?: boolean
  /**
   * Throw Bun's `ShellError` on a non-zero exit code.
   *
   * @default true
   */
  throws?: boolean
}

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number
}

/** Runs commands like Bun's `$`, quietly, starting from the shell's options. */
export type Shell = (strings: TemplateStringsArray, ...expressions: ShellExpression[]) => ShellCommand

/**
 * Creates a shell that runs each command quietly and returns its output with one trailing newline stripped. Commands
 * read the test runner's stdin, so add `< /dev/null` to a command that might prompt.
 */
export const createShell = (options: ShellOptions = {}): Shell => {
  // Use a separate instance so settings on Bun's global `$` don't apply here.
  const bunShell = new bun.$.Shell()
  const settings: Required<ShellOptions> = {
    cwd: options.cwd ?? process.cwd(),
    // Drop `FORCE_COLOR` because `bask` sets it when the tests run in a terminal and CI does not.
    env: options.env ?? { ...process.env, FORCE_COLOR: undefined },
    localBins: options.localBins ?? true,
    throws: options.throws ?? true,
  }

  return (strings, ...expressions) => new ShellCommand(bunShell(strings, ...expressions), settings)
}

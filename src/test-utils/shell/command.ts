import path from "node:path"

import bun from "bun"
import type { $ as BunShell } from "bun"

import { addBinDirs } from "#test-utils/shell/bin-dirs.ts"
import { removeNodeShims } from "#test-utils/shell/node-shim.ts"
import type { ShellEnv, ShellOptions, ShellResult } from "#test-utils/shell/shell.ts"

const FINAL_NEWLINE = /\r?\n$/v

const stripFinalNewline = (output: Buffer) => output.toString().replace(FINAL_NEWLINE, "")

/** Wraps Bun's `ShellPromise` to apply its settings when it runs and return its output as strings. */
export class ShellCommand implements PromiseLike<ShellResult> {
  readonly #shellPromise: BunShell.ShellPromise
  readonly #settings: Required<ShellOptions>
  #result: Promise<ShellResult> | undefined

  /** Starts from the shell's settings, which the command's own methods can then override. */
  public constructor(shellPromise: BunShell.ShellPromise, settings: Required<ShellOptions>) {
    this.#shellPromise = shellPromise
    // Copy `settings` so this command's changes don't reach the shell.
    this.#settings = { ...settings }
  }

  /** Change the working directory for the command. Relative paths resolve against `process.cwd()`. */
  public cwd(newCwd: string) {
    this.#settings.cwd = newCwd
    return this
  }

  /** Add environment variables for the command, on top of the shell's. Set one to `undefined` to remove it. */
  public env(newEnv: ShellEnv) {
    this.#settings.env = { ...this.#settings.env, ...newEnv }
    return this
  }

  /** Configure whether the command puts `node_modules/.bin` of its cwd and each of its parents first on `PATH`. */
  public localBins(useLocalBins: boolean) {
    this.#settings.localBins = useLocalBins
    return this
  }

  /** Configure the command to not throw an exception on a non-zero exit code. */
  public nothrow() {
    this.#settings.throws = false
    return this
  }

  // oxlint-disable-next-line unicorn/no-thenable - awaiting a command runs it, like Bun's `ShellPromise`
  public async then<TResult1 = ShellResult, TResult2 = never>(
    onfulfilled?: ((value: ShellResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    // Keep the first run because Bun rejects settings on a command that already started.
    this.#result ??= this.#run()
    return this.#result.then(onfulfilled, onrejected)
  }

  async #run(): Promise<ShellResult> {
    const { env, localBins, throws } = this.#settings
    const cwd = path.resolve(this.#settings.cwd)
    const envWithBins = localBins ? addBinDirs(cwd, env) : env
    const finalEnv = removeNodeShims(envWithBins)

    const output = await this.#shellPromise
      .cwd(cwd)
      .env(finalEnv)
      .quiet()
      .throws(throws)
      .catch((error: unknown) => {
        if (error instanceof bun.$.ShellError) throw error
        // Name the cwd because Bun's start errors (like a missing cwd) don't.
        throw new Error(`Command failed to start (cwd: ${cwd})`, { cause: error })
      })

    return {
      stdout: stripFinalNewline(output.stdout),
      stderr: stripFinalNewline(output.stderr),
      exitCode: output.exitCode,
    }
  }
}

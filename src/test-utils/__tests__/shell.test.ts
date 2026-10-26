import { beforeAll, describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import bun from "bun"

import { minimalEnv } from "#test-utils/shell/env.ts"
import { createShell } from "#test-utils/shell/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

const SHELL_MODULE = path.join(import.meta.dir, "../shell/shell.ts")

// Compare real paths because macOS temp dirs sit behind the `/var` -> `/private/var` symlink.
const realpath = (dir: string) => fs.realpathSync(dir)

const catchShellError = async (promise: PromiseLike<unknown>) => {
  try {
    await promise
  } catch (error) {
    if (error instanceof bun.$.ShellError) return error
    throw error
  }
  throw new Error("Expected the command to throw")
}

const writeBin = async (dir: string, name: string, output: string) => {
  const binPath = path.join(dir, "node_modules/.bin", name)
  await bun.write(binPath, `#!/bin/sh\necho ${output}\n`)
  await fs.promises.chmod(binPath, 0o755)
}

describe("createShell", () => {
  const run = createShell()
  let dir = ""
  let child = ""

  beforeAll(async () => {
    dir = await makeTempDir("configs-shell-")
    child = path.join(dir, "child")
    await writeBin(dir, "parent-tool", "parent")
    await writeBin(child, "child-tool", "child")
  })

  it("returns stdout, stderr, and the exit code", async () => {
    expect(await run`sh -c ${"echo out; echo err >&2"}`).toEqual({ stdout: "out", stderr: "err", exitCode: 0 })
  })

  it("strips only one trailing newline", async () => {
    expect((await run`printf ${"a\n\n"}`).stdout).toBe("a\n")
    expect((await run`printf ${"b\r\n"}`).stdout).toBe("b")
  })

  it("throws Bun's ShellError with the exit code and output", async () => {
    const error = await catchShellError(run`sh -c ${"echo o; echo e >&2; exit 3"}`)

    expect(error.exitCode).toBe(3)
    expect(error.stdout.toString()).toBe("o\n")
    expect(error.stderr.toString()).toBe("e\n")
  })

  it("returns the exit code with nothrow()", async () => {
    expect((await run`sh -c ${"exit 4"}`.nothrow()).exitCode).toBe(4)
  })

  it("returns the exit code with throws: false", async () => {
    expect((await createShell({ throws: false })`sh -c ${"exit 4"}`).exitCode).toBe(4)
  })

  it("keeps an interpolated value with spaces as one argument", async () => {
    expect((await run`printf %s, ${"a b"}`).stdout).toBe("a b,")
    expect((await run`printf %s, ${["a", "b"]}`).stdout).toBe("a,b,")
  })

  it("puts Bun's not-found message in stderr for a missing command", async () => {
    const error = await catchShellError(run`configs-missing-command-xyz`)

    expect(error.stderr.toString()).toBe("bun: command not found: configs-missing-command-xyz\n")
  })

  it("runs in the given cwd", async () => {
    const { stdout } = await createShell({ cwd: dir })`pwd`

    expect(realpath(stdout)).toBe(realpath(dir))
  })

  it("resolves a relative cwd against process.cwd()", async () => {
    const { stdout } = await createShell({ cwd: "src" })`pwd`

    expect(realpath(stdout)).toBe(realpath(path.resolve("src")))
  })

  it("replaces the environment with env", async () => {
    const { stdout } = await createShell({ env: { ONLY: "1" }, localBins: false })`echo $ONLY-$HOME`

    expect(stdout).toBe("1-")
  })

  it("uses process.env when env is omitted", async () => {
    expect((await run`echo $HOME`).stdout).toBe(os.homedir())
  })

  it("puts local bins of the cwd and its parents first on PATH", async () => {
    const childRun = createShell({ cwd: child })

    expect((await childRun`child-tool`).stdout).toBe("child")
    expect((await childRun`parent-tool`).stdout).toBe("parent")
    expect((await childRun`echo $PATH`).stdout.startsWith(`${child}/node_modules/.bin:${dir}/node_modules/.bin:`)).toBe(
      true,
    )
  })

  it("skips local bins with localBins(false)", async () => {
    const { exitCode } = await createShell({ cwd: child })`child-tool`.localBins(false).nothrow()

    expect(exitCode).not.toBe(0)
  })

  it("finds local bins when env has no PATH", async () => {
    const noPathRun = createShell({ cwd: dir, env: {} })

    expect((await noPathRun`parent-tool`).stdout).toBe("parent")
    expect((await noPathRun`echo $PATH`).stdout).not.toContain("undefined")
  })

  it("doesn't put the cwd on PATH when env has an empty PATH", async () => {
    const { stdout } = await createShell({ cwd: dir, env: { PATH: "" } })`echo $PATH`

    expect(stdout.endsWith(path.delimiter)).toBe(false)
  })

  it("removes node shims from PATH", async () => {
    const baskShim = await makeTempDir("bask-node-")
    const bunShim = await makeTempDir("bun-node-")
    const shimEnv = { PATH: [baskShim, bunShim, process.env["PATH"]].join(path.delimiter) }

    expect((await createShell({ env: shimEnv })`echo $PATH`).stdout).not.toContain("-node-")
    expect((await createShell({ env: shimEnv, localBins: false })`echo $PATH`).stdout).not.toContain("-node-")
  })

  it("drops FORCE_COLOR from the inherited env", async () => {
    // Run a separate process because changing this process's env would reach the concurrent tests.
    // Print strings because the child's `console.log` colors numbers when `FORCE_COLOR` is set.
    const script = path.join(dir, "force-color.ts")
    await bun.write(
      script,
      [
        `import { createShell } from ${JSON.stringify(SHELL_MODULE)}`,
        "const run = createShell({ throws: false })",
        "console.log(String((await run`printenv FORCE_COLOR`).exitCode))",
        'console.log(String((await run`printenv FORCE_COLOR`.env({ A: "1" })).exitCode))',
      ].join("\n"),
    )

    const { stdout } = await createShell({ env: { ...process.env, FORCE_COLOR: "1" } })`bun ${script}`

    expect(stdout).toBe("1\n1")
  })

  it("keeps FORCE_COLOR from an explicit env", async () => {
    expect((await createShell({ env: minimalEnv({ FORCE_COLOR: "1" }) })`printenv FORCE_COLOR`).stdout).toBe("1")
  })

  it("recomputes local bins when a command changes its cwd", async () => {
    expect((await createShell({ cwd: dir })`child-tool`.cwd(child)).stdout).toBe("child")
  })

  it("merges a command's env over the shell's env", async () => {
    const envRun = createShell({ env: { A: "1" }, localBins: false })

    expect((await envRun`echo $A-$B`.env({ B: "2" })).stdout).toBe("1-2")
  })

  it("names the cwd when a command can't start", async () => {
    const missing = path.join(dir, "missing")

    const error = await createShell({ cwd: missing })`pwd`.then(
      () => new Error("Expected the command to throw"),
      (startError: unknown) => startError,
    )

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).toContain(`Command failed to start (cwd: ${missing})`)
  })

  it("doesn't change the shell when a command changes its settings", async () => {
    const base = createShell({ cwd: dir })
    const changed = base`pwd`.cwd(os.tmpdir()).nothrow()

    expect(realpath((await base`pwd`).stdout)).toBe(realpath(dir))
    expect((await catchShellError(base`sh -c ${"exit 1"}`)).exitCode).toBe(1)
    expect(realpath((await changed).stdout)).toBe(realpath(os.tmpdir()))
  })

  it("runs a command once when it's awaited twice", async () => {
    const log = path.join(dir, "runs.log")
    const command = run`sh -c ${`echo run >> ${log}`}`

    await command
    await command

    expect(await bun.file(log).text()).toBe("run\n")
  })
})

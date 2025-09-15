#!/usr/bin/env bun

import path from "node:path"
import process from "node:process"

/*
 * The only way to pass our preprocessor to Knip is to use the `--preprocessor` flag.
 * Rather than forcing all consuming projects to specify the flag and path to the preprocessor, they can run `adamhl-knip` instead.
 */

const baseKnipPreprocessorPath = `${path.resolve(import.meta.dir, "../knip-preprocessor")}`
// need to handle calling this from the configs project itself vs. a consuming project
const knipPreprocessorPathExt = (await Bun.file(`${baseKnipPreprocessorPath}.ts`).exists()) ? ".ts" : ".js"
const knipPreprocessorPath = `${baseKnipPreprocessorPath}${knipPreprocessorPathExt}`

const result = Bun.spawnSync({
  cmd: ["knip-bun", "--preprocessor", knipPreprocessorPath, ...process.argv.slice(2)],
  stdout: "inherit",
  stderr: "inherit",
})
process.exitCode = result.exitCode

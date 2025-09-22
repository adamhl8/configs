#!/usr/bin/env bun

import path from "node:path"
import process from "node:process"

/*
 * The only way to pass our preprocessor to Knip is to use the `--preprocessor` flag.
 * Rather than forcing all consuming projects to specify the flag and path to the preprocessor, they can run `adamhl8-knip` instead.
 */

const KNIP_PREPROCESSOR_PATH = `${path.resolve(import.meta.dir, "../configs/knip-preprocessor")}`

// need to handle calling this from the configs project itself vs. a consuming project
const knipPreprocessorPathExt = (await Bun.file(`${KNIP_PREPROCESSOR_PATH}.ts`).exists()) ? ".ts" : ".js"
const knipPreprocessorPath = `${KNIP_PREPROCESSOR_PATH}${knipPreprocessorPathExt}`

const result = Bun.spawnSync({
  cmd: ["knip-bun", "--preprocessor", knipPreprocessorPath, ...process.argv.slice(2)],
  stdout: "inherit",
  stderr: "inherit",
})
process.exitCode = result.exitCode

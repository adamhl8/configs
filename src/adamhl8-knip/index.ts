#!/usr/bin/env nub

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"

/*
 * The only way to pass our preprocessor to Knip is to use the `--preprocessor` flag.
 * Rather than forcing all consuming projects to specify the flag and path to the preprocessor, they can run `adamhl8-knip` instead.
 */

const KNIP_PREPROCESSOR_PATH = path.resolve(import.meta.dirname, "./knip-preprocessor")

// Need to handle calling this from the configs project itself vs. a consuming project
const knipPreprocessorPathExt = existsSync(`${KNIP_PREPROCESSOR_PATH}.ts`) ? ".ts" : ".js"
const knipPreprocessorPath = `${KNIP_PREPROCESSOR_PATH}${knipPreprocessorPathExt}`

const ARGV_START_INDEX = 2

const result = spawnSync(
  "knip", // It's assumed that this script will be executed via package manager (e.g. `nub exec adamhl8-knip`) and so `node_modules` will be added to the PATH
  ["--preprocessor", knipPreprocessorPath, ...process.argv.slice(ARGV_START_INDEX)],
  {
    stdio: "inherit",
  },
)

process.exitCode = result.status

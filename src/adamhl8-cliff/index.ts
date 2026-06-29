#!/usr/bin/env nub

import { spawnSync } from "node:child_process"
import path from "node:path"
import process from "node:process"

const CLIFF_CONFIG_PATH = path.resolve(import.meta.dirname, "../configs/cliff.base.toml")

const ARGV_START_INDEX = 2

const result = spawnSync("git-cliff", ["--config", CLIFF_CONFIG_PATH, ...process.argv.slice(ARGV_START_INDEX)], {
  stdio: "inherit",
})

process.exitCode = result.status

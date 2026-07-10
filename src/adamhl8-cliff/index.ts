#!/usr/bin/env bun

import path from "node:path"

import { spawnSync } from "bun"

const CLIFF_CONFIG_PATH = path.resolve(import.meta.dir, "../configs/cliff.base.toml")

const result = spawnSync(["git-cliff", "--config", CLIFF_CONFIG_PATH, ...process.argv.slice(2)], {
  stdio: ["inherit", "inherit", "inherit"],
})

process.exitCode = result.exitCode

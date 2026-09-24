#!/usr/bin/env bun

import bun from "bun"
import { merge, isPlainObject } from "es-toolkit"

import { configFilePath } from "#utils.ts"

const BUNFIG_BASE_PATH = configFilePath("bunfig.base.toml")
const BUNFIG_PROJECT_PATH = "bunfig.toml"

/** Parses a TOML file, returning an empty table when the file is missing or isn't a table. */
const readToml = async (filePath: string): Promise<Record<string, unknown>> => {
  const file = bun.file(filePath)
  if (!(await file.exists())) return {}
  const parsed = bun.TOML.parse(await file.text())
  return isPlainObject(parsed) ? parsed : {}
}

const baseBunfig = await readToml(BUNFIG_BASE_PATH)
const projectBunfig = await readToml(BUNFIG_PROJECT_PATH)
const mergedConfig = merge(baseBunfig, projectBunfig)
const mergedConfigToml = bun.TOML.stringify(mergedConfig) ?? ""

await bun.write(BUNFIG_PROJECT_PATH, mergedConfigToml)

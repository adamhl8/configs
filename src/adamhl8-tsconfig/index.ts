#!/usr/bin/env bun

import bun from "bun"

import { readProjectPackageJson } from "#utils.ts"

const TSCONFIG_PATH = "tsconfig.json"
const DTS_CONFIG = "@adamhl8/configs/tsconfig"
const NO_DTS_CONFIG = "@adamhl8/configs/tsconfig/no-dts"
// Match only the two managed configs, so a project opts out by extending anything else.
const MANAGED_EXTENDS = /(?<key>"extends"\s*:\s*)"@adamhl8\/configs\/tsconfig(?:\/no-dts)?"/v

const tsconfigFile = bun.file(TSCONFIG_PATH)

if (await tsconfigFile.exists()) {
  const { publishesTypes } = readProjectPackageJson()
  const config = publishesTypes ? DTS_CONFIG : NO_DTS_CONFIG
  const current = await tsconfigFile.text()
  // Replace the text instead of parsing the file so comments, formatting, and other options survive.
  const updated = current.replace(MANAGED_EXTENDS, `$<key>"${config}"`)
  if (updated !== current) await bun.write(TSCONFIG_PATH, updated)
}

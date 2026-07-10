#!/usr/bin/env bun

import path from "node:path"

import bun from "bun"
import { merge, isPlainObject } from "es-toolkit"
import { stringify } from "smol-toml"
import { objectHasOwn } from "ts-extras"

const BUNFIG_BASE_PATH = path.resolve(import.meta.dir, "../configs/bunfig.base.toml")
const BUNFIG_PROJECT_PATH = path.resolve("./bunfig.toml")

const baseBunfigImport = (await import(BUNFIG_BASE_PATH, { with: { type: "toml" } })) as unknown
const projectBunfigImport = (await bun.file(BUNFIG_PROJECT_PATH).exists())
  ? ((await import(BUNFIG_PROJECT_PATH, { with: { type: "toml" } })) as unknown)
  : undefined

const isTomlImport = (tomlImport: unknown): tomlImport is { default: Record<string, unknown> } =>
  typeof tomlImport === "object" && objectHasOwn(tomlImport, "default") && isPlainObject(tomlImport.default)

const baseBunfig = isTomlImport(baseBunfigImport) ? baseBunfigImport.default : {}
const projectBunfig = isTomlImport(projectBunfigImport) ? projectBunfigImport.default : {}

const mergedConfig = merge(baseBunfig, projectBunfig)
const mergedConfigToml = stringify(mergedConfig)

await bun.write(BUNFIG_PROJECT_PATH, mergedConfigToml)

#!/usr/bin/env node

import fs from "node:fs/promises"
import process from "node:process"
import pc from "picocolors"
import type { CtxError } from "ts-explicit-errors"
import { isErr } from "ts-explicit-errors"

import { cli } from "./cli.ts"
import { checkExports } from "./export-check.ts"
import { fixImports } from "./import-fix.ts"

const FILES_GLOB = "**/*.{ts,tsx,js,jsx,astro}"
const BASE_IGNORE_PATTERNS = [".git/", "node_modules/", "dist/"]

async function tsImportFix(): Promise<CtxError[]> {
  const { fileIgnorePatterns, ...fixImportsOptions } = cli()

  const errors: CtxError[] = []

  const allFileIgnorePatterns = [...BASE_IGNORE_PATTERNS, "astro.config.ts", ...fileIgnorePatterns]
  const filePaths = await Array.fromAsync(fs.glob(FILES_GLOB, { exclude: allFileIgnorePatterns }))

  const fixImportsResult = await fixImports(filePaths, fixImportsOptions)
  if (isErr(fixImportsResult)) errors.push(fixImportsResult)

  const checkExportsResult = await checkExports(filePaths)
  if (isErr(checkExportsResult)) errors.push(checkExportsResult)

  return errors
}

async function main(): Promise<number> {
  const errors = await tsImportFix()

  if (errors.length === 0) {
    console.log(`${pc.greenBright("[ts-import-fix]")} Done`)
    return 0
  }

  const errorMessage = errors.map((error) => `${pc.redBright("[ts-import-fix]")} ${error.messageChain}`).join("\n\n")
  process.stderr.write(`${errorMessage}\n`)

  return 1
}

if (import.meta.main) process.exitCode = await main()

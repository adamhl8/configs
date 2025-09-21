#!/usr/bin/env node

import fss from "node:fs"
import fs from "node:fs/promises"
import path, { type ParsedPath } from "node:path"
import process from "node:process"
import { message, multiple, object, option, string } from "@optique/core"
import { run } from "@optique/run"
import { getTsconfig } from "get-tsconfig"
import pc from "picocolors"
import type { Result } from "ts-explicit-errors"
import { attempt, err, isErr } from "ts-explicit-errors"

const IMPORT_PATTERN = /(?:import|from)\s+['"]([^'"]+)['"]$/gm
const FILES_GLOB = "**/*.{ts,tsx,js,jsx,astro}"

/**
 * Collect all transform errors so we can log them at the end of the output.
 */
const TRANSFORM_ERRORS: string[] = []

async function cli() {
  const options = object({
    write: option("-w", "--write", {
      description: message`Write changes to files`,
    }),
    fileIgnorePatterns: multiple(
      option("-f", "--file-ignore", string({ metavar: "PATTERN" }), {
        description: message`Additional glob patterns for files to ignore`,
      }),
    ),
    importIgnoreStrings: multiple(
      option("-i", "--import-ignore", string(), {
        description: message`An import path *containing* the given string will be ignored`,
      }),
    ),
  })
  const parseResult = run(options, {
    programName: "ts-import-fix",
    help: "option",
    showDefault: { prefix: " [default: " },
  })

  const exclude = ["node_modules/", "dist/", "astro.config.ts", ...parseResult.fileIgnorePatterns] as const

  const filePaths = await Array.fromAsync(fs.glob(FILES_GLOB, { exclude }))

  return { parseResult, filePaths }
}

type PathsMap = Record<string, string>

function getPathsMap(): Result<PathsMap> {
  const tsconfig = getTsconfig()
  if (!tsconfig) return err("failed to load tsconfig", undefined)

  const pathsMap: PathsMap = {}

  for (let [alias, [aliasDir]] of Object.entries(tsconfig.config.compilerOptions?.paths ?? {})) {
    if (!alias.endsWith("/*")) continue
    if (!aliasDir?.endsWith("/*")) continue

    aliasDir = aliasDir.slice(0, -2)
    alias = alias.slice(0, -2)

    pathsMap[alias] = aliasDir
  }

  return pathsMap
}

function changeExtension(parsedPath: ParsedPath, newExtension: string): ParsedPath {
  return {
    ...parsedPath,
    ext: newExtension,
    base: "", // base has to be set to empty string or else it will ignore `ext`
  }
}

function transformExtension(filePath: string): string {
  const pathParts = path.parse(filePath)
  if (!(pathParts.ext === ".js" || pathParts.ext === "")) return filePath

  return path.format(changeExtension(pathParts, ".ts"))
}

function transformRelativeImport(filePath: string, importPath: string, pathsMap: PathsMap) {
  const currentDir = path.dirname(filePath)
  const absoluteImportPath = path.resolve(currentDir, importPath)

  const targetFileExists = fss.existsSync(absoluteImportPath)
  if (!targetFileExists) {
    TRANSFORM_ERRORS.push(`❌ (${filePath}) skipped transform of '${importPath}': target file does not exist`)
    return importPath
  }

  for (const [alias, aliasDir] of Object.entries(pathsMap)) {
    const relativeToAliasDir = path.relative(aliasDir, absoluteImportPath)
    // If 'relativeToAliasDir' starts with "..", the import is not in the alias directory so we should try the next alias
    if (relativeToAliasDir.startsWith("..")) continue

    return `${alias}/${relativeToAliasDir}`
  }

  TRANSFORM_ERRORS.push(`❌ (${filePath}) could not find alias for '${importPath}'`)
  return
}

async function tsImportFix(): Promise<Result<number>> {
  const { filePaths, parseResult } = await cli()
  const { write, importIgnoreStrings } = parseResult

  const pathsMap = getPathsMap()
  if (isErr(pathsMap)) return pathsMap

  const importFixResult = await attempt(() => {
    const filePromises = filePaths.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8")

      const transformedContent = content.replace(IMPORT_PATTERN, (match, importPath: string) => {
        const isRelativeImport = importPath.startsWith("./") || importPath.startsWith("../")
        const isAliasImport = Object.keys(pathsMap).some((alias) => importPath.startsWith(alias))

        if (!(isRelativeImport || isAliasImport)) return match

        const isIgnored = importIgnoreStrings.some((ignoreString) => importPath.includes(ignoreString))
        if (isIgnored) return match

        let newImportPath = transformExtension(importPath)

        if (isRelativeImport)
          newImportPath = transformRelativeImport(filePath, newImportPath, pathsMap) ?? newImportPath

        if (newImportPath === importPath) return match

        const { ext: originalExt } = path.parse(importPath)
        const newPathParts = path.parse(newImportPath)
        const { ext: newExt } = newPathParts

        let newImportPathString = newImportPath
        if (newExt !== originalExt) {
          const newPathWithoutExt = path.format(changeExtension(newPathParts, ""))
          newImportPathString = `${newPathWithoutExt}${pc.greenBright(newExt)}`
        }

        console.log(`✅ (${filePath}) '${importPath}' -> '${newImportPathString}'`)
        return match.replace(importPath, newImportPath)
      })

      if (transformedContent === content) return

      if (write) await fs.writeFile(filePath, transformedContent)
    })

    return Promise.all(filePromises)
  })

  let exitCode = 0
  if (TRANSFORM_ERRORS.length > 0) {
    console.error(TRANSFORM_ERRORS.join("\n"))
    exitCode = 1
  }

  if (isErr(importFixResult)) return err("something went wrong when transforming imports", importFixResult)

  return exitCode
}

async function main(): Promise<number> {
  const result = await tsImportFix()
  if (isErr(result)) {
    console.error(pc.redBright(`ts-import-fix: ${result.messageChain}`))
    return 1
  }

  return result
}

if (import.meta.main) process.exitCode = await main()

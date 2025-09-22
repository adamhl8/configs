import fss from "node:fs"
import fs from "node:fs/promises"
import path, { type ParsedPath } from "node:path"
import { getTsconfig } from "get-tsconfig"
import pc from "picocolors"
import type { Result } from "ts-explicit-errors"
import { attempt, err, isErr } from "ts-explicit-errors"

const IMPORT_PATTERN = /(?:import|from)\s+['"]([^'"]+)['"]$/gm

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

function transformRelativeImport(filePath: string, importPath: string, pathsMap: PathsMap): Result<string> {
  const currentDir = path.dirname(filePath)
  const absoluteImportPath = path.resolve(currentDir, importPath)

  const targetFileExists = fss.existsSync(absoluteImportPath)
  if (!targetFileExists) return err(`skipped transform of '${importPath}': target file does not exist`, undefined)

  for (const [alias, aliasDir] of Object.entries(pathsMap)) {
    const relativeToAliasDir = path.relative(aliasDir, absoluteImportPath)
    // If 'relativeToAliasDir' starts with "..", the import is not in the alias directory so we should try the next alias
    if (relativeToAliasDir.startsWith("..")) continue

    return `${alias}/${relativeToAliasDir}`
  }

  return err(`could not find alias for '${importPath}'`, undefined)
}

interface FixImportsOptions {
  write: boolean
  importIgnoreStrings: readonly string[]
  skipAlias: boolean
}

export async function fixImports(
  filePaths: string[],
  { write, importIgnoreStrings, skipAlias }: FixImportsOptions,
): Promise<Result> {
  const IMPORT_ERRORS: string[] = []
  const TRANSFORMED_IMPORTS: string[] = []

  const pathsMap = getPathsMap()
  if (isErr(pathsMap)) return pathsMap

  const importFixResult = await attempt(() => {
    const filePromises = filePaths.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8")

      const importErrorsForFile: string[] = []
      const transformedImportsForFile: string[] = []

      const transformedContent = content.replace(IMPORT_PATTERN, (match, importPath: string) => {
        const isRelativeImport = importPath.startsWith("./") || importPath.startsWith("../")
        const isAliasImport = Object.keys(pathsMap).some((alias) => importPath.startsWith(alias))

        if (!(isRelativeImport || isAliasImport)) return match

        const isIgnored = importIgnoreStrings.some((ignoreString) => importPath.includes(ignoreString))
        if (isIgnored) return match

        let newImportPath = transformExtension(importPath)

        if (isRelativeImport && !skipAlias) {
          const transformedRelativeImport = transformRelativeImport(filePath, newImportPath, pathsMap)
          if (isErr(transformedRelativeImport)) importErrorsForFile.push(transformedRelativeImport.messageChain)
          else newImportPath = transformedRelativeImport
        }

        if (newImportPath === importPath) return match

        const { ext: originalExt } = path.parse(importPath)
        const newPathParts = path.parse(newImportPath)
        const { ext: newExt } = newPathParts

        let newImportPathString = newImportPath
        if (newExt !== originalExt) {
          const newPathWithoutExt = path.format(changeExtension(newPathParts, ""))
          newImportPathString = `${newPathWithoutExt}${pc.greenBright(newExt)}`
        }

        transformedImportsForFile.push(`'${importPath}' -> '${newImportPathString}'`)
        return match.replace(importPath, newImportPath)
      })

      if (importErrorsForFile.length > 0)
        IMPORT_ERRORS.push(`${pc.redBright("✗")} ${filePath}\n${importErrorsForFile.join("\n")}\n`)

      if (transformedImportsForFile.length > 0)
        TRANSFORMED_IMPORTS.push(`${pc.greenBright("✓")} ${filePath}\n${transformedImportsForFile.join("\n")}\n`)

      if (transformedContent === content) return

      if (write) await fs.writeFile(filePath, transformedContent)
    })

    return Promise.all(filePromises)
  })

  if (TRANSFORMED_IMPORTS.length > 0)
    console.log(`${pc.greenBright("[ts-import-fix]")} transformed imports:\n${TRANSFORMED_IMPORTS.join("\n")}`)

  if (isErr(importFixResult)) return err("something went wrong when transforming imports", importFixResult)
  if (IMPORT_ERRORS.length > 0) return err(`failed to transform some imports:\n${IMPORT_ERRORS.join("\n")}`, undefined)

  return
}

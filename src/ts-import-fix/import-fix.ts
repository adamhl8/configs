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

    alias = alias.slice(0, -1)
    aliasDir = aliasDir.slice(0, -1)

    pathsMap[alias] = aliasDir
  }

  return pathsMap
}

function resolveImportPath(importPath: string, filePath: string, pathsMap: PathsMap) {
  const fileDir = path.dirname(filePath)

  // sort by length so most specific aliases are checked first
  const sortedAliases = Object.keys(pathsMap).sort((a, b) => b.length - a.length)

  // handle alias imports
  for (const alias of sortedAliases) {
    if (!importPath.startsWith(alias)) continue

    const aliasDir = pathsMap[alias]
    if (!aliasDir) continue
    const relativePath = importPath.slice(alias.length)
    return path.resolve(aliasDir, relativePath)
  }

  // handle relative imports
  return path.resolve(fileDir, importPath)
}

function changeExtension(importParts: ParsedPath, newExtension: string): ParsedPath {
  return {
    ...importParts,
    ext: newExtension,
    base: "", // `base` has to be set to empty string or else it will ignore `ext` in favor of the extension on `base`
  }
}

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".d.ts"]

function getNewExtensionPathParts(importParts: ParsedPath): { ext: string; base: string } | undefined {
  // https://www.typescriptlang.org/docs/handbook/modules/reference.html#file-extension-substitution
  // Any of these extensions will resolve to the actual file. For example, consider `import { foo } from "./bar.js"`. The actual extension of the file doesn't have to be `.js`. TypeScript will try each extension until it finds the file.
  const tsExtensionLookups = ["", ".js", ".jsx", ".ts", ".tsx"]

  // if the extension is something else (e.g. .json, .css, .md), return extension as-is
  if (!tsExtensionLookups.includes(importParts.ext))
    return {
      ext: importParts.ext,
      base: importParts.base,
    }

  if (tsExtensionLookups.includes(importParts.ext)) {
    for (const allowedExtension of ALLOWED_EXTENSIONS) {
      const targetPathParts = changeExtension(importParts, allowedExtension)
      const targetPath = path.format(targetPathParts)
      if (fss.existsSync(targetPath))
        return {
          ext: targetPathParts.ext,
          base: targetPathParts.base,
        }
    }
  }

  return
}

function getAliasPathParts(importParts: ParsedPath, pathsMap: PathsMap): { dir: string } | undefined {
  const importPath = path.format(importParts)

  for (const [alias, aliasDir] of Object.entries(pathsMap)) {
    const relativeToAliasDir = path.relative(aliasDir, importPath)
    // If 'relativeToAliasDir' starts with "..", the import is not in the alias directory so we should try the next alias
    if (relativeToAliasDir.startsWith("..")) continue

    const aliasImportParts = path.parse(`${alias}${relativeToAliasDir}`)
    return { dir: aliasImportParts.dir }
  }

  return
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

        let newImportParts = path.parse(importPath)

        /** The absolute path to the import. Used in the transform functions. */
        const resolvedImportPath = resolveImportPath(importPath, filePath, pathsMap)
        const resolvedImportParts = path.parse(resolvedImportPath)

        const transformExtensionResult = getNewExtensionPathParts(resolvedImportParts)
        if (transformExtensionResult) newImportParts = { ...newImportParts, ...transformExtensionResult }
        else {
          const targetFilePath = `${path.format(changeExtension(resolvedImportParts, ""))}.{${ALLOWED_EXTENSIONS.map((ext) => ext.replace(".", "")).join()}}`
          importErrorsForFile.push(
            `skipped extension transform of '${importPath}': target file not found (looking for '${targetFilePath}')`,
          )
        }

        if (isRelativeImport && !skipAlias) {
          const transformToAliasImportResult = getAliasPathParts(resolvedImportParts, pathsMap)
          if (transformToAliasImportResult) newImportParts = { ...newImportParts, ...transformToAliasImportResult }
          else
            importErrorsForFile.push(
              `skipped transforming relative import path '${importPath}': could not find appropriate alias`,
            )
        }

        const newImportPath = path.format(newImportParts)

        if (newImportPath === importPath) return match

        const { ext: originalExt } = path.parse(importPath)
        const { ext: newExt } = newImportParts
        let newImportPathString = newImportPath
        if (newExt !== originalExt) {
          const newPathWithoutExt = path.format(changeExtension(newImportParts, ""))
          newImportPathString = `${newPathWithoutExt}${pc.greenBright(newExt)}`
        }

        transformedImportsForFile.push(`'${importPath}' -> '${newImportPathString}'`)
        return match.replace(importPath, newImportPath)
      })

      if (importErrorsForFile.length > 0)
        IMPORT_ERRORS.push(`${pc.redBright("✗")} ${pc.blue(filePath)}\n${importErrorsForFile.join("\n")}\n`)

      if (transformedImportsForFile.length > 0)
        TRANSFORMED_IMPORTS.push(
          `${pc.greenBright("✓")} ${pc.blue(filePath)}\n${transformedImportsForFile.join("\n")}\n`,
        )

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

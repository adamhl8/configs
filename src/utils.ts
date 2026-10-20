import { existsSync, globSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { isPlainObject } from "es-toolkit/predicate"

// Check both folders because a bin bundles this file into `<bin>/index`, one level below `configs`.
const CONFIG_DIRS = ["./configs/", "../configs/"] as const

/** Returns the absolute path of a file in this package's `configs` folder. */
export const configFilePath = (name: string) => {
  const filePaths = CONFIG_DIRS.map((dir) => fileURLToPath(new URL(`${dir}${name}`, import.meta.url)))
  const filePath = filePaths.find((candidate) => existsSync(candidate))
  if (!filePath) throw new Error(`Couldn't find config file "${name}" in:\n${filePaths.join("\n")}`)
  return filePath
}

/** Returns the absolute path of a package's entry file, resolved from this package's dependencies. */
export const resolvePackagePath = (specifier: string) => fileURLToPath(import.meta.resolve(specifier))

/** Checks whether the project's `package.json` lists `tailwindcss` as a dependency. */
const dependsOnTailwind = () => {
  if (!existsSync("package.json")) return false

  const packageJson: unknown = JSON.parse(readFileSync("package.json", "utf8"))
  if (!isPlainObject(packageJson)) return false

  for (const field of ["dependencies", "devDependencies"]) {
    const deps: unknown = packageJson[field]
    if (isPlainObject(deps) && "tailwindcss" in deps) return true
  }

  return false
}

// Match entry stylesheets the same way `@tailwindcss/language-server` does.
const TAILWIND_IMPORT = /@import\s*["']tailwindcss(?:\/[^"']+)?["']/v

/**
 * Returns the project's Tailwind stylesheet relative to the project root, or `false` when the project doesn't use
 * Tailwind. The stylesheet is the first CSS file, in sorted order, that imports `tailwindcss`.
 */
export const resolveProjectTailwind = () => {
  if (!dependsOnTailwind()) return false

  const stylesheets = globSync("**/*.{css,scss,sass,less,pcss}", {
    exclude: (filePath) => ["node_modules", ".git"].includes(path.basename(filePath)),
  }).toSorted()

  return stylesheets.find((file) => TAILWIND_IMPORT.test(readFileSync(file, "utf8"))) ?? false
}

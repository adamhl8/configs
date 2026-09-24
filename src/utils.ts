import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

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

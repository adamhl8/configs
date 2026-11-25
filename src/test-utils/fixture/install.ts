import fs from "node:fs/promises"
import path from "node:path"

import bun from "bun"

import { packPackage } from "#test-utils/pack.ts"
import { createShell } from "#test-utils/shell.ts"
import { makeTempDir } from "#test-utils/temp-dir.ts"

const installDirs = new Map<string, Promise<string>>()

const buildInstallDir = async (packageRoot: string) => {
  const tarball = await packPackage(packageRoot)
  const installDir = await makeTempDir()
  await bun.write(path.join(installDir, "package.json"), "{}")
  // Set the linker because `installPackage` relies on its layout.
  await createShell({ cwd: installDir })`bun add --linker=isolated ${tarball}`
  // Make the bin dir because a package with no bins doesn't get one.
  await fs.mkdir(path.join(installDir, "node_modules/.bin"), { recursive: true })
  return installDir
}

/** Installs the package at `packageRoot` in a temp dir, once for each resolved root, and returns the dir. */
const getInstallDir = async (packageRoot: string) => {
  const resolvedRoot = path.resolve(packageRoot)
  const existingInstallDir = installDirs.get(resolvedRoot)
  if (existingInstallDir) return existingInstallDir

  // Cache the promise so concurrent callers share one install.
  const installDir = buildInstallDir(resolvedRoot)
  installDirs.set(resolvedRoot, installDir)
  return installDir
}

const readPackageName = async (packageRoot: string) => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - packing the package already failed if it has no name
  const { name } = (await bun.file(path.join(packageRoot, "package.json")).json()) as { name: string }
  return name
}

/**
 * Adds the package at `packageRoot` to `dir` from a shared install. `dir` gets its own copy of the package and its
 * bins, and the copy's `node_modules` links to the shared dependencies.
 */
export const installPackage = async (packageRoot: string, dir: string) => {
  const installDir = await getInstallDir(packageRoot)
  const packageName = await readPackageName(packageRoot)
  const sharedModules = path.join(installDir, "node_modules")
  const sharedPackageDir = await fs.realpath(path.join(sharedModules, packageName))
  // Go up once for each part of the name, because the isolated linker puts the dependencies beside the package.
  const sharedDependenciesDir = path.join(sharedPackageDir, ...packageName.split("/").map(() => ".."))

  const modules = path.join(dir, "node_modules")
  const packageDir = path.join(modules, packageName)
  await fs.cp(sharedPackageDir, packageDir, { recursive: true })
  await fs.symlink(sharedDependenciesDir, path.join(packageDir, "node_modules"))
  // Keep the bins' relative links so they point to the copy of the package.
  await fs.cp(path.join(sharedModules, ".bin"), path.join(modules, ".bin"), { recursive: true, verbatimSymlinks: true })
}

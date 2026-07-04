import type { KnipConfig } from "knip"

import { createMergeConfigFn } from "#/utils.ts"

export const IGNORE_BINARIES = ["lefthook", "gh"] as const satisfies string[]

/**
 * Consuming projects show these transitive dependencies as unlisted. e.g. knip resolves
 * `@adamhl8/eslint-plugin-clean-modules` via the oxlint config, but we don't need to install it directly in the
 * consuming project.
 */
const UNLISTED_DEPENDENCIES = ["@adamhl8/eslint-plugin-clean-modules"] as const satisfies string[]

const baseConfig = {
  project: ["**/*"],
  entry: ["./src/index.ts"],
  ignoreBinaries: IGNORE_BINARIES,
  ignoreDependencies: UNLISTED_DEPENDENCIES,
} as const satisfies KnipConfig

export const knipConfig = createMergeConfigFn<KnipConfig, typeof baseConfig>(baseConfig)

import type { KnipConfig } from "knip"

import { createMergeConfigFn } from "#utils.ts"

/** Knip sees `just` in the `prepare` script and the release-it hooks, but it isn't a package.json dependency */
const IGNORE_BINARIES = ["just"] as const satisfies string[]

/**
 * - Knip resolves `@adamhl8/eslint-plugin-clean-modules` via the oxlint config, but we don't need to install it directly
 *   in the consuming project, so it shows as unlisted
 */
const IGNORE_DEPENDENCIES = ["@adamhl8/eslint-plugin-clean-modules"] as const satisfies string[]

const baseConfig = {
  project: ["**/*"],
  // entry: ["**/*.test.ts"],
  ignoreBinaries: IGNORE_BINARIES,
  ignoreDependencies: IGNORE_DEPENDENCIES,
  bun: {
    entry: ["**/*.test.ts"],
  },
} as const satisfies KnipConfig

export const knipConfig = createMergeConfigFn<KnipConfig, typeof baseConfig>(baseConfig)

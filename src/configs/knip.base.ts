import type { KnipConfig } from "knip"

import { createMergeConfigFn } from "#/utils.ts"
import type { OptionalMergeConfigFn } from "#/utils.ts"

// Normally, specifying the `./src/index.ts` entry would cause knip to complain about a redundant entry because it gets automatically included via the tsdown plugin.
// However, in projects that _don't_ use tsdown, the `./src/index.ts` entry would be missing entirely.
// To handle this, we specify it and disable the tsdown plugin. This makes knip work in both cases.

export const DEFAULT_ENTRIES = ["./src/index.ts", "**/*.test.ts", "./tsdown.config.ts"] as const satisfies string[]

/**
 * Consuming projects show these transitive dependencies as unlisted. e.g. knip resolves
 * `@adamhl8/eslint-plugin-clean-modules` via the oxlint config, but we don't need to install it directly in the
 * consuming project.
 */
const UNLISTED_DEPENDENCIES = ["@adamhl8/eslint-plugin-clean-modules"]
/**
 * Consuming projects show these dependencies as unused. e.g. `@commitlint/cli` can't be found by knip because it's
 * hidden by the fact that we call/extend our GitHub workflows.
 */
const UNUSED_DEPENDENCIES = ["@commitlint/cli"]
export const IGNORE_DEPENDENCIES = [...UNUSED_DEPENDENCIES, ...UNLISTED_DEPENDENCIES]

const baseConfig = {
  project: ["**"],
  entry: DEFAULT_ENTRIES,
  ignoreBinaries: ["lefthook", "gh"],
  ignoreDependencies: IGNORE_DEPENDENCIES,
  tsdown: false,
} as const satisfies KnipConfig

export const knipConfig: OptionalMergeConfigFn<KnipConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

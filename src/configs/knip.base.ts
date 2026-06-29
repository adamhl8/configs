import type { KnipConfig } from "knip"

import type { OptionalMergeConfigFn } from "#/utils.ts"
import { createMergeConfigFn } from "#/utils.ts"

// Normally, specifying the `./src/index.ts` entry would cause knip to complain about a redundant entry because it gets automatically included via the tsdown plugin.
// However, in projects that _don't_ use tsdown, the `./src/index.ts` entry would be missing entirely.
// To handle this, we specify it and disable the tsdown plugin. This makes knip work in both cases.

export const DEFAULT_ENTRIES = ["./src/index.ts", "**/*.test.ts", "./tsdown.config.ts"] as const satisfies string[]
// In consuming projects, for some reason knip complains about these dependencies being unlisted.
export const IGNORE_DEPENDENCIES_UNLISTED = ["@commitlint/config-conventional"]

const baseConfig = {
  project: ["**"],
  entry: DEFAULT_ENTRIES,
  ignoreBinaries: ["lefthook"],
  ignoreDependencies: ["@commitlint/cli", ...IGNORE_DEPENDENCIES_UNLISTED],
  tsdown: false,
} as const satisfies KnipConfig

export const knipConfig: OptionalMergeConfigFn<KnipConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

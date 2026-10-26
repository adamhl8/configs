import type { KnipConfig } from "knip"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"

const baseConfig = {
  // Exclude fixtures with negated `project` globs because knip hints to remove an `ignore` glob that hides nothing.
  project: ["**/*", "!**/fixtures/**", "!**/fixture/**"],
  bun: {
    // List `bask.ts` because bask loads it by path and nothing imports it.
    // Add it here because a top-level `entry` replaces knip's default entries.
    entry: ["**/*.test.ts", "bask.ts"],
  },
} as const satisfies KnipConfig

export const knipConfig = createMergeConfigFn<KnipConfig, typeof baseConfig>(baseConfig)

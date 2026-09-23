import type { KnipConfig } from "knip"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"

/** Knip sees `just` in the `prepare` script and the release-it hooks, but it isn't a package.json dependency */
const IGNORE_BINARIES = ["just"] as const satisfies string[]

const baseConfig = {
  project: ["**/*"],
  ignoreBinaries: IGNORE_BINARIES,
  bun: {
    entry: ["**/*.test.ts"],
  },
} as const satisfies KnipConfig

export const knipConfig = createMergeConfigFn<KnipConfig, typeof baseConfig>(baseConfig)

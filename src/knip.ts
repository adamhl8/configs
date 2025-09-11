import { toMerged } from "es-toolkit"
import type { KnipConfig } from "knip"

// Normally, specifying the `./src/index.ts` entry would cause knip to complain about a redundant entry because it gets automatically included via the tsdown plugin.
// However, in projects that _don't_ use tsdown, the `./src/index.ts` entry would be missing entirely.
// To handle this, we specify it and disable the tsdown plugin. This makes knip work in both cases.

const baseConfig = {
  entry: ["./src/index.ts", "**/*.test.ts"],
  project: ["**"],
  tsdown: false,
  treatConfigHintsAsErrors: true,
} as const satisfies KnipConfig

export const knipConfig = <T extends KnipConfig>(config: T) => toMerged(baseConfig, config)

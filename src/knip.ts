import type { KnipConfig } from "knip"

// biome-ignore lint/plugin: ignore
import { createMergeConfigFn } from "./utils.ts"

// Normally, specifying the `./src/index.ts` entry would cause knip to complain about a redundant entry because it gets automatically included via the tsdown plugin.
// However, in projects that _don't_ use tsdown, the `./src/index.ts` entry would be missing entirely.
// To handle this, we specify it and disable the tsdown plugin. This makes knip work in both cases.

const baseConfig = {
  entry: ["./src/index.ts", "**/*.test.ts", "./tsdown.config.ts"],
  project: ["**"],
  tsdown: false,
} satisfies KnipConfig

export const knipConfig = createMergeConfigFn<KnipConfig, typeof baseConfig>(baseConfig)

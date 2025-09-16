import type { UserConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import type { MergeConfigFn } from "./utils.ts"
// biome-ignore lint/plugin: ignore
import { createMergeConfigFn } from "./utils.ts"

const baseConfig = {
  entry: ["./src/index.ts"],
  unbundle: true,
  target: false,
  platform: "neutral",
  minify: "dce-only",
  sourcemap: true,
  hash: false,
  dts: {
    newContext: true,
    sourcemap: true,
  },
  attw: {
    level: "error",
    profile: "esmOnly",
  },
  publint: true,
  failOnWarn: true,
} as const satisfies UserConfig

export const tsdownConfig: MergeConfigFn<UserConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

import type { UserConfig } from "tsdown"
import type { SetRequired } from "type-fest"

import type { MergeConfigFn } from "#utils.ts"
import { createMergeConfigFn } from "#utils.ts"

// Force projects to specify platform
type StrictUserConfig = SetRequired<UserConfig, "platform">

const baseConfig = {
  entry: ["./src/index.ts"],
  platform: "neutral",
  target: false,
  unbundle: true,
  sourcemap: true,
  minify: "dce-only",
  fixedExtension: false,
  hash: false,
  dts: {
    newContext: true,
    tsgo: true,
    sourcemap: true,
  },
  deps: {
    neverBundle: ["bun"],
  },
  attw: {
    level: "error",
    profile: "esm-only",
  },
  publint: true,
  failOnWarn: true,
} as const satisfies StrictUserConfig

const binConfig = {
  ...baseConfig,
  entry: [],
  platform: "node",
  unbundle: false,
  sourcemap: false,
  outExtensions: () => ({ js: "" }) as const,
  dts: false,
  attw: false,
} as const satisfies UserConfig

// Annotated as the non-optional MergeConfigFn so projects must pass a config (platform is required)
export const tsdownConfig: MergeConfigFn<StrictUserConfig, typeof baseConfig> = createMergeConfigFn<
  StrictUserConfig,
  typeof baseConfig
>(baseConfig)
export const tsdownBinConfig = createMergeConfigFn<UserConfig, typeof binConfig>(binConfig)

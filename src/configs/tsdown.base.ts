import type { UserConfig } from "tsdown"
import type { SetRequired } from "type-fest"

import type { MergeConfigFn, OptionalMergeConfigFn } from "#/utils.ts"
import { createMergeConfigFn } from "#/utils.ts"

// Force projects to specify platform
type StrictUserConfig = SetRequired<UserConfig, "platform">

const baseConfig = {
  attw: {
    level: "error",
    profile: "esm-only",
  },
  dts: {
    newContext: true,
    resolver: "tsc",
    sourcemap: true,
  },
  entry: ["./src/index.ts"],
  failOnWarn: true,
  fixedExtension: false,
  hash: false,
  minify: "dce-only",
  platform: "neutral",
  publint: true,
  sourcemap: true,
  target: false,
  unbundle: true,
} as const satisfies StrictUserConfig

const binConfig = {
  ...baseConfig,
  attw: false,
  dts: false,
  entry: [],
  outExtensions: () => ({ js: "" }),
  platform: "node",
  sourcemap: false,
  unbundle: false,
} as const satisfies UserConfig

export const tsdownConfig: MergeConfigFn<StrictUserConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)
export const tsdownBinConfig: OptionalMergeConfigFn<UserConfig, typeof binConfig> = createMergeConfigFn(binConfig)

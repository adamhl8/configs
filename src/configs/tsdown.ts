import type { UserConfig } from "tsdown"
import type { SetRequired } from "type-fest"

import type { MergeConfigFn, OptionalMergeConfigFn } from "./utils.ts"
import { createMergeConfigFn } from "./utils.ts"

// force projects to specify platform
type StrictUserConfig = SetRequired<UserConfig, "platform">

const baseConfig = {
  entry: ["./src/index.ts"],
  unbundle: true,
  target: false,
  platform: "neutral",
  fixedExtension: false,
  minify: "dce-only",
  sourcemap: true,
  hash: false,
  dts: {
    resolver: "tsc",
    newContext: true,
    sourcemap: true,
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
  outExtensions: () => ({ js: "" }),
  unbundle: false,
  sourcemap: false,
  dts: false,
  attw: false,
  publint: false,
} as const satisfies UserConfig

export const tsdownConfig: MergeConfigFn<StrictUserConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)
export const tsdownBinConfig: OptionalMergeConfigFn<UserConfig, typeof binConfig> = createMergeConfigFn(binConfig)

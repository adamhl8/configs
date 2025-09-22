import type { NormalizedUserConfig } from "tsdown"
import type { SetRequired } from "type-fest"

import { createMergeConfigFn } from "./utils.ts"

// force projects to specify platform
type StrictUserConfig = SetRequired<NormalizedUserConfig, "platform">

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
} as const satisfies StrictUserConfig

const binConfig = {
  ...baseConfig,
  entry: [],
  platform: "node",
  outExtensions: () => ({ js: "" }),
  copy: [],
  unbundle: false,
  sourcemap: false,
  dts: false,
  attw: false,
  publint: false,
} as const satisfies NormalizedUserConfig

export const tsdownConfig = createMergeConfigFn<StrictUserConfig, typeof baseConfig, true>(baseConfig)
export const tsdownBinConfig = createMergeConfigFn<NormalizedUserConfig, typeof binConfig>(binConfig)

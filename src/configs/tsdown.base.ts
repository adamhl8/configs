import type { UserConfig } from "tsdown"
import type { SetRequired } from "type-fest"

import type { MergeConfigFn } from "#utils.ts"
import { createMergeConfigFn } from "#utils.ts"

// Force projects to specify platform
type StrictConfig = SetRequired<UserConfig, "platform">

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
} as const satisfies StrictConfig

// Force projects to specify platform and entry
type StrictBundleConfig = SetRequired<UserConfig, "platform" | "entry">

// Single-file bundle (not a published library): bundle everything, drop types/lint/sourcemap.
const bundleConfig = {
  ...baseConfig,
  entry: [],
  unbundle: false,
  sourcemap: false,
  dts: false,
  attw: false,
  publint: false,
  inputOptions: {
    experimental: {
      attachDebugInfo: "none", // remove region comments from bundled output
    },
  },
} as const satisfies StrictBundleConfig

// Force projects to specify platform and entry
type StrictBinConfig = SetRequired<UserConfig, "entry">

// A bin is a node bundle with no output file extension.
const binConfig = {
  ...bundleConfig,
  platform: "node",
  outExtensions: () => ({ js: "" }) as const,
} as const satisfies StrictBinConfig

export const tsdownConfig: MergeConfigFn<StrictConfig, typeof baseConfig> = createMergeConfigFn<
  StrictConfig,
  typeof baseConfig
>(baseConfig)

export const tsdownBundleConfig: MergeConfigFn<StrictBundleConfig, typeof bundleConfig> = createMergeConfigFn<
  StrictBundleConfig,
  typeof bundleConfig
>(bundleConfig)

export const tsdownBinConfig: MergeConfigFn<StrictBinConfig, typeof binConfig> = createMergeConfigFn<
  StrictBinConfig,
  typeof binConfig
>(binConfig)

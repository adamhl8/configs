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

// Single-file bundle (not a published library): bundle everything, drop types/lint/sourcemap.
const bundleConfig = {
  ...baseConfig,
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
} as const satisfies StrictUserConfig

// A bin is a node bundle with no output file extension.
const binConfig = {
  ...bundleConfig,
  entry: [],
  platform: "node",
  outExtensions: () => ({ js: "" }) as const,
} as const satisfies UserConfig

// Annotated as the non-optional MergeConfigFn so projects must pass a config (platform is required)
export const tsdownConfig: MergeConfigFn<StrictUserConfig, typeof baseConfig> = createMergeConfigFn<
  StrictUserConfig,
  typeof baseConfig
>(baseConfig)

export const tsdownBundleConfig: MergeConfigFn<StrictUserConfig, typeof bundleConfig> = createMergeConfigFn<
  StrictUserConfig,
  typeof bundleConfig
>(bundleConfig)

export const tsdownBinConfig = createMergeConfigFn<UserConfig, typeof binConfig>(binConfig)

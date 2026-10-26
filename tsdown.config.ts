import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "#configs/tsdown.base.ts"

const config = tsdownConfig({
  entry: ["./src/configs/bask.base.ts"],
  copy: [
    // Copy the non-TS config files because consumers and the helpers in `utils.ts` reference them by path.
    {
      from: ["./src/configs/*", "!./src/configs/*.ts"],
      to: "./dist/configs/",
    },
    {
      from: "./src/tofu/",
      to: "./dist/",
    },
  ],
  deps: {
    // tsdown (correctly) bundles dev dependencies, but we don't want to bundle anything from them. Consuming projects are assumed to have the needed dependencies installed.
    neverBundle: true,
  },
  platform: "neutral",
})

const env = tsdownConfig({
  entry: "./src/env/index.ts",
  platform: "node",
  outDir: "./dist/env/",
  attw: false,
  publint: false,
})

const testUtils = tsdownConfig(
  {
    platform: "node",
    outDir: "./dist/test-utils/",
    deps: {
      neverBundle: ["bun:test"],
    },
    attw: false,
    publint: false,
  },
  // Replace the base `entry` instead of appending to it, because the base builds `src/index.ts`.
  {
    entry: [
      "./src/test-utils/index.ts",
      "./src/test-utils/preload.ts",
      "./src/test-utils/subprocess-coverage/preload.ts",
      // Build the child preload as its own file because children load it by path through `BUN_OPTIONS`.
      "./src/test-utils/subprocess-coverage/child-preload.ts",
    ],
  },
)

const adamhl8Bunfig = tsdownBinConfig({
  entry: "./src/adamhl8-bunfig/index.ts",
  outDir: "./dist/adamhl8-bunfig/",
})

const adamhl8Gitignore = tsdownBinConfig({
  entry: "./src/adamhl8-gitignore/index.ts",
  outDir: "./dist/adamhl8-gitignore/",
})

export default defineConfig([config, env, testUtils, adamhl8Bunfig, adamhl8Gitignore])

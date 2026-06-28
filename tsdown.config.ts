import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "./src/configs/tsdown.base.ts"

const config = tsdownConfig({
  copy: [
    {
      from: "./src/configs/tsconfig.base.json",
      to: "./dist/configs/",
    },
  ],
  deps: {
    // tsdown (correctly) bundles dev dependencies, but we don't want to bundle anything from them. Consuming projects are assumed to have the needed dependencies installed.
    skipNodeModulesBundle: true,
  },
  platform: "neutral",
} as const)

const adamhl8Knip = tsdownBinConfig({
  entry: ["./src/adamhl8-knip/index.ts"],
  outDir: "./dist/adamhl8-knip/",
} as const)

const knipPreprocessor = tsdownBinConfig({
  entry: ["./src/adamhl8-knip/knip-preprocessor.ts"],
  outDir: "./dist/adamhl8-knip/",
  outExtensions: () => ({}),
} as const)

export default defineConfig([config, adamhl8Knip, knipPreprocessor])

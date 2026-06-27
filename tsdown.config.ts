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
    // tsdown correctly bundles dev dependencies, so we need to exclude them here or else the types we import will be included in the bundle. Consuming projects are assumed to have these dependencies installed.
    neverBundle: ["tsdown", "knip", "oxfmt", "oxlint"],
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

// oxlint-disable-next-line import/no-default-export
export default defineConfig([config, adamhl8Knip, knipPreprocessor])

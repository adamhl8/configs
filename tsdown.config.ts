import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "./src/configs/tsdown.ts"

const config = tsdownConfig({
  platform: "neutral",
  deps: {
    neverBundle: ["tsdown", "knip"],
  },
  copy: [
    {
      from: "./src/configs/biome.base.json",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/tsconfig.base.json",
      to: "./dist/configs/",
    },
  ],
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

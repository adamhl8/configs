import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "./src/configs/tsdown.ts"

const config = tsdownConfig({
  entry: ["./src/configs/knip-preprocessor.ts"],
  platform: "neutral",
  copy: [
    {
      from: "./src/configs/biome.base.json",
      to: "./dist/configs/biome.base.json",
    },
    {
      from: "./src/configs/tsconfig.base.json",
      to: "./dist/configs/tsconfig.base.json",
    },
  ],
} as const)

const binConfig = tsdownBinConfig({
  entry: ["./src/adamhl8-knip/index.ts", "./src/ts-import-fix/index.ts"],
} as const)

export default defineConfig([config, binConfig])

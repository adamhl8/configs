import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "./src/tsdown.ts"

const config = tsdownConfig({
  entry: ["./src/knip-preprocessor.ts"],
  platform: "neutral",
  copy: ["./src/biome.base.json", "./src/tsconfig.base.json"],
} as const)

const binConfig = tsdownBinConfig({ entry: ["./src/adamhl8-knip.ts"] } as const)

export default defineConfig([config, binConfig])

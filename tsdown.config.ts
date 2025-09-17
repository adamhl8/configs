import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "./src/tsdown.ts"

const config = tsdownConfig({
  entry: ["./src/knip-preprocessor.ts"],
  copy: [
    {
      from: "./src/biome-plugins/import-paths.grit",
      to: "./dist/biome-plugins/import-paths.grit",
    },
    "./src/biome.base.json",
    "./src/tsconfig.base.json",
  ],
} as const)

const binConfig = tsdownBinConfig({ entry: ["./src/bin/adamhl8-knip.ts"] } as const)

export default defineConfig([config, binConfig])

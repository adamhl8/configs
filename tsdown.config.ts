import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "./src/configs/tsdown.ts"

const config = tsdownConfig({
  entry: ["./src/configs/knip-preprocessor.ts"],
  platform: "neutral",
  external: ["prettier", "tsdown"],
  // knip gets partially bundled because we have to import some types directly from node_modules. If knip exports these types, we can remove this
  inlineOnly: false,
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

const binConfig = tsdownBinConfig({
  entry: ["./src/adamhl8-knip/index.ts", "./src/ts-import-fix/index.ts"],
} as const)

export default defineConfig([config, binConfig])

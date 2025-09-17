import type { UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import { tsdownConfig } from "./src/tsdown.ts"

const config = tsdownConfig({
  entry: ["./src/knip-preprocessor.ts"],
  unbundle: false,
  copy: [
    {
      from: "./src/biome-plugins/import-paths.grit",
      to: "./dist/biome-plugins/import-paths.grit",
    },
    "./src/biome.base.json",
    "./src/tsconfig.base.json",
  ],
} as const)

const binConfig = {
  ...config,
  entry: ["./src/bin/adamhl8-knip.ts"],
  platform: "node",
  outDir: "./dist/bin/",
  outExtensions: () => ({ js: "" }),
  copy: [],
  sourcemap: false,
  dts: false,
  attw: false,
  publint: false,
} as const satisfies UserConfig

export default defineConfig([config, binConfig])

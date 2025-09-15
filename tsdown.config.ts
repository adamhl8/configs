import type { UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import { tsdownConfig } from "./src/tsdown.ts"

const config = tsdownConfig({
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

const baseScriptConfig = {
  ...config,
  entry: [],
  copy: [],
  external: /.*/,
  sourcemap: false,
  dts: false,
  attw: false,
  publint: false,
} as const satisfies UserConfig

const multiConfig = [
  config,
  {
    ...baseScriptConfig,
    entry: ["./src/knip-preprocessor.ts"],
  },
  {
    ...baseScriptConfig,
    entry: ["./src/bin/adamhl8-knip.ts"],
    outputOptions: { entryFileNames: "[name]" },
    outDir: "./dist/bin/",
  },
] satisfies UserConfig

export default defineConfig(multiConfig)

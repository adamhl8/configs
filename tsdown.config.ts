import path from "node:path"

import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "#/configs/tsdown.base.ts"

const config = tsdownConfig({
  copy: [
    {
      from: "./src/configs/tsconfig.base.json",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/lefthook.base.yaml",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/cliff.base.toml",
      to: "./dist/configs/",
    },
  ],
  deps: {
    // tsdown (correctly) bundles dev dependencies, but we don't want to bundle anything from them. Consuming projects are assumed to have the needed dependencies installed.
    skipNodeModulesBundle: true,
    // https://github.com/rolldown/tsdown/issues/993
    neverBundle: (id) => !path.isAbsolute(id) && !id.startsWith(".") && !id.startsWith("#"),
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

const adamhl8Cliff = tsdownBinConfig({
  entry: ["./src/adamhl8-cliff/index.ts"],
  outDir: "./dist/adamhl8-cliff/",
} as const)

export default defineConfig([config, adamhl8Knip, knipPreprocessor, adamhl8Cliff])

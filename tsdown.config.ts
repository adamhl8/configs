import path from "node:path"

import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "#configs/tsdown.base.ts"

const config = tsdownConfig({
  copy: [
    {
      from: "./src/configs/bunfig.base.toml",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/cliff.base.toml",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/gitignore.base",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/justfile.base.just",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/lefthook.base.yaml",
      to: "./dist/configs/",
    },
    {
      from: "./src/configs/tsconfig.base.json",
      to: "./dist/configs/",
    },
    {
      from: "./src/tofu/",
      to: "./dist/",
    },
  ],
  deps: {
    // tsdown (correctly) bundles dev dependencies, but we don't want to bundle anything from them. Consuming projects are assumed to have the needed dependencies installed.
    skipNodeModulesBundle: true,
    // https://github.com/rolldown/tsdown/issues/993
    neverBundle: (id) => !path.isAbsolute(id) && !id.startsWith(".") && !id.startsWith("#"),
  },
  platform: "neutral",
  attw: false,
  publint: false,
})

const env = tsdownConfig({
  entry: "./src/env/index.ts",
  platform: "node",
  outDir: "./dist/env/",
})

const adamhl8Bunfig = tsdownBinConfig({
  entry: "./src/adamhl8-bunfig/index.ts",
  outDir: "./dist/adamhl8-bunfig/",
})

const adamhl8Cliff = tsdownBinConfig({
  entry: "./src/adamhl8-cliff/index.ts",
  outDir: "./dist/adamhl8-cliff/",
})

const adamhl8Gitignore = tsdownBinConfig({
  entry: "./src/adamhl8-gitignore/index.ts",
  outDir: "./dist/adamhl8-gitignore/",
})

export default defineConfig([config, env, adamhl8Bunfig, adamhl8Cliff, adamhl8Gitignore])

import { Glob } from "bun"
import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "#configs/tsdown.base.ts"

const CONFIGS_DIR = "./src/configs"
// We need to copy all non-typescript files.
const configFileGlob = new Glob("!*.ts")
const configFiles = await Array.fromAsync(configFileGlob.scan({ cwd: CONFIGS_DIR }))
const copyEntries = configFiles.map((file) => ({ from: `${CONFIGS_DIR}/${file}`, to: "./dist/configs/" }))

const config = tsdownConfig({
  copy: [
    ...copyEntries,
    {
      from: "./src/tofu/",
      to: "./dist/",
    },
  ],
  deps: {
    // tsdown (correctly) bundles dev dependencies, but we don't want to bundle anything from them. Consuming projects are assumed to have the needed dependencies installed.
    neverBundle: true,
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

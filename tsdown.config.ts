import { defineConfig } from "tsdown"

import { tsdownBinConfig, tsdownConfig } from "#configs/tsdown.base.ts"

const config = tsdownConfig({
  copy: [
    // Copy the non-TS config files because consumers and the helpers in `utils.ts` reference them by path.
    {
      from: ["./src/configs/*", "!./src/configs/*.ts"],
      to: "./dist/configs/",
    },
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
})

const env = tsdownConfig({
  entry: "./src/env/index.ts",
  platform: "node",
  outDir: "./dist/env/",
  attw: false,
  publint: false,
})

const adamhl8Bunfig = tsdownBinConfig({
  entry: "./src/adamhl8-bunfig/index.ts",
  outDir: "./dist/adamhl8-bunfig/",
})

const adamhl8Gitignore = tsdownBinConfig({
  entry: "./src/adamhl8-gitignore/index.ts",
  outDir: "./dist/adamhl8-gitignore/",
})

export default defineConfig([config, env, adamhl8Bunfig, adamhl8Gitignore])

import { knipConfig } from "#/configs/knip.base.ts"

const config = knipConfig({
  entry: [
    "./src/adamhl8-knip/index.ts",
    "./src/adamhl8-knip/knip-preprocessor.ts",
    "./src/adamhl8-cliff/index.ts",
    "./src/env/index.ts",
  ],
  ignoreBinaries: ["adamhl8-knip", "adamhl8-cliff", "git-cliff"],
})

export default config

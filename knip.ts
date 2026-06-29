import { knipConfig } from "#/configs/knip.base.ts"

const config = knipConfig({
  entry: ["./src/adamhl8-knip/knip-preprocessor.ts"],
  ignoreBinaries: ["adamhl8-cliff"],
} as const)

export default config

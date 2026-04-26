import { knipConfig } from "./src/configs/knip.ts"

const config = knipConfig({
  entry: ["./src/adamhl8-knip/knip-preprocessor.ts"],
} as const)

export default config

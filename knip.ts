import packageJson from "./package.json" with { type: "json" }
import { knipConfig } from "./src/configs/knip.ts"

const depsToIgnore = Object.keys(packageJson.dependencies).filter((dep) => dep.includes("prettier"))

const config = knipConfig({
  entry: ["./src/configs/knip-preprocessor.ts"],
  ignoreDependencies: depsToIgnore,
} as const)

export default config

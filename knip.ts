import packageJson from "./package.json" with { type: "json" }
import { knipConfig } from "./src/knip.ts"

const depsToIgnore = Object.keys(packageJson.dependencies).filter((dep) => dep.includes("prettier"))

const config = knipConfig({
  entry: ["./src/knip-preprocessor.ts"],
  ignoreDependencies: depsToIgnore,
} as const)

export default config

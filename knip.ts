import packageJson from "./package.json" with { type: "json" }
// biome-ignore lint/plugin: ignore
import { knipConfig } from "./src/knip.ts"

const depsToIgnore = Object.keys(packageJson.dependencies).filter((dep) => dep.includes("prettier"))

const config = knipConfig({
  entry: ["./src/knip-preprocessor.ts"],
  ignoreDependencies: depsToIgnore,
} as const)

export default config

import { defineConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import { tsdownConfig } from "./src/index.ts"

export default defineConfig({
  ...tsdownConfig,
  copy: [
    {
      from: "./src/biome-plugins/import-paths.grit",
      to: "./dist/biome-plugins/import-paths.grit",
    },
    "./src/biome.base.jsonc",
    "./src/tsconfig.json",
  ],
  attw: {
    ...tsdownConfig.attw,
    excludeEntrypoints: ["./biome"], // attw seems to not like .jsonc files
  },
})

import { defineConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import { tsdownConfig } from "./src/index.ts"

export default defineConfig(
  tsdownConfig({
    unbundle: false,
    copy: [
      {
        from: "./src/biome-plugins/import-paths.grit",
        to: "./dist/biome-plugins/import-paths.grit",
      },
      "./src/biome.base.jsonc",
      "./src/tsconfig.json",
    ],
    attw: {
      excludeEntrypoints: ["./biome"], // attw seems to not like .jsonc files
    },
  }),
)

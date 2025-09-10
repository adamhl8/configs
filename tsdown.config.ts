import { defineConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import { config } from "./configs/tsdown.ts"

export default defineConfig({
  ...config,
  entry: ["./configs/**/*.ts"],
  copy: [
    {
      from: "./configs/biome-plugins/import-paths.grit",
      to: "./dist/biome-plugins/import-paths.grit",
    },
    "./configs/biome.base.jsonc",
    "./configs/tsconfig.json",
  ],
  attw: {
    ...config.attw,
    excludeEntrypoints: ["./biome"], // attw seems to not like .jsonc files
  },
})

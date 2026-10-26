import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["./src/cli.ts"],
  platform: "node",
  dts: false,
  fixedExtension: false,
  sourcemap: true,
})

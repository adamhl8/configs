import { mergeWith } from "es-toolkit"
import type { UserConfig } from "tsdown"

// biome-ignore lint/plugin: ignore
import { concatArrays } from "./utils.ts"

const baseConfig = {
  entry: ["./src/index.ts"],
  unbundle: true,
  target: false,
  platform: "neutral",
  minify: "dce-only",
  sourcemap: true,
  dts: {
    newContext: true,
    sourcemap: true,
  },
  attw: {
    level: "error",
    profile: "esmOnly",
  },
  publint: true,
  logLevel: "warn",
  failOnWarn: true,
} as const satisfies UserConfig

export const tsdownConfig = <T extends UserConfig>(config: T) => mergeWith(baseConfig, config, concatArrays)

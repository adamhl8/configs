import { toMerged } from "es-toolkit"
import type { UserConfig } from "tsdown"

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

export const tsdownConfig = <T extends UserConfig>(config: T) => toMerged(baseConfig, config)

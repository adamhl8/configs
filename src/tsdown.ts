import type { UserConfig } from "tsdown"

export const tsdownConfig = {
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

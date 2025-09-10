import type { UserConfig } from "tsdown"

export const config = {
  entry: ["./src/**/*.ts", "!**/__tests__/", "!**/*.test.ts", "!**/test-*.ts"],
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

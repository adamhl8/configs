import type { Config } from "prettier"
import type { Simplify } from "type-fest"

import { createMergeConfigFn } from "./utils.ts"

// for some reason the Config type from prettier doesn't satisfy AnyObj unless we simplify it
type PrettierConfig = Simplify<Config>

const baseConfig = {
  printWidth: 120,
  semi: false,
  plugins: [
    "@prettier/plugin-xml",
    "prettier-plugin-sh",
    "prettier-plugin-toml",
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss",
  ],
  tailwindStylesheet: "./src/global.css",
  overrides: [
    {
      // https://github.com/prettier/prettier/issues/15956
      files: "*.jsonc",
      options: {
        trailingComma: "none",
      },
    },
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
} as const satisfies PrettierConfig

export const prettierConfig = createMergeConfigFn<PrettierConfig, typeof baseConfig>(baseConfig)

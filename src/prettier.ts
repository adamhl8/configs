import { mergeWith } from "es-toolkit"
import type { Config } from "prettier"

// biome-ignore lint/plugin: ignore
import { concatArrays } from "./utils.ts"

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
} as const satisfies Config

export const prettierConfig = <T extends Config>(config: T) => mergeWith(baseConfig, config, concatArrays)

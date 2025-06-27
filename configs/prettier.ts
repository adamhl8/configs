import type { Config } from "prettier"

const prettierConfig: Config = {
  printWidth: 120,
  semi: false,
  plugins: [
    "prettier-plugin-sh",
    "prettier-plugin-pkg",
    "prettier-plugin-toml",
    // "@prettier/plugin-xml",
    "prettier-plugin-astro",
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: ["<BUILTIN_MODULES>", "<THIRD_PARTY_MODULES>", "", "^@(/.*)$", "^[.]"],
  importOrderTypeScriptVersion: "5.0.0",
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
}

export { prettierConfig }

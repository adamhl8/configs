import type { Config } from "prettier"

const config: Config = {
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
}

export default config

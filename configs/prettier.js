/** @type {import("prettier").Config} */
// biome-ignore lint/style/noDefaultExport: prettier config
export default {
  printWidth: 120,
  semi: false,
  plugins: [
    // "@prettier/plugin-xml", currently broken
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

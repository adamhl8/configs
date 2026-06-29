import { defineConfig } from "oxlint"

import { oxlintConfig } from "#/index.ts"

const config = oxlintConfig({
  overrides: [
    {
      files: ["src/configs/oxlint.base.ts"],
      rules: {
        "sort-keys": ["error", "asc", { allowLineSeparatedGroups: true, natural: true }],
      },
    },
  ],
} as const)

export default defineConfig(config)

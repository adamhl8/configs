import { defineConfig } from "oxlint"

import { oxlintConfig } from "#/index.ts"

const config = oxlintConfig({
  rules: {
    "sort-keys": ["error", "asc", { allowLineSeparatedGroups: true, natural: true }],
  },
})

export default defineConfig(config)

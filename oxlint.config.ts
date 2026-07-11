import { defineConfig } from "oxlint"

import { oxlintConfig } from "#index.ts"

const config = oxlintConfig({
  overrides: [
    {
      files: ["src/configs/oxlint.base.ts"],
      rules: {
        "sort-keys": ["error", "asc", { allowLineSeparatedGroups: true, natural: true }],
      },
    },
    {
      // tsgolint (0.24) hangs when these two rules walk createMergeConfigFn's recursive merge types,
      // so they're off for the files that call it. Consumer call sites of the merge fns are unaffected.
      files: ["src/utils.ts", "src/utils.test.ts", "src/configs/*.base.ts"],
      rules: {
        "typescript/no-misused-promises": "off",
        "typescript/no-unnecessary-type-assertion": "off",
      },
    },
  ],
})

export default defineConfig(config)

import type { OxlintConfig } from "oxlint"

import { createMergeConfigFn } from "#/utils.ts"
import type { OptionalMergeConfigFn } from "#/utils.ts"

const baseConfig = {
  categories: {
    correctness: "error",
    nursery: "error",
    pedantic: "error",
    perf: "error",
    restriction: "error",
    style: "error",
    suspicious: "error",
  },
  options: {
    reportUnusedDisableDirectives: "error",
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      files: ["knip.ts", "oxfmt.config.ts", "oxlint.config.ts", "tsdown.config.ts"],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
  plugins: [
    "eslint",
    "react",
    "unicorn",
    "typescript",
    "oxc",
    "import",
    "jsdoc",
    "vitest",
    "jsx-a11y",
    "react-perf",
    "promise",
    "node",
  ],
  rules: {
    curly: ["error", "multi-or-nest"],
    "func-style": ["error", "expression"],
    "node/no-sync": ["error", { ignores: ["existsSync", "spawnSync"] }],
    "sort-keys": ["error", "asc", { allowLineSeparatedGroups: true, natural: true }],

    "capitalized-comments": "off",
    "id-length": "off",
    "import/exports-last": "off",
    "import/group-exports": "off",
    "import/no-named-export": "off",
    "import/no-nodejs-modules": "off",
    "import/prefer-default-export": "off",
    "jsdoc/require-param": "off",
    "jsdoc/require-returns": "off",
    "no-console": "off",
    "no-continue": "off",
    "no-duplicate-imports": "off",
    "no-inline-comments": "off",
    "no-magic-numbers": "off",
    "no-ternary": "off",
    "no-undef": "off",
    "no-undefined": "off",
    "oxc/no-rest-spread-properties": "off",
    "sort-imports": "off",
    "typescript/explicit-function-return-type": "off",
    "typescript/explicit-module-boundary-types": "off",
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/strict-boolean-expressions": "off",
  },
  settings: {
    vitest: {
      typecheck: true,
    },
  },
} as const satisfies OxlintConfig

export const oxlintConfig: OptionalMergeConfigFn<OxlintConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

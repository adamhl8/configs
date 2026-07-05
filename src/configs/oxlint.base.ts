import { fileURLToPath } from "node:url"

import type { OxlintConfig } from "oxlint"

import { createMergeConfigFn } from "#/utils.ts"

const baseConfig = {
  options: {
    reportUnusedDisableDirectives: "error",
    typeAware: true,
    typeCheck: true,
  },

  categories: {
    correctness: "error",
    nursery: "error",
    pedantic: "error",
    perf: "error",
    restriction: "error",
    style: "error",
    suspicious: "error",
  },

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

  // Resolve to an absolute path so consumers load it from this package's own deps.
  jsPlugins: [fileURLToPath(import.meta.resolve("@adamhl8/eslint-plugin-clean-modules"))],

  overrides: [
    {
      files: [
        ".release-it.ts",
        "astro.config.ts",
        "commitlint.config.ts",
        "knip.ts",
        "oxfmt.config.ts",
        "oxlint.config.ts",
        "prisma.config.ts",
        "tsdown.config.ts",
        "vitest.config.ts",
      ],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],

  rules: {
    "clean-modules/require-direct-exports": "error",
    "clean-modules/require-import-extensions": "error",
    "clean-modules/require-subpath-imports": "error",

    curly: ["error", "multi-or-nest"],
    "func-style": ["error", "expression"],
    "react/jsx-curly-brace-presence": ["error", { children: "never", propElementValues: "always", props: "never" }],
    "require-unicode-regexp": ["error", { requireFlag: "v" }],
    "unicorn/filename-case": [
      "error",
      {
        cases: { kebabCase: true, pascalCase: true },
      },
    ],
    "unicorn/no-useless-undefined": ["error", { checkArguments: false }],

    "capitalized-comments": "off",
    "id-length": "off",
    "import/exports-last": "off",
    "import/group-exports": "off",
    "import/max-dependencies": "off",
    "import/no-named-export": "off",
    "import/no-nodejs-modules": "off",
    "import/no-unassigned-import": "off",
    "import/prefer-default-export": "off",
    "init-declarations": "off",
    "jsdoc/require-param": "off",
    "jsdoc/require-returns": "off",
    "max-classes-per-file": "off",
    "max-lines": "off",
    "max-lines-per-function": "off",
    "max-statements": "off",
    "no-console": "off",
    "no-continue": "off",
    "no-duplicate-imports": "off",
    "no-inline-comments": "off",
    "no-magic-numbers": "off",
    "no-plusplus": "off",
    "no-ternary": "off",
    "no-undef": "off",
    "no-undefined": "off",
    "no-useless-return": "off",
    "no-void": "off",
    "node/callback-return": "off",
    "node/no-sync": "off",
    "oxc/no-async-await": "off",
    "oxc/no-optional-chaining": "off",
    "oxc/no-rest-spread-properties": "off",
    "react/forbid-component-props": "off",
    "react/jsx-filename-extension": "off",
    "react/jsx-max-depth": "off",
    "react/jsx-no-literals": "off",
    "react/react-in-jsx-scope": "off",
    "require-await": "off",
    "sort-imports": "off",
    "sort-keys": "off",
    "typescript/consistent-return": "off",
    "typescript/explicit-function-return-type": "off",
    "typescript/explicit-module-boundary-types": "off",
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/strict-boolean-expressions": "off",
    "unicorn/no-array-callback-reference": "off",
    "unicorn/no-array-method-this-argument": "off",
    "unicorn/no-process-exit": "off",
    "unicorn/number-literal-case": "off",
    "unicorn/switch-case-braces": "off",
    "vitest/no-hooks": "off",
    "vitest/no-importing-vitest-globals": "off",
    "vitest/prefer-describe-function-title": "off",
    "vitest/prefer-expect-assertions": "off",
    "vitest/prefer-lowercase-title": "off",
    "vitest/prefer-to-be-falsy": "off",
    "vitest/prefer-to-be-truthy": "off",
    "vitest/require-hook": "off", // reenable when false positives are fixed?
    "vitest/require-test-timeout": "off",
  },
} as const satisfies OxlintConfig

export const oxlintConfig = createMergeConfigFn<OxlintConfig, typeof baseConfig>(baseConfig)

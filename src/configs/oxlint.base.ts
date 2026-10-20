import cleanModulesPlugin from "@adamhl8/eslint-plugin-clean-modules"
import { rules as regexpPluginRules } from "eslint-plugin-regexp"
import type { OxlintConfig } from "oxlint"
import tailwindcssPlugin from "oxlint-tailwindcss"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"
import { resolvePackagePath, resolveProjectTailwind } from "#utils.ts"

/** Sets every rule in a JS plugin to "error", because `categories` doesn't apply to JS plugins. */
const enableAllPluginRules = (namespace: string, rules: Record<string, unknown>) =>
  Object.fromEntries(Object.keys(rules).map((name) => [`${namespace}/${name}`, "error"] as const))

// Load the Tailwind plugin only in Tailwind projects because it reports every class string when it has no stylesheet.
const tailwindStylesheet = resolveProjectTailwind()

// Resolve to absolute paths so consumers load these from this package's own deps.
const jsPlugins = [
  "@adamhl8/eslint-plugin-clean-modules",
  "eslint-plugin-regexp",
  ...(tailwindStylesheet ? ["oxlint-tailwindcss"] : []),
].map(resolvePackagePath)

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

  jsPlugins,

  // Keep `entryPoint` relative because the plugin resolves it against the directory of the project's oxlint config.
  ...(tailwindStylesheet ? { settings: { tailwindcss: { entryPoint: tailwindStylesheet } } } : {}),

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
      ],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      files: ["bask.ts"],
      rules: {
        "clean-modules/require-direct-exports": "off",
        "import/export": "off",
      },
    },
    {
      files: [".release-it.ts"],
      rules: {
        "no-template-curly-in-string": "off",
      },
    },
    {
      files: ["**/*.tsx"],
      rules: {
        "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      },
    },
  ],

  rules: {
    /* Plugin rules */

    ...enableAllPluginRules("clean-modules", cleanModulesPlugin.rules),
    ...enableAllPluginRules("regexp", regexpPluginRules),
    ...(tailwindStylesheet ? enableAllPluginRules("tailwindcss", tailwindcssPlugin.rules) : {}),

    /* Modified rules */

    curly: ["error", "multi-or-nest"],
    "func-style": ["error", "expression"],
    "require-unicode-regexp": ["error", { requireFlag: "v" }],

    "react/function-component-definition": [
      "error",
      { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
    ],
    "react/jsx-curly-brace-presence": ["error", { children: "never", propElementValues: "always", props: "never" }],

    "regexp/letter-case": ["error", { hexadecimalEscape: "uppercase", unicodeEscape: "uppercase" }], // match `unicorn/escape-case`

    "unicorn/filename-case": [
      "error",
      {
        cases: { kebabCase: true, pascalCase: true },
      },
    ],
    "unicorn/no-useless-undefined": ["error", { checkArguments: false }],

    /* Disabled rules */

    "capitalized-comments": "off",
    "id-length": "off",
    "init-declarations": "off",
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
    "no-regex-spaces": "off", // `regexp/prefer-quantifier` covers this
    "no-ternary": "off",
    "no-undef": "off",
    "no-undefined": "off",
    "no-useless-return": "off",
    "no-void": "off",
    "one-var": "off",
    "require-await": "off",
    "sort-imports": "off",
    "sort-keys": "off",

    "import/exports-last": "off",
    "import/group-exports": "off",
    "import/max-dependencies": "off",
    "import/no-named-export": "off",
    "import/no-nodejs-modules": "off",
    "import/no-unassigned-import": "off",
    "import/prefer-default-export": "off",

    "jsdoc/require-param": "off",
    "jsdoc/require-returns": "off",

    "node/callback-return": "off",
    "node/no-sync": "off",
    "node/no-top-level-await": "off",

    "oxc/no-async-await": "off",
    "oxc/no-optional-chaining": "off",
    "oxc/no-rest-spread-properties": "off",

    "react/exhaustive-effect-dependencies": "off", // `react/exhaustive-deps` covers this
    "react/forbid-component-props": "off",
    "react/hooks": "off", // `react/rules-of-hooks` covers this
    "react/invariant": "off",
    "react/jsx-filename-extension": "off",
    "react/jsx-max-depth": "off",
    "react/jsx-no-literals": "off",
    "react/memo-dependencies": "off", // `react/exhaustive-deps` covers this
    "react/no-deriving-state-in-effects": "off", // `react/set-state-in-effect` covers this
    "react/react-in-jsx-scope": "off",
    "react/rule-suppression": "off",
    "react/todo": "off",

    "regexp/no-control-character": "off", // `no-control-regex` covers this
    "regexp/no-empty-character-class": "off", // `no-empty-character-class` covers this
    "regexp/no-invalid-regexp": "off", // `no-invalid-regexp` covers this
    "regexp/no-super-linear-move": "off",
    "regexp/no-useless-escape": "off", // `no-useless-escape` covers this
    "regexp/prefer-named-capture-group": "off", // `prefer-named-capture-group` covers this
    "regexp/require-unicode-regexp": "off", // `require-unicode-regexp` covers this
    "regexp/require-unicode-sets-regexp": "off", // `require-unicode-regexp` covers this
    "regexp/sort-alternatives": "off",

    ...(tailwindStylesheet
      ? {
          "tailwindcss/enforce-consistent-line-wrapping": "off", // oxfmt handles line width
          "tailwindcss/enforce-logical": "off", // conflicts with `tailwindcss/enforce-physical`
          "tailwindcss/enforce-sort-order": "off", // oxfmt sorts classes
          "tailwindcss/max-class-count": "off",
        }
      : {}),

    "typescript/consistent-return": "off",
    "typescript/explicit-function-return-type": "off",
    "typescript/explicit-module-boundary-types": "off",
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/strict-boolean-expressions": "off",

    "unicorn/no-array-callback-reference": "off",
    "unicorn/no-array-method-this-argument": "off",
    "unicorn/no-await-expression-member": "off",
    "unicorn/no-process-exit": "off",
    "unicorn/number-literal-case": "off",
    "unicorn/switch-case-braces": "off",

    "vitest/no-hooks": "off",
    "vitest/no-importing-vitest-globals": "off",
    "vitest/prefer-describe-function-title": "off",
    "vitest/prefer-expect-assertions": "off",
    "vitest/prefer-importing-vitest-globals": "off",
    "vitest/prefer-lowercase-title": "off",
    "vitest/prefer-to-be-falsy": "off",
    "vitest/prefer-to-be-truthy": "off",
    "vitest/require-hook": "off", // reenable when false positives are fixed?
    "vitest/require-test-timeout": "off",
  },
} as const satisfies OxlintConfig

export const oxlintConfig = createMergeConfigFn<OxlintConfig, typeof baseConfig>(baseConfig)

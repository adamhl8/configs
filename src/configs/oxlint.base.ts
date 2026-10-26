import cleanModulesPlugin from "@adamhl8/eslint-plugin-clean-modules"
import e18ePlugin from "@e18e/eslint-plugin"
import bunismsPlugin from "eslint-plugin-bunisms"
import honoPlugin from "eslint-plugin-hono"
import reactWebApiPlugin from "eslint-plugin-react-web-api"
import reactEffectPlugin from "eslint-plugin-react-you-might-not-need-an-effect"
import { rules as regexpPluginRules } from "eslint-plugin-regexp"
import type { DummyRule, OxlintConfig, OxlintOverride } from "oxlint"
import { rules as directiveCommentsPluginRules } from "oxlint-plugin-directive-comments"
import tailwindcssPlugin from "oxlint-tailwindcss"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"
import { readProjectPackageJson, resolvePackagePath, resolveProjectTailwind } from "#utils.ts"

/** Sets every rule in a JS plugin to `severity`, because `categories` doesn't apply to JS plugins. */
const setAllPluginRules = (name: string, rules: Record<string, unknown>, severity: "error" | "off") =>
  Object.fromEntries(Object.keys(rules).map((rule) => [`${name}/${rule}`, severity] as const))

// Type plugin rules with oxlint's generic `DummyRule` because its per-rule config types aren't exported, which breaks declaration emit.
type PluginRules = Record<string, DummyRule>

/** A JS plugin and the slice of oxlint config that goes with it. Each one is merged into the base config. */
interface PluginPart extends Omit<OxlintConfig, "jsPlugins" | "overrides" | "rules"> {
  overrides?: (Omit<OxlintOverride, "rules"> & { rules?: PluginRules })[]
  rules?: PluginRules
  /** Loads the plugin only when true. Defaults to true. */
  enabled?: boolean
  package: string
  /** The plugin's rule definitions, used to set every rule to "error". The part's own `rules` then take precedence. */
  pluginRules: Record<string, unknown> | undefined
}

const { dependencies, engines } = readProjectPackageJson()
const tailwindStylesheet = resolveProjectTailwind()

// Key each part by the rule namespace its plugin registers.
const plugins: Record<string, PluginPart> = {
  bunisms: {
    overrides: [
      {
        excludeFiles: ["src/**/__tests__/**", "src/**/*.test.{ts,tsx}", "src/**/test-setup.ts", "src/**/test-utils.ts"],
        // Turn off Bun suggestions in Node runtime code. Tests and tooling still run on Bun.
        files: engines.has("node") ? ["src/**"] : [],
        rules: setAllPluginRules("bunisms", bunismsPlugin.rules, "off"),
      },
    ],
    package: "eslint-plugin-bunisms",
    pluginRules: bunismsPlugin.rules,
    rules: {
      "bunisms/prefer-mock-restore-in-after-each": "off", // `test-setup.ts` preloads restore mocks globally
    },
  },
  "clean-modules": {
    package: "@adamhl8/eslint-plugin-clean-modules",
    pluginRules: cleanModulesPlugin.rules,
  },
  "directive-comments": {
    package: "oxlint-plugin-directive-comments",
    pluginRules: directiveCommentsPluginRules,
    rules: {
      "directive-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
      "directive-comments/no-use": "off", // bans every directive comment
    },
  },
  e18e: {
    package: "@e18e/eslint-plugin",
    pluginRules: e18ePlugin.rules,
    rules: {
      "e18e/no-indexof-equality": "off", // needs type information, which JS plugins don't get
      "e18e/no-spread-in-reduce": "off", // `oxc/no-accumulating-spread` covers this
      "e18e/prefer-array-at": "off", // `unicorn/prefer-at` covers this
      "e18e/prefer-array-some": "off", // `unicorn/prefer-array-some` covers this
      "e18e/prefer-array-to-reversed": "off", // `unicorn/no-array-reverse` covers this
      "e18e/prefer-array-to-sorted": "off", // `unicorn/no-array-sort` covers this
      "e18e/prefer-date-now": "off", // `unicorn/prefer-date-now` covers this
      "e18e/prefer-exponentiation-operator": "off", // `prefer-exponentiation-operator` covers this
      "e18e/prefer-flatmap-over-map-flat": "off", // `unicorn/prefer-array-flat-map` covers this
      "e18e/prefer-includes": "off", // `unicorn/prefer-includes` covers this
      "e18e/prefer-nullish-coalescing": "off", // `typescript/prefer-nullish-coalescing` covers this
      "e18e/prefer-object-has-own": "off", // `prefer-object-has-own` covers this
      "e18e/prefer-slice-over-split-index": "off",
      "e18e/prefer-spread-syntax": "off", // `unicorn/prefer-spread` and `prefer-object-spread` cover this
    },
  },
  hono: {
    enabled: dependencies.has("hono"),
    package: "eslint-plugin-hono",
    pluginRules: honoPlugin.rules,
    rules: {
      "hono/no-process-env": "off", // tools and tests legitimately read the raw environment
    },
  },
  "react-web-api": {
    enabled: dependencies.has("react"),
    package: "eslint-plugin-react-web-api",
    pluginRules: reactWebApiPlugin.rules,
  },
  "react-you-might-not-need-an-effect": {
    enabled: dependencies.has("react"),
    package: "eslint-plugin-react-you-might-not-need-an-effect",
    pluginRules: reactEffectPlugin.rules,
    rules: {
      "react-you-might-not-need-an-effect/no-adjust-state-on-prop-change": "off", // `react/set-state-in-effect` covers this
      "react-you-might-not-need-an-effect/no-chain-state-updates": "off", // `react/set-state-in-effect` covers this
      "react-you-might-not-need-an-effect/no-derived-state": "off", // `react/set-state-in-effect` covers this
      "react-you-might-not-need-an-effect/no-initialize-state": "off", // `react/set-state-in-effect` covers this
      "react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change": "off", // `react/set-state-in-effect` covers this
    },
  },
  regexp: {
    package: "eslint-plugin-regexp",
    pluginRules: regexpPluginRules,
    rules: {
      "regexp/letter-case": ["error", { hexadecimalEscape: "uppercase", unicodeEscape: "uppercase" }], // match `unicorn/escape-case`
      "regexp/no-control-character": "off", // `no-control-regex` covers this
      "regexp/no-empty-character-class": "off", // `no-empty-character-class` covers this
      "regexp/no-invalid-regexp": "off", // `no-invalid-regexp` covers this
      "regexp/no-super-linear-move": "off",
      "regexp/no-useless-escape": "off", // `no-useless-escape` covers this
      "regexp/prefer-named-capture-group": "off", // `prefer-named-capture-group` covers this
      "regexp/require-unicode-regexp": "off", // `require-unicode-regexp` covers this
      "regexp/require-unicode-sets-regexp": "off", // `require-unicode-regexp` covers this
      "regexp/sort-alternatives": "off",
    },
  },
  tailwindcss: {
    // Load the Tailwind plugin only with a stylesheet because it reports every class string without one.
    enabled: Boolean(tailwindStylesheet),
    package: "oxlint-tailwindcss",
    pluginRules: tailwindcssPlugin.rules,
    rules: {
      "tailwindcss/enforce-consistent-line-wrapping": "off", // oxfmt handles line width
      "tailwindcss/enforce-logical": "off", // conflicts with `tailwindcss/enforce-physical`
      "tailwindcss/enforce-sort-order": "off", // oxfmt sorts classes
      "tailwindcss/max-class-count": "off",
    },
    // Keep `entryPoint` relative because the plugin resolves it against the directory of the project's oxlint config.
    settings: { tailwindcss: { entryPoint: tailwindStylesheet } },
  },
}

const nativeConfig = {
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
    {
      files: ["**/fixtures/**", "**/fixture/**"],
      rules: {
        "clean-modules/require-import-extensions": "off",
        "clean-modules/require-subpath-imports": "off",
        "import/no-default-export": "off",
      },
    },
  ],

  rules: {
    /* Modified rules */

    curly: ["error", "multi-or-nest"],
    "func-style": ["error", "expression"],
    "require-unicode-regexp": ["error", { requireFlag: "v" }],

    "react/function-component-definition": [
      "error",
      { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
    ],
    "react/jsx-curly-brace-presence": ["error", { children: "never", propElementValues: "always", props: "never" }],

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
    "node/no-process-env": "off", // tools and tests legitimately read the raw environment
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

const enabledPluginEntries = Object.entries(plugins).filter(([, plugin]) => plugin.enabled ?? true)
const enabledPlugins = enabledPluginEntries.map(([, plugin]) => plugin)
// Resolve JS plugins to absolute paths so consumers load them from this package's own deps.
const resolvedPluginPackages = enabledPlugins.map((plugin) => resolvePackagePath(plugin.package))
const pluginOverrides = enabledPlugins.flatMap((plugin) => plugin.overrides ?? [])
const pluginSettings = Object.fromEntries(enabledPlugins.flatMap((plugin) => Object.entries(plugin.settings ?? {})))

/** Lists a plugin's rules as entries */
const toPluginRuleEntries = ([name, { pluginRules = {}, rules }]: [string, PluginPart]) => {
  const defaultRules = setAllPluginRules(name, pluginRules, "error")
  const pluginRuleEntries = Object.entries({ ...defaultRules, ...rules })
  return pluginRuleEntries
}

const resolvedPluginRules = Object.fromEntries(enabledPluginEntries.flatMap(toPluginRuleEntries))

const baseConfig = {
  ...nativeConfig,
  jsPlugins: resolvedPluginPackages,
  overrides: [...nativeConfig.overrides, ...pluginOverrides],
  rules: {
    ...resolvedPluginRules,
    ...nativeConfig.rules,
  },
  settings: pluginSettings,
} satisfies OxlintConfig

export const oxlintConfig = createMergeConfigFn<OxlintConfig, typeof baseConfig>(baseConfig)

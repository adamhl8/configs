import type { OxfmtConfig } from "oxfmt"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"
import { resolveProjectTailwind } from "#utils.ts"

const tailwindStylesheet = resolveProjectTailwind()

const baseConfig = {
  printWidth: 120,
  semi: false,
  astro: { allowShorthand: false },
  experimentalOperatorPosition: "start",
  jsdoc: true,
  sortImports: {
    groups: [
      "builtin",
      "external",
      ["subpath", "internal"],
      ["index", "sibling", "parent"],
      "side_effect",
      ["style", "side_effect_style"],
    ],
  },
  sortPackageJson: { sortScripts: true },
  // Sort against the project's stylesheet so classes from plugins and `@theme` are known.
  sortTailwindcss: tailwindStylesheet ? { stylesheet: tailwindStylesheet } : true,
} as const satisfies OxfmtConfig

export const oxfmtConfig = createMergeConfigFn<OxfmtConfig, typeof baseConfig>(baseConfig)

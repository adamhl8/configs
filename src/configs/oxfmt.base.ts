import type { OxfmtConfig } from "oxfmt"

import { createMergeConfigFn } from "#merge-config.ts"
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
      ["side_effect", "side_effect_style"],
      ["type-builtin", "builtin"],
      ["type-external", "external"],
      ["type-subpath", "subpath", "type-internal", "internal"],
      ["type-index", "index", "type-sibling", "sibling", "type-parent", "parent"],
      "style",
    ],
  },
  sortPackageJson: { sortScripts: true },
  // Sort against the project's stylesheet so classes from plugins and `@theme` are known.
  sortTailwindcss: tailwindStylesheet ? { stylesheet: tailwindStylesheet } : true,
} as const satisfies OxfmtConfig

export const oxfmtConfig = createMergeConfigFn<OxfmtConfig, typeof baseConfig>(baseConfig)

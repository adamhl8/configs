import type { OxfmtConfig } from "oxfmt"

import { createMergeConfigFn } from "#/utils.ts"
import type { OptionalMergeConfigFn } from "#/utils.ts"

const baseConfig = {
  printWidth: 120,
  semi: false,
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
  sortTailwindcss: true,
} as const satisfies OxfmtConfig

export const oxfmtConfig: OptionalMergeConfigFn<OxfmtConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

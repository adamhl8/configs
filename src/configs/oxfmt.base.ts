import { existsSync } from "node:fs"

import type { OxfmtConfig } from "oxfmt"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"

const TAILWIND_STYLESHEET = "src/global.css"

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
  // Check the file first because oxfmt fails on every file with class attributes when the stylesheet is missing.
  sortTailwindcss: existsSync(TAILWIND_STYLESHEET) ? { stylesheet: TAILWIND_STYLESHEET } : true,
} as const satisfies OxfmtConfig

export const oxfmtConfig = createMergeConfigFn<OxfmtConfig, typeof baseConfig>(baseConfig)

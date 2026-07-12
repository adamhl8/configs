// oxlint-disable no-template-curly-in-string
import type { Config } from "release-it"

import { createMergeConfigFn } from "#utils.ts"

const baseConfig = {
  hooks: {
    "before:init": "just build",
    "after:bump": ["bun adamhl8-cliff --tag ${version} -o", "bun oxfmt CHANGELOG.md"],
  },
  git: {
    commitMessage: "release: ${version}",
    tagName: "${version}",
    tagAnnotation: "release ${version}",
    addUntrackedFiles: true,
  },
  github: {
    release: true,
    releaseName: "${version}",
    releaseNotes: "bun adamhl8-cliff --unreleased --tag ${version}",
  },
  npm: {
    publishPackageManager: "bun",
    publishPath: "",
    publishArgs: ["--ignore-scripts"],
  },
} as const satisfies Config

export const releaseItConfig = createMergeConfigFn<Config, typeof baseConfig>(baseConfig)

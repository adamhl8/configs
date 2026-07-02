// oxlint-disable no-template-curly-in-string
import type { Config } from "release-it"

import { createMergeConfigFn } from "#/utils.ts"

const baseConfig = {
  git: {
    commitMessage: "release: ${version}",
    tagName: "${version}",
    tagAnnotation: "release ${version}",
    addUntrackedFiles: true,
  },
  hooks: {
    "before:init": "nub run bundle",
    "after:bump": ["adamhl8-cliff --tag ${version} -o", "nubx oxfmt CHANGELOG.md"],
  },
  github: {
    release: true,
    releaseName: "${version}",
    releaseNotes: "adamhl8-cliff --unreleased --tag ${version}",
  },
  npm: {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - release-it doesn't support nub directly yet
    publishPackageManager: "nub" as "bun",
    publishPath: "",
    publishArgs: ["--no-git-checks"],
  },
} as const satisfies Config

export const releaseItConfig = createMergeConfigFn<Config, typeof baseConfig>(baseConfig)

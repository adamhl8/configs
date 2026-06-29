// oxlint-disable no-template-curly-in-string
import type { Config } from "release-it"

import { createMergeConfigFn } from "#/utils.ts"
import type { OptionalMergeConfigFn } from "#/utils.ts"

const baseConfig = {
  git: {
    commitMessage: "release: v${version}",
    tagName: "v${version}",
    tagAnnotation: "version ${version}",
  },
  hooks: {
    "before:init": "nub run bundle",
  },
  github: {
    release: true,
    releaseName: "${version}",
  },
  npm: {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion - release-it doesn't support nub directly yet
    publishPackageManager: "nub" as "bun",
    publishPath: "",
  },
} as const satisfies Config

export const releaseItConfig: OptionalMergeConfigFn<Config, typeof baseConfig> = createMergeConfigFn(baseConfig)

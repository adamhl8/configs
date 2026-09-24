// oxlint-disable no-template-curly-in-string
import type { Config } from "release-it"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"
import { configFilePath } from "#utils.ts"

// release-it's `Hooks` type only lists the hooks of its built-in plugins.
type PluginHooks = Partial<Record<`${"before" | "after"}:${string}`, string | string[]>>
type ReleaseItConfig = Config & { hooks?: PluginHooks }

const baseConfig = {
  hooks: {
    "before:init": "just build",
    "after:release-it-git-cliff:beforeRelease": "bun oxfmt CHANGELOG.md",
  },
  plugins: {
    "release-it-git-cliff": {
      config: configFilePath("cliff.base.toml"),
      output: "CHANGELOG.md",
    },
  },
  git: {
    commitMessage: "release: ${tagName}",
    // Set the `v` explicitly because release-it only detects it from an existing tag.
    tagName: "v${version}",
    tagAnnotation: "release ${tagName}",
    addUntrackedFiles: true,
  },
  github: {
    release: true,
    releaseName: "${tagName}",
  },
  npm: {
    publishPackageManager: "bun",
    publishPath: "",
    publishArgs: ["--ignore-scripts"],
  },
} as const satisfies ReleaseItConfig

export const releaseItConfig = createMergeConfigFn<ReleaseItConfig, typeof baseConfig>(baseConfig)

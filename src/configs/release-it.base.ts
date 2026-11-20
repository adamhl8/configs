// oxlint-disable no-template-curly-in-string - These aren't real string templates, they are templates replaced by release-it
import type { Config } from "release-it"

import { createMergeConfigFn } from "#merge-config.ts"
import { configFilePath } from "#utils.ts"

// release-it's `Hooks` type only lists the hooks of its built-in plugins.
type PluginHooks = Partial<Record<`${"before" | "after"}:${string}`, string | string[]>>
type ReleaseItConfig = Config & { hooks?: PluginHooks }

const baseConfig = {
  hooks: {
    "before:init": "bunx bask build",
    // Rebuild after the version bump because tsdown inlines the `package.json` version into the bundle.
    // Use an array so a project's own `after:bump` array is appended to it instead of replacing it.
    "after:bump": ["bunx bask bundle"],
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

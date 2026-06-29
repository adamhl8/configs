// oxlint-disable no-template-curly-in-string
import { defineConfig } from "oxfmt"

import { releaseItConfig } from "#/index.ts"

const config = releaseItConfig({
  hooks: { "after:bump": ["./src/adamhl8-cliff/index.ts --tag ${version} -o", "nubx oxfmt CHANGELOG.md"] },
  github: {
    releaseNotes: "./src/adamhl8-cliff/index.ts --unreleased --tag ${version}",
  },
} as const)

export default defineConfig(config)

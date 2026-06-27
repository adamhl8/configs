import { defineConfig } from "oxlint"

import { oxlintConfig } from "#/index.ts"

const config = oxlintConfig()

// oxlint-disable-next-line import/no-default-export
export default defineConfig(config)

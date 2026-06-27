import { defineConfig } from "oxfmt"

import { oxfmtConfig } from "#/index.ts"

const config = oxfmtConfig()

// oxlint-disable-next-line import/no-default-export
export default defineConfig(config)

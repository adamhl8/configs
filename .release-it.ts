import { defineConfig } from "oxfmt"

import { releaseItConfig } from "#/index.ts"

const config = releaseItConfig()

export default defineConfig(config)

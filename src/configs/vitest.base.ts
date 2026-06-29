import type { ViteUserConfig } from "vitest/config"

import { createMergeConfigFn } from "#/utils.ts"
import type { OptionalMergeConfigFn } from "#/utils.ts"

const baseConfig = {
  test: {
    coverage: {
      enabled: true,
      reporter: ["text"],
    },
    expect: {
      requireAssertions: true,
    },
  },
} as const satisfies ViteUserConfig

export const vitestConfig: OptionalMergeConfigFn<ViteUserConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

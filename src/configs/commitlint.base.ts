import conventional from "@commitlint/config-conventional"
import { RuleConfigSeverity } from "@commitlint/types"
import type { UserConfig } from "@commitlint/types"

import type { OptionalMergeConfigFn } from "#/utils.ts"
import { createMergeConfigFn } from "#/utils.ts"

const [_severity, _condition, conventionalTypes] = conventional.rules["type-enum"]

const EXCLUDED_TYPES = new Set(["test", "style", "build"])
const filteredTypes = conventionalTypes.filter((type) => !EXCLUDED_TYPES.has(type))
const commitTypes = [...filteredTypes, "release"]

const baseConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [RuleConfigSeverity.Error, "always", commitTypes],
  },
} satisfies UserConfig

export const commitlintConfig: OptionalMergeConfigFn<UserConfig, typeof baseConfig> = createMergeConfigFn(baseConfig)

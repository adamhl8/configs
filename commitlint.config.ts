import conventional from "@commitlint/config-conventional"
import { RuleConfigSeverity } from "@commitlint/types"
import type { UserConfig } from "@commitlint/types"

const [_severity, _condition, conventionalTypes] = conventional.rules["type-enum"]

const EXCLUDED_TYPES = new Set(["test", "style", "build"])
const filteredTypes = conventionalTypes.filter((type) => !EXCLUDED_TYPES.has(type))
const commitTypes = [...filteredTypes, "release"]

const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [RuleConfigSeverity.Error, "always", commitTypes],
  },
} satisfies UserConfig

// oxlint-disable-next-line import/no-default-export
export default config

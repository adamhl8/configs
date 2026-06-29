import type { Preprocessor } from "knip/types/issues"

import { DEFAULT_ENTRIES, IGNORE_DEPENDENCIES_UNLISTED } from "#/configs/knip.base.ts"

const preprocess: Preprocessor = (options) => {
  // Ignore the "Refine entry pattern (no matches)" configuration hints for entries in the base config
  options.configurationHints = options.configurationHints.filter(
    (hint) =>
      !(
        DEFAULT_ENTRIES.some((entry) => typeof hint.identifier === "string" && hint.identifier.includes(entry)) &&
        (hint.type === "entry-empty" || hint.type === "entry-redundant")
      ),
  )

  options.configurationHints = options.configurationHints.filter(
    (hint) =>
      !(
        IGNORE_DEPENDENCIES_UNLISTED.some(
          (dep) => typeof hint.identifier === "string" && hint.identifier.includes(dep),
        ) && hint.type === "ignoreDependencies"
      ),
  )

  return options
}

// oxlint-disable-next-line import/no-default-export
export default preprocess

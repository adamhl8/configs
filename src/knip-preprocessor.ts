import type { Preprocessor } from "knip"

// biome-ignore lint/plugin: ignore
import { knipConfig } from "./index.ts"

const entries = knipConfig().entry as string[]

const preprocess: Preprocessor = (options) => {
  // ignore the "Refine entry pattern (no matches)" configuration hints for entries in the base config
  const filteredConfigurationHints = [...options.configurationHints].filter(
    (hint) =>
      !(typeof hint.identifier === "string" && entries.includes(hint.identifier) && hint.type === "entry-empty"),
  )
  options.configurationHints = new Set(filteredConfigurationHints)
  return options
}

export default preprocess

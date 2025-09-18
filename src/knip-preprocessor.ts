import type { Preprocessor } from "knip"

// biome-ignore lint/plugin: ignore
import { knipConfig } from "./index.ts"

const entries = knipConfig().entry as string[]

const preprocess: Preprocessor = (options) => {
  // ignore the "Refine entry pattern (no matches)" configuration hints for entries in the base config
  const filteredConfigurationHints = [...options.configurationHints].filter(
    (hint) =>
      !(
        entries.some((entry) => typeof hint.identifier === "string" && hint.identifier.includes(entry)) &&
        hint.type === "entry-empty"
      ),
  )
  options.configurationHints = new Set(filteredConfigurationHints)

  const filteredUnlisted = Object.fromEntries(
    Object.entries(options.issues.unlisted).filter(([key]) => !key.includes("prettier")),
  )
  options.issues.unlisted = filteredUnlisted

  return options
}

export default preprocess

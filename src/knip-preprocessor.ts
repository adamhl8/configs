import type { Preprocessor, ReporterOptions } from "knip"
import type { Issue, SymbolIssueType } from "knip/dist/types/issues"

// biome-ignore lint/plugin: ignore
import { knipConfig } from "./index.ts"

const entries = knipConfig().entry as string[]

/**
 * Filters issues based on the provided filter function.
 *
 * This is needed because we also need to update `options.counters` after filtering issues.
 */
function filterIssues(
  options: ReporterOptions,
  issueType: SymbolIssueType,
  filter: (issueEntry: [string, Record<string, Issue>]) => boolean,
) {
  const issuesObject = options.issues[issueType]
  const filteredIssues = Object.fromEntries(Object.entries(issuesObject).filter(filter))

  const issueCount = Object.keys(issuesObject).length
  const filteredIssueCount = Object.keys(filteredIssues).length
  const issuesRemovedCount = issueCount - filteredIssueCount

  options.counters[issueType] = issueCount - issuesRemovedCount
  options.issues[issueType] = filteredIssues
}

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

  filterIssues(options, "unlisted", ([key]) => !key.includes("prettier"))
  filterIssues(options, "unlisted", ([, issueObj]) => Object.keys(issueObj).length > 0)

  return options
}

export default preprocess

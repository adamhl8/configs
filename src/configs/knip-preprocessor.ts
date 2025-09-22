import type { Preprocessor, ReporterOptions } from "knip"
import type { Issue, SymbolIssueType } from "knip/dist/types/issues"

import { knipConfig } from "./knip.ts"

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
        (hint.type === "entry-empty" || hint.type === "entry-redundant")
      ),
  )
  options.configurationHints = new Set(filteredConfigurationHints)

  filterIssues(options, "unlisted", ([key]) => !key.includes("prettier"))
  filterIssues(options, "unlisted", ([, issueObj]) => Object.keys(issueObj).length > 0)

  filterIssues(options, "types", ([key, issueObj]) => {
    if (key !== "src/configs/utils.ts") return true
    const typeNames = Object.keys(issueObj)
    // We need to bring these types into scope of each merge config module: https://github.com/microsoft/TypeScript/issues/5711
    const expectedTypeNames = ["MergeConfigFn", "OptionalMergeConfigFn"]
    if (typeNames.length !== expectedTypeNames.length) return true // don't filter out the issue if there are other types
    const foundAllExpectedTypeNames = expectedTypeNames.every((expectedTypeName) =>
      typeNames.includes(expectedTypeName),
    )
    const shouldFilterIssue = !foundAllExpectedTypeNames // if all the expected type names are found, we need to return false to filter out the issue
    return shouldFilterIssue
  })

  return options
}

export default preprocess

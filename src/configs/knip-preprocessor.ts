import type {
  IssueRecords,
  Preprocessor,
  ReporterOptions,
  SymbolIssueType,
} from "../../node_modules/knip/dist/types/issues.d.ts"
import { knipConfig } from "./knip.ts"

/*
 * The `IssueRecords` type represents an object where each key is the file path and the value is an object containing each issue object.
 *
 * For example:
 *
 * ```ts
 * {
 *   "path/to/file/with/issues.ts": {
 *     "issue1": { ... },
 *     "issue2": { ... },
 *   },
 *   // ...
 * }
 * ```
 */

/** The object containing all the issues for the given file path. */
type IssueRecord = IssueRecords[keyof IssueRecords]
type IssueRecordEntry = [keyof IssueRecord, IssueRecord[keyof IssueRecord]]

/**
 * We transform `IssueRecords` into object entries where where the _value_ is an array of the object entries from each `IssueRecord`.
 *
 * For example, we're going from this:
 *
 * ```ts
 * {
 *   "path/to/file/with/issues.ts": {
 *     "issue1": { ... },
 *     "issue2": { ... },
 *   },
 *   // ...
 * }
 * ```
 *
 * to this:
 *
 * ```ts
 * [
 *   ["path/to/file/with/issues.ts", [["issue1", { ... }], ["issue2", { ... }]]],
 *   // ...
 * ]
 * ```
 */
type IssueRecordsEntry = [keyof IssueRecords, IssueRecordEntry[]]

/**
 * Modifies issues based on the provided map function.
 *
 * This is needed because we also need to update `options.counters` after modifying issues.
 */
function modifyIssues(
  options: ReporterOptions,
  issueType: SymbolIssueType,
  mapFn: (issueRecordsEntry: IssueRecordsEntry) => IssueRecordEntry[], // The mapFn should return the entries for the individual issues. We want to make the key (which is the file path) available, but we don't want to allow modification of the key.
) {
  const originalIssues: IssueRecords = options.issues[issueType]
  const originalIssueEntries: IssueRecordsEntry[] = Object.entries(originalIssues).map(([key, issueRecord]) => [
    key,
    Object.entries(issueRecord),
  ])

  const modifiedIssueEntries = originalIssueEntries.map(
    // The map function receives something like `["path/to/file.ts", [["issue1", { ... }], ["issue2", { ... }]]]`
    // It then returns *only* the entries for the individual issues: `[["issue1", { ... }], ["issue2", { ... }]]`
    ([key, issueRecordEntries]) => [key, Object.fromEntries(mapFn([key, issueRecordEntries]))] as const,
  )
  const modifiedIssues: IssueRecords = Object.fromEntries(modifiedIssueEntries)

  const countIssues = (issueRecords: IssueRecords) =>
    Object.values(issueRecords)
      .map((issueRecord) => Object.keys(issueRecord).length) // count the number of issues in each issue record
      .reduce((acc, curr) => acc + curr, 0)

  const originalIssueCount = countIssues(originalIssues)
  const modifiedIssueCount = countIssues(modifiedIssues)
  const issuesRemovedCount = originalIssueCount - modifiedIssueCount

  options.counters[issueType] = originalIssueCount - issuesRemovedCount
  options.issues[issueType] = modifiedIssues
}

const entries = knipConfig().entry as string[]

const preprocess: Preprocessor = (options) => {
  // ignore the "Refine entry pattern (no matches)" configuration hints for entries in the base config
  options.configurationHints = options.configurationHints.filter(
    (hint) =>
      !(
        entries.some((entry) => typeof hint.identifier === "string" && hint.identifier.includes(entry)) &&
        (hint.type === "entry-empty" || hint.type === "entry-redundant")
      ),
  )

  modifyIssues(options, "unlisted", ([, issueRecordEntries]) =>
    issueRecordEntries.filter(([key]) => !key.includes("prettier")),
  )

  return options
}

export default preprocess

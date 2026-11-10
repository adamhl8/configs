`bask bump-deps` just bumped this project's dependencies and reinstalled them. The changed ranges are listed at the end of this prompt.

Find anything in these updates that matters for this project, and report it. Your report prints to the terminal when the task finishes. The user can resume this session to act on it.

## Research

- Read the project's configs, scripts, and source to see how it uses each package.
- Read the release notes for every version in each range, not just the newest. Use `gh release list` and `gh release view` on the package's repo, or the changelog in its npm package.
- Release notes don't always list new rules or options. For lint plugins and configurable tools, compare the two versions directly. Download the old one with `npm pack` into a temp dir, then diff its rule names, config schema, or types against the installed one.
- Run the project's checks without changing anything: the type checker, the linter without `--fix`, the formatter in check mode, knip, the tests, and the build if there is one.
- When a check fails, confirm which bump caused it. For example, run the previous version with `bunx <package>@<old version>` and compare.

## Rules

- Don't edit, create, or delete files in the project. Put downloads in a directory from `mktemp -d`.
- Don't commit, install, or change dependencies.

## Report

Write plain text that reads well unrendered: short headings, `-` bullets, and no tables. Group findings under these headings and skip empty ones:

- Needs action: failing checks, or config that a bump breaks. Name the file and line, and say what to change. Say whether the linter's `--fix` would rewrite it, and whether that rewrite is safe.
- Worth knowing: new rules, options, or behavior that changes how the project's tools run, and new features the project might want to use.
- Nothing to do: one line per remaining package.

End with one line that lists the checks you ran and whether they passed.

## Changed ranges

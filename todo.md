# Todo

1. Make CI fail when lint or format fixes change files. `_lint` runs `oxlint --fix`, `oxfmt` (write mode), and `markdown-toc -i`, so CI rewrites the checkout and passes. Add a `git diff --exit-code` step after `just build` in `ci.yml`.
2. Stage or reject lefthook's pre-commit fixes. `just build` modifies files but doesn't stage them, so a commit can go in with the pre-fix contents.
3. Lint PR titles with commitlint. Squash merges use `PR_TITLE` as the commit title, and it is only checked after merge by `commitlint --last`. Pipe `github.event.pull_request.title` (via an env var) through `bun commitlint`, and add `edited` to the `pull_request` types.
4. Add actionlint. Fix or inline-disable the SC2088 hit at `.github/workflows/release.yml:48` (`'~/.ssh/signing_key'` in quotes, probably fine because git expands `~` itself).
5. Add zizmor. Expected findings:
   - Template injection from `run: ${{ inputs.before-release }}` (intentional, needs an inline ignore) and `${{ inputs.install-args }}`.
   - `${{ github.event.pull_request.base.sha }}` interpolated directly into `run:`.
   - No top-level `permissions:` in `ci.yml` and `update-deps.yml`.
   - Actions not pinned to a SHA, including `adamhl8/configs/...@main`.
   - `actions/checkout` persisting credentials (`persist-credentials`).
6. Add `just --fmt --check` (passes today).
7. Add `tofu fmt -check -recursive` (passes today, needs no init, so it can run in CI).
8. Add `tofu validate`, and consider tflint.
9. Add typos for spell checking.
10. Use `--frozen-lockfile` (or `bun ci`) by default in the setup action. `update-deps` already overrides `install-args` and can opt out.
11. Set a `coverageThreshold` in `bunfig.base.toml`. Coverage is on but not enforced.
12. Decide whether this package's own build should keep `attw: false` and `publint: false`. The base config enables both as errors for consumers.
13. Consider a Markdown linter (rumdl or markdownlint-cli2). oxfmt formats Markdown but doesn't lint its structure.

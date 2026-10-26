# configs

Configs, tasks, and workflows I use across my TS projects.

- Base configs for `tsconfig`, `oxfmt`, `oxlint`, `knip`, `tsdown`, `commitlint`, `release-it`, and `lefthook`, each extended through a typed merge function
- Shared [bask](https://github.com/adamhl8/bask) tasks for linting, building, testing, and releasing
- `bunfig.toml` and `.gitignore` entries synced into each project
- Reusable GitHub Actions workflows for CI, dependency updates, and releases
- An OpenTofu module for each repo's GitHub settings and Actions secrets
- Utilities for validated env vars and integration tests

---

<!-- toc -->

- [Installation](#installation)
- [Setup](#setup)
- [Configs](#configs)
  - [Config merging](#config-merging)
  - [tsconfig](#tsconfig)
  - [oxfmt](#oxfmt)
  - [oxlint](#oxlint)
  - [knip](#knip)
  - [tsdown](#tsdown)
  - [commitlint](#commitlint)
  - [release-it](#release-it)
  - [lefthook](#lefthook)
- [bask tasks](#bask-tasks)
- [Synced files](#synced-files)
  - [bunfig](#bunfig)
  - [gitignore](#gitignore)
- [Utilities](#utilities)
  - [env](#env)
  - [test](#test)
- [GitHub Actions](#github-actions)
  - [CI](#ci)
  - [Update dependencies](#update-dependencies)
  - [Release](#release)
  - [Secrets](#secrets)
- [GitHub repo settings](#github-repo-settings)
- [Developing this repo](#developing-this-repo)

<!-- tocstop -->

---

## Installation

```sh
bun add -D @adamhl8/configs
```

The tasks run each tool's bin from the project, so install the tools directly too. With bun's `isolated` linker, a bin that's only a dependency of `@adamhl8/configs` isn't on the project's `PATH`.

```sh
bun add -D @adamhl8/bask @commitlint/cli @commitlint/config-conventional @types/bun knip markdown-toc oxfmt oxlint oxlint-tsgolint typescript
```

Some tools are only needed by some projects:

- Published packages: `tsdown publint @arethetypeswrong/core`
- Releases: `release-it release-it-git-cliff` (see [release-it](#release-it))
- Astro projects that use Tailwind: `tailwint @tailwindcss/language-server` (see [bask tasks](#bask-tasks))

## Setup

A project using everything here has these files:

| File                      | Section                                       |
| ------------------------- | --------------------------------------------- |
| `bask.ts`                 | [bask tasks](#bask-tasks)                     |
| `package.json` `prepare`  | [bask tasks](#bask-tasks)                     |
| `tsconfig.json`           | [tsconfig](#tsconfig)                         |
| `oxfmt.config.ts`         | [oxfmt](#oxfmt)                               |
| `oxlint.config.ts`        | [oxlint](#oxlint)                             |
| `knip.ts`                 | [knip](#knip)                                 |
| `tsdown.config.ts`        | [tsdown](#tsdown)                             |
| `commitlint.config.ts`    | [commitlint](#commitlint)                     |
| `.release-it.ts`          | [release-it](#release-it)                     |
| `lefthook.yaml`           | [lefthook](#lefthook)                         |
| `.github/workflows/*.yml` | [GitHub Actions](#github-actions)             |
| `github.tofu`             | [GitHub repo settings](#github-repo-settings) |

`bunfig.toml` and `.gitignore` are kept up to date by the [synced files](#synced-files).

## Configs

### Config merging

Each `fooConfig({ ... })` function deep merges your config into the base config. Arrays are appended to the base array by default. To use arrays as-is instead, put them in a second config object, which is merged the same way except its arrays replace the base array:

```ts
import { oxlintConfig } from "@adamhl8/configs"

const config = oxlintConfig(
  {
    // appended to the base plugins
    plugins: ["my-plugin"],
  },
  {
    // used as-is, the base overrides are dropped
    overrides: [],
  },
)
```

The second config works at any depth: only the arrays you provide are replaced, sibling keys still merge normally, and a key in both objects gets the second object's value. Required keys (e.g. `platform` for `tsdownConfig`) must be provided in the first object. A function with no required keys can be called with no arguments to get the base config as-is.

### tsconfig

```json
// tsconfig.json
{
  "extends": "@adamhl8/configs/tsconfig"
}
```

The base tsconfig adds stricter checks like `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, with no emit and bundler module resolution. It sets `types: ["bun"]`, so the project needs `@types/bun` installed.

### oxfmt

```ts
// oxfmt.config.ts
import { oxfmtConfig } from "@adamhl8/configs"
import { defineConfig } from "oxfmt"

const config = oxfmtConfig({ ... })

export default defineConfig(config)
```

The base uses a 120 character line width and no semicolons, and sorts imports, `package.json`, and Tailwind classes.

In projects that depend on `tailwindcss`, Tailwind classes are sorted against the project's Tailwind stylesheet, so classes from plugins and `@theme` sort correctly. The stylesheet is found the same way the Tailwind language server finds it: the first CSS file, in sorted order, that does `@import "tailwindcss"`. oxfmt has to run from the project root for this to find the file. If it picks the wrong file, set `sortTailwindcss: { stylesheet: "path/to/global.css" }`.

### oxlint

```ts
// oxlint.config.ts
import { oxlintConfig } from "@adamhl8/configs"
import { defineConfig } from "oxlint"

const config = oxlintConfig({ ... })

export default defineConfig(config)
```

The base turns on every rule category as an error, with type-aware linting and type checking, then turns off the rules that don't fit. It also loads these JS plugins with every rule on, except the rules a native rule already covers:

- Always: [bunisms](https://github.com/himynameisdave/eslint-plugin-bunisms), [clean-modules](https://github.com/adamhl8/eslint-plugin-clean-modules), [directive-comments](https://github.com/tunderadev/oxlint-plugin-directive-comments), [e18e](https://github.com/e18e/eslint-plugin), and [regexp](https://github.com/ota-meshi/eslint-plugin-regexp)
- When the project depends on `hono`: [hono](https://github.com/ouka-lab/eslint-plugin-hono)
- When the project depends on `react`: [react-web-api](https://github.com/Rel1cx/eslint-react) and [react-you-might-not-need-an-effect](https://github.com/nickjvandyke/eslint-plugin-react-you-might-not-need-an-effect)
- When the project has a Tailwind stylesheet: [oxlint-tailwindcss](https://github.com/sergioazoc/oxlint-tailwindcss)

The plugins are loaded from `@adamhl8/configs`'s own dependencies, so the project doesn't install them. In a project whose `package.json` has `engines.node`, the bunisms rules are off in `src/` (except in tests), because that code runs on Node.

oxlint-tailwindcss runs every rule except `enforce-sort-order` and `enforce-consistent-line-wrapping` (oxfmt handles these), `enforce-logical` (it conflicts with `enforce-physical`), and `max-class-count`. It reads the design system from the same stylesheet oxfmt sorts against. If that's the wrong file, set `settings: { tailwindcss: { entryPoint: "path/to/global.css" } }`, alongside the oxfmt `sortTailwindcss` override.

### knip

```ts
// knip.ts
import { knipConfig } from "@adamhl8/configs"

export default knipConfig({ ... })
```

The base leaves `fixtures` and `fixture` dirs out of the analysis, at any depth. It adds `**/*.test.ts` and `bask.ts` to the bun plugin's entries rather than the top-level `entry`, so a project's own `entry` doesn't replace knip's default entries. knip doesn't see commands run through bask's `sh`, so a dependency that's only run there goes in `ignoreDependencies`.

### tsdown

```ts
// tsdown.config.ts
import { tsdownConfig } from "@adamhl8/configs"
import { defineConfig } from "tsdown"

const config = tsdownConfig({ platform: "node" })

export default defineConfig(config)
```

The base builds `src/index.ts` as an unbundled ESM library with sourcemaps and type declarations, and checks the package with `attw` and `publint`. Any warning fails the build. `platform` is required.

`tsdownBundleConfig` is also exported for single-file bundles that aren't published libraries: everything is bundled, with no type declarations or publish checks. `tsdownBinConfig` builds `package.json` bin executables: the same bundle for node, with an extensionless output file.

### commitlint

```ts
// commitlint.config.ts
import { commitlintConfig } from "@adamhl8/configs"

export default commitlintConfig({ ... })
```

The allowed commit types are the conventional types without `test`, `style`, and `build`, plus `improve` and `release`. `bunx bask commit-types` prints them.

<details>
<summary><i>Why is <code>@commitlint/config-conventional</code> both a dependency and a peer dependency?</i></summary>

- Dependency: `commitlint.base.ts` imports it to read the conventional commit types.
- Peer dependency: `commitlint.base.ts` also sets `extends: ["@commitlint/config-conventional"]`. commitlint resolves that string from the consumer's project root, not from `@adamhl8/configs`.

With bun's `isolated` linker, our copy lives only in `@adamhl8/configs`'s own `node_modules` and is never hoisted to the consumer's root. So commitlint can't find it unless the consumer installs it directly, which the peer dependency asks them to do.

</details>

### release-it

```ts
// .release-it.ts
import { releaseItConfig } from "@adamhl8/configs"

export default releaseItConfig({ ... })
```

The release config registers the [`release-it-git-cliff`](https://github.com/adamhl8/release-it-git-cliff) plugin with the bundled git-cliff config (`cliff.base.toml`), so there is no per-project `cliff.toml` to write. git-cliff picks the next version from the commits, and the plugin writes `CHANGELOG.md` (formatted with `oxfmt`) and sets the release notes. A release starts by running `bunx bask build`. The release commit is `release: v${version}`, and the tag is `v${version}`. It publishes with `bun publish --ignore-scripts`.

git-cliff must be on `PATH`, and the project needs `release-it-git-cliff` installed directly:

```sh
bun add -D release-it release-it-git-cliff
```

Preview the next version or the unreleased changelog section with `release-it --release-version` or `release-it --changelog`.

<details>
<summary><i>Why does the project install <code>release-it-git-cliff</code>?</i></summary>

`release-it-git-cliff` is an optional peer dependency. release-it resolves plugins from its own location or the working directory, so with bun's `isolated` linker it can't find a plugin that's only a dependency of `@adamhl8/configs`.

</details>

### lefthook

`lefthook.base.yaml` runs `bunx bask build` on pre-commit and `commitlint` on commit-msg. The pre-commit hook fails when the build changes any files, so you can stage the lint fixes and formatting and commit again. Extend it from your `lefthook.yaml`:

```yaml
# lefthook.yaml
extends:
  - node_modules/@adamhl8/configs/dist/configs/lefthook.base.yaml
```

`lefthook install` (the `prepare` task runs it) sets up the hooks.

## bask tasks

Tasks live in a shared [bask](https://github.com/adamhl8/bask) tasks module instead of being copied into every project's `package.json`. Re-export them from your `bask.ts`:

```ts
// bask.ts
export * from "@adamhl8/configs/bask"
```

Run `bunx bask` to list them along with the allowed commit types.

| Task           | What it does                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `lint`         | Updates the README's table of contents, runs oxlint (with fixes), oxfmt, tailwint, `tofu fmt`, knip, and actionlint, then `test` |
| `build`        | Runs `lint`, `tsdown`, and `tofu-check`. In CI, it fails when lint fixes or formatting changed any files                         |
| `test`         | Runs `bun test`, which passes when there are no tests                                                                            |
| `bump-deps`    | Updates every dependency to its latest version, then reinstalls without the lockfile, `node_modules`, or bun's cache             |
| `release`      | Starts the [release workflow](#release) (`gh workflow run release.yml`)                                                          |
| `release-run`  | Runs `release-it --ci`. It's hidden because only the release workflow runs it                                                    |
| `tofu-check`   | Runs `tofu plan` to check the [GitHub repo settings](#github-repo-settings) for drift                                            |
| `commit-types` | Prints the allowed commit types                                                                                                  |
| `prepare`      | Runs `lefthook install`, the [synced files](#synced-files), and `tofu init -upgrade`                                             |

The tasks skip the steps a project doesn't need, so projects can use them as-is:

- `lint` runs tailwint only when the project has a Tailwind stylesheet and `.astro` files, `tofu fmt` only when it has tofu files, and actionlint only when it has `.github/workflows`. The table of contents only changes in a README with [markdown-toc](https://github.com/jonschlinkert/markdown-toc)'s `toc` and `tocstop` comment markers.
- `build` runs `tsdown` only when the project has a `tsdown.config.ts`.
- `tofu-check` and `tofu init` run only outside CI, in a project with a root `.tofu` file, on a machine with the `adamhl8` AWS profile.
- `prepare` skips `lefthook install` in CI, so commits made by the workflows don't run the hooks.

tailwint runs on `.astro` files because oxlint can't see Astro markup. It only checks and never fixes, because tailwint resolves a class conflict by deleting a class by position, not by which one wins. Projects with `.astro` files install it:

```sh
bun add -D tailwint @tailwindcss/language-server
```

Both are optional peer dependencies. bask runs `bun tailwint` from the project, so with bun's `isolated` linker the bin has to be installed by the project, not just by `@adamhl8/configs`.

To customize a task, add hooks to it from your `bask.ts`. A hook also runs when another base task calls that task, so extending `lint` extends `build` too:

```ts
// bask.ts
import { task } from "@adamhl8/bask"
import { bumpDeps, lint } from "@adamhl8/configs/bask"

export * from "@adamhl8/configs/bask"

export const astroSync = task(async ({ sh }) => {
  await sh`astro sync`
})

lint.before(astroSync)
bumpDeps.after(async ({ sh }) => {
  await sh`prisma generate`
})
```

The only script left in `package.json` is `prepare`, which hands off to bask:

```json
"scripts": {
  "prepare": "bask prepare"
}
```

The `prepare` script and task `sh` calls run local bins by their bare name, because `bun run` and bask both put `node_modules/.bin` on `PATH`. Git hooks and the workflows run `bunx bask` rather than `bun bask`, because `bun bask` runs `bask.ts` instead of the bask bin.

## Synced files

### bunfig

bun has no extends mechanism for `bunfig.toml`, so shared settings are synced into the project's `bunfig.toml`. The `prepare` task runs the `adamhl8-bunfig` bin, which merges the shared base config (`bunfig.base.toml`) with the project's `bunfig.toml` and writes the result back. `prepare` then formats it with oxfmt. The project's values win over the base's, arrays merge by index, and a project without a `bunfig.toml` gets the base config as-is.

The base config:

- turns on coverage for `bun test`, leaving out test files and `__tests__` dirs
- only prints failing tests
- runs `**/*.test.ts` files concurrently
- skips `fixtures` and `fixture` dirs at any depth
- uses the isolated install linker
- makes `bun run` run scripts with bun instead of node

Because the merged result is written back, a change to a base value doesn't reach a project that already has that key. Delete the key from the project's `bunfig.toml` and run the sync again to pick it up.

Since the file is regenerated from the merged config, comments in `bunfig.toml` don't survive the sync. The sync can also be run manually by running `adamhl8-bunfig`.

### gitignore

git has no include mechanism for `.gitignore`, so shared entries are synced into the project's `.gitignore`. The `prepare` task runs the `adamhl8-gitignore` bin, which keeps the shared list at the top of the file above a marker line: the first run prepends it, later runs replace everything above the marker with the current shared list, so changes propagate on package updates:

```gitignore
node_modules/
dist/
# The above patterns are managed by @adamhl8/configs. Anything manually added above this line will be replaced.

# project-specific entries go below the marker
.env.local
```

Everything below the marker is left untouched. The sync can also be run manually by running `adamhl8-gitignore`.

## Utilities

### env

Utilities for validated environment variables, exported from the `/env` subpath:

```ts
import { parseEnv, requireWhen } from "@adamhl8/configs/env"

const isProd = process.env["NODE_ENV"] === "production"

export const env = parseEnv({
  API_URL: "string.url",
  // required in production, optional otherwise
  SENTRY_DSN: requireWhen(isProd, "string.url"),
})
```

`parseEnv` is `arkenv` with friendlier failures: invalid env prints the validation message and exits instead of throwing. `requireWhen` makes a var required while its condition is true and optional otherwise. An optional third argument supplies a fallback for when the var is unset (the fallback is exempt from validation, a set value never is).

### test

Helpers for integration tests that run real commands in temp dirs, exported from the `/test` subpath. They're built on Bun's shell, as a replacement for `execa`:

```ts
import { copyFixture, minimalEnv, packPackage } from "@adamhl8/configs/test"

const tarball = await packPackage(ROOT) // once per run, like in a preload's `beforeAll`
const { dir, run } = await copyFixture(FIXTURE, { shell: { env: minimalEnv() } })
await run`bun add -d ${tarball}`

const { stdout, stderr, exitCode } = await run`my-cli --version`
// Like Bun's `$`, a command's own settings chain before it's awaited and don't change the shell.
const { exitCode: failedCode } = await run`my-cli --bad-flag`.nothrow()
```

- `createShell(options)` returns a shell that runs commands quietly. Awaiting a command returns its `stdout` and `stderr` (with one trailing newline stripped) plus its `exitCode`.
  - `cwd` defaults to `process.cwd()`.
  - `env` replaces `process.env` instead of merging into it. It defaults to `process.env` without `FORCE_COLOR`, which `bask` sets in a terminal.
  - `localBins` (default `true`) puts `node_modules/.bin` of the cwd and each of its parents first on `PATH`.
  - `throws` (default `true`) makes a non-zero exit code throw Bun's `ShellError`, which `bun test` prints with its `exitCode`, `stdout`, and `stderr`.
  - Each command can chain `.cwd()`, `.env()` (merged over the shell's), `.localBins()`, and `.nothrow()`.
  - The `node` shims from `bask` and `bun run --bun` are taken off `PATH`, so `node` is always the real Node.
  - Commands read the test runner's stdin, so add `< /dev/null` to a command that might prompt.
- `copyFixture(fixture, { prefix, shell })` copies a fixture dir into a temp dir and returns the `dir` plus a `run` shell bound to it. `shell` takes the `createShell` options except `cwd`.
- `packPackage(root)` runs `bun tsdown` when `root` has a `tsdown.config.ts`, then packs it with `bun pm pack --ignore-scripts` into a temp dir, and returns the tarball path.
- `minimalEnv(extra)` returns just `PATH` and `HOME`, plus `extra`.
- `makeTempDir(prefix)` makes a temp dir that's removed after the test run. `copyFixture` and `packPackage` use it.

The temp dirs are removed by a preload, which each project adds to its `bunfig.toml`:

```toml
[test]
preload = ["@adamhl8/configs/test/preload"]
```

A project with its own preload imports it at the top of that file instead, so all of its test setup stays in one place:

```ts
import "@adamhl8/configs/test/preload"
```

It isn't in the shared bunfig base because `adamhl8-bunfig` merges arrays by index, so a project's own `preload` would replace it.

## GitHub Actions

This repo hosts three reusable workflows you can call from other projects instead of copy/pasting them. The calling project must use `bun`, have a `bask.ts` that re-exports the base tasks (see [bask tasks](#bask-tasks)), and have a commitlint config (e.g. via these configs). The workflows set up bun, actionlint, and OpenTofu themselves.

- `ci.yml`: runs `build` on pushes and PRs, and lints the commit message on pushes and the PR title on PRs
- `update-deps.yml`: weekly `bump-deps` run that opens a dependency-update PR
- `release.yml`: manually dispatched release where git-cliff sets the version, then publishes to npm and cuts a GitHub release (commit and tag signed)

Reference `@main` for latest, or pin to a release tag or commit SHA to update deliberately.

### CI

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, edited, synchronize, reopened]
jobs:
  ci:
    uses: adamhl8/configs/.github/workflows/ci.yml@main
```

On a PR, CI lints the PR title instead of the PR's commits, because squash merges (the only merge type the [GitHub repo settings](#github-repo-settings) allow) use the title as the commit message. The `edited` type reruns the title check when the title changes. An edit skips the build, because it only changes the title or body.

The `bunx bask build` step runs with `GITHUB_TOKEN` set, for builds that call the GitHub API. It comes from the optional `GH_TOKEN` secret (see [Secrets](#secrets)): the names differ because Actions secrets can't be named `GITHUB_*`, so a build reading `GITHUB_TOKEN` can't be fed by a secret of the same name.

When the secret is unset it falls back to the workflow's auto-provisioned token, so fork PRs (which receive no secrets) still build. To supply your own token, pass it. Prefer naming it over `secrets: inherit` here: CI runs on every PR, so it shouldn't be handed the release and deploy secrets it never uses.

```yaml
jobs:
  ci:
    uses: adamhl8/configs/.github/workflows/ci.yml@main
    secrets:
      GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### Update dependencies

Needs the `CI_TOKEN` secret (see [Secrets](#secrets)).

```yaml
# .github/workflows/update-deps.yml
name: Update dependencies
on:
  schedule:
    - cron: "0 13 * * 5" # Fridays, 13:00 UTC
  workflow_dispatch: {}
jobs:
  update-deps:
    uses: adamhl8/configs/.github/workflows/update-deps.yml@main
    secrets: inherit
```

### Release

Manually dispatched. `release-it` uses git-cliff (via `release-it-git-cliff`, see [release-it](#release-it)) to compute the next version from the commits, then bumps `package.json`, regenerates the changelog, commits and tags (both SSH-signed), publishes to npm, and cuts a GitHub release. There is no automatic trigger, so run it when a release is ready (the `release` task just does `gh workflow run release.yml`). A dispatch with no releasable commits fails fast because the plugin finds nothing to release.

Needs the `CI_SIGNING_KEY` secret, and `NPM_CI_TOKEN` to publish to npm (see [Secrets](#secrets)). The workflow installs git-cliff and runs the `release-run` task: `release-it --ci`.

```yaml
# .github/workflows/release.yml
name: Release
on:
  workflow_dispatch: {}
jobs:
  release:
    permissions:
      contents: write
    uses: adamhl8/configs/.github/workflows/release.yml@main
    secrets: inherit
```

Pass `before-release` to run shell commands after the install, just before the release, such as installing system tools the build needs:

```yaml
jobs:
  release:
    permissions:
      contents: write
    uses: adamhl8/configs/.github/workflows/release.yml@main
    with:
      before-release: |
        sudo apt update
        sudo apt install -y fontforge
    secrets: inherit
```

#### Docker

Pass `docker-image` to build the repo's `Dockerfile` and push it to `ghcr.io/<owner>/<docker-image>:latest` once the release lands. The image name is separate from the repo name, since they often differ. Omit the input and no image is built.

The build checks out the tag the release just created, not `main`, so the image matches the released commit. Callers that use it must also grant `packages: write`, because a called workflow's permissions are capped by what the calling job grants.

The optional `GH_TOKEN` secret is passed to the build as a BuildKit secret named `GH_TOKEN`, for images whose build calls the GitHub API. Mount it in the Dockerfile with `RUN --mount=type=secret,id=GH_TOKEN,env=GITHUB_TOKEN`. A Dockerfile that doesn't mount it is unaffected.

To deploy after the push, add a job that needs the release. A job waiting on a called workflow waits for all of its jobs, so it runs after the image is pushed.

```yaml
jobs:
  release:
    permissions:
      contents: write
      packages: write
    uses: adamhl8/configs/.github/workflows/release.yml@main
    with:
      docker-image: actual-budget-venmo-importer
    secrets: inherit
```

### Secrets

The [GitHub repo settings](#github-repo-settings) module sets these on each repo that uses the workflows. To set them by hand, use Settings -> Secrets and variables -> Actions.

| Secret           | Used by                          | What it is                                                                                                                                                                                                                        |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CI_TOKEN`       | `update-deps.yml`, `release.yml` | PAT with `contents` and `pull-requests` write, so the opened PR triggers CI. `release.yml` passes it to the release step as `CI_TOKEN`, for release hooks that need it.                                                           |
| `GH_TOKEN`       | `ci.yml`, `release.yml`          | Optional. PAT for a build that calls the GitHub API. Reaches a `ci.yml` build as `GITHUB_TOKEN`, and a `release.yml` docker build as the `GH_TOKEN` BuildKit secret. Unset, the `ci.yml` build falls back to the automatic token. |
| `NPM_CI_TOKEN`   | `release.yml`                    | npm automation token with publish access                                                                                                                                                                                          |
| `CI_SIGNING_KEY` | `release.yml`                    | Private SSH key that signs the release commit and tag. Add the matching public key to your GitHub account as a Signing Key so the signature verifies as you. Use a dedicated, passphrase-less key, not your personal auth key.    |

`GITHUB_TOKEN` is provided automatically. The release wrapper grants it `contents: write` to push the release commit and tag and to create the GitHub release.

## GitHub repo settings

The `github` OpenTofu module manages a repo's GitHub settings and its Actions [secrets](#secrets). Use it from the project's `github.tofu`:

```hcl
# github.tofu
terraform {
  backend "s3" {
    profile = "adamhl8"
    bucket  = "<state-bucket>"
    key     = "adamhl8/<repo>.tfstate"
    region  = "<region>"
  }
}

module "github" {
  source    = "./node_modules/@adamhl8/configs/dist/tofu/github"
  repo_name = "<repo>"
  actions_secrets = {
    NPM_CI_TOKEN = true
  }
  repo_settings = {
    visibility = "public"
  }
}
```

The repo's description, homepage, and topics come from the `description`, `homepage`, and `keywords` in `package.json`. A homepage that points at the repo itself is left out. The repo only allows squash merges, which use the PR title as the commit message, and deletes branches once they're merged. Secret scanning, push protection, and vulnerability alerts are on.

`actions_secrets` picks the secrets to set. `CI_SIGNING_KEY` and `CI_TOKEN` are on by default, and `NPM_CI_TOKEN` and `GH_TOKEN` are off. `additional_secrets` adds other secrets by name. Each value is read from `~/homelab/secrets/credentials.yaml` (a sops file) under the secret's lowercased name. A plan fails when the repo has a secret the module doesn't manage.

The `prepare` task runs `tofu init -upgrade`, and the `tofu-check` task (which `build` runs) checks for drift with `tofu plan`. See [bask tasks](#bask-tasks) for when they run.

## Developing this repo

bun links a dependency's `package.json` bin executables into the local `node_modules/.bin`, but not the bins of the package being developed itself. This repo depends on itself (`"@adamhl8/configs": "file:."`) so that its own bins can be run directly, e.g. `adamhl8-bunfig` instead of `src/adamhl8-bunfig/index.ts`. That's also why this repo's `bask.ts` runs `tsdown` before the `prepare` task: the bins point at `dist/`, so those builds need to be available.

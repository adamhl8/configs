# configs

Configs (`tsconfig`, `oxfmt`, `oxlint`, etc.) I use across my projects.

```sh
bun add -D @adamhl8/configs
```

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

The second config works at any depth: only the arrays you provide are replaced, sibling keys still merge normally, and a key in both objects gets the second object's value. Required keys (e.g. `platform` for `tsdownConfig`) must be provided in the first object.

### just

Scripts live in a shared [`just`](https://github.com/casey/just) base justfile instead of being copied into every project's `package.json`. Your `justfile`:

```just
import "node_modules/@adamhl8/configs/dist/configs/justfile.base.just"
```

It provides `lint`, `build`, `test`, `bump-deps`, `release`, `release-run`, and `prepare`. Run `just` to list them. `build` only runs `tsdown` if the project has a `tsdown.config.ts`, and `test` (`bun test`) passes when there are no tests, so projects without a build step or tests can use them as-is.

To customize a recipe, redefine it in your `justfile`. Each public recipe is a thin wrapper over a private `_recipe` that holds the actual body, so an override can still run the original instead of copying it:

```just
# add steps after the original: dependencies run first, then the body
prepare: _prepare
    tsdown

# add steps before and after: deps before `&&` run first, deps after run last
bump-deps: my-setup _bump-deps && my-cleanup
```

The only script left in `package.json` is `prepare`, which hands off to just:

```json
"scripts": {
  "prepare": "just prepare"
}
```

The base justfile puts `node_modules/.bin` on `PATH`, so recipes can call package bins directly, just like `package.json` scripts.

### tsconfig

```json
{
  "extends": "@adamhl8/configs/tsconfig"
}
```

The base tsconfig sets `types: ["bun"]`, so the project needs `@types/bun` installed.

### oxfmt

```ts
import { oxfmtConfig } from "@adamhl8/configs"
import { defineConfig } from "oxfmt"

const config = oxfmtConfig({ ... })

export default defineConfig(config)
```

### oxlint

```ts
import { oxlintConfig } from "@adamhl8/configs"
import { defineConfig } from "oxlint"

const config = oxlintConfig({ ... })

export default defineConfig(config)
```

### knip

```ts
import { knipConfig } from "@adamhl8/configs"

export default knipConfig({ ... })
```

### tsdown

```ts
import { tsdownConfig } from "@adamhl8/configs"
import { defineConfig } from "tsdown"

const config = tsdownConfig({ ... })

export default defineConfig(config)
```

`tsdownBinConfig` is also exported for building `package.json` bin executables: a bundled, single-file, extensionless build with no type declarations.

### commitlint

```ts
import { commitlintConfig } from "@adamhl8/configs"

export default commitlintConfig({ ... })
```

### release-it

```ts
import { releaseItConfig } from "@adamhl8/configs"

export default releaseItConfig({ ... })
```

The release config wires up its hooks to use `adamhl8-cliff` for the changelog and release notes, so the two are meant to be used together. It publishes with `bun publish`.

### git-cliff

There is no per-project file to write. The `adamhl8-cliff` bin wraps `git-cliff` with the bundled config (`cliff.base.toml`), so run it in place of `git-cliff`:

```sh
adamhl8-cliff --bumped-version
```

`releaseItConfig` already calls it to build the changelog and release notes.

### lefthook

`lefthook.base.yaml` runs `just lint` on pre-commit and `commitlint` on commit-msg. Extend it from your `lefthook.yaml`:

```yaml
# lefthook.yaml
extends:
  - node_modules/@adamhl8/configs/dist/configs/lefthook.base.yaml
```

`lefthook install` (the base justfile's `prepare` recipe runs it) sets up the hooks.

### bunfig

bun has no extends mechanism for `bunfig.toml`, so shared settings are synced into the project's `bunfig.toml`. The base justfile's `prepare` recipe runs the `adamhl8-bunfig` bin, which merges the shared base config (`bunfig.base.toml`) with the project's `bunfig.toml` and writes the result back. The project's values win over the base's, and a project without a `bunfig.toml` gets the base config as-is.

The base config turns on coverage for `bun test` (showing only failures), runs `**/*.test.ts` files concurrently, ignores `fixtures/` directories, uses the isolated install linker, and makes `bun run` run scripts with bun instead of node.

Since the file is regenerated from the merged config, comments in `bunfig.toml` don't survive the sync. The sync can also be run manually by running `adamhl8-bunfig`.

### gitignore

git has no include mechanism for `.gitignore`, so shared entries are synced into the project's `.gitignore`. The base justfile's `prepare` recipe runs the `adamhl8-gitignore` bin, which keeps the shared list at the top of the file above a marker line: the first run prepends it, later runs replace everything above the marker with the current shared list, so changes propagate on package updates:

```gitignore
node_modules/
dist/
# The above patterns are managed by @adamhl8/configs. Anything manually added above this line will be replaced.

# project-specific entries go below the marker
.env.local
```

Everything below the marker is left untouched. The sync can also be run manually by running `adamhl8-gitignore`.

## GitHub Actions

This repo hosts three reusable workflows you can call from other projects instead of copy/pasting them. The calling project must use `bun`, have a `justfile` that imports the base justfile (see [just](#just)), and have a commitlint config (e.g. via these configs). The workflows set up bun and install just and lefthook themselves.

- `ci.yml`: runs `build` (build + lint) on pushes/PRs and lints commit messages with commitlint
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
jobs:
  ci:
    uses: adamhl8/configs/.github/workflows/ci.yml@main
```

The `just build` step runs with `GITHUB_TOKEN` set, for builds that call the GitHub API. It comes from the optional `GH_TOKEN` secret (see [Secrets](#secrets)): the names differ because Actions secrets can't be named `GITHUB_*`, so a build reading `GITHUB_TOKEN` can't be fed by a secret of the same name.

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

Manually dispatched. git-cliff computes the next version from the commits, then `release-it` bumps `package.json`, regenerates the changelog, commits and tags (both SSH-signed), publishes to npm, and cuts a GitHub release. There is no automatic trigger, so run it when a release is ready (the `release` recipe just does `gh workflow run release.yml`). A dispatch with no releasable commits fails fast at release-it's `Version not changed`.

Needs the `NPM_CI_TOKEN` and `CI_SIGNING_KEY` secrets (see [Secrets](#secrets)). The workflow runs the base justfile's `release-run` recipe: `release-it --ci -i "$(adamhl8-cliff --bumped-version)"`.

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

Configure these on each repo that uses the workflows (Settings -> Secrets and variables -> Actions):

| Secret           | Used by                 | What it is                                                                                                                                                                                                                        |
| ---------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CI_TOKEN`       | `update-deps.yml`       | PAT with `contents` and `pull-requests` write, so the opened PR triggers CI                                                                                                                                                       |
| `GH_TOKEN`       | `ci.yml`, `release.yml` | Optional. PAT for a build that calls the GitHub API. Reaches a `ci.yml` build as `GITHUB_TOKEN`, and a `release.yml` docker build as the `GH_TOKEN` BuildKit secret. Unset, the `ci.yml` build falls back to the automatic token. |
| `NPM_CI_TOKEN`   | `release.yml`           | npm automation token with publish access                                                                                                                                                                                          |
| `CI_SIGNING_KEY` | `release.yml`           | Private SSH key that signs the release commit and tag. Add the matching public key to your GitHub account as a Signing Key so the signature verifies as you. Use a dedicated, passphrase-less key, not your personal auth key.    |

`GITHUB_TOKEN` is provided automatically. The release wrapper grants it `contents: write` to push the release commit and tag and to create the GitHub release.

## Notes

The `prepare` script is `"prepare": "just prepare"`, which runs the base justfile's `prepare` recipe (`lefthook install`, the `.gitignore` sync, and the `bunfig.toml` sync).

bun links a dependency's `package.json` bin executables into the local `node_modules/.bin`, but not the bins of the package being developed itself. This repo depends on itself (`"@adamhl8/configs": "file:."`) so that its own bins can be run directly, e.g. `adamhl8-cliff` instead of `src/adamhl8-cliff/index.ts`. That's also why this repo overrides the `prepare` recipe to first run `tsdown`: the bins point at `dist/`, so those builds need to be available.

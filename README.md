# configs

Configs (`tsconfig`, `oxfmt`, `oxlint`, etc.) I use across my projects.

```sh
nub add -D @adamhl8/configs
```

### tsconfig

```json
{
  "extends": "@adamhl8/configs/tsconfig"
}
```

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

### vitest

```ts
import { vitestConfig } from "@adamhl8/configs"
import { defineConfig } from "vitest/config"

const config = vitestConfig({ ... })

export default defineConfig(config)
```

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

The release config wires up its hooks to use `adamhl8-cliff` for the changelog and release notes, so the two are meant to be used together.

### git-cliff

There is no per-project file to write. The `adamhl8-cliff` bin wraps `git-cliff` with the bundled config (`cliff.base.toml`), so run it in place of `git-cliff`:

```sh
adamhl8-cliff --bumped-version
```

`releaseItConfig` already calls it to build the changelog and release notes.

### lefthook

`lefthook.base.yaml` runs `lint` on pre-commit and `commitlint` on commit-msg. Extend it from your `lefthook.yaml`:

```yaml
# lefthook.yaml
extends:
  - node_modules/@adamhl8/configs/dist/configs/lefthook.base.yaml
```

`lefthook install` (run it from `prepare`) sets up the hooks.

## GitHub Actions

This repo hosts three reusable workflows you can call from other projects instead of copy/pasting them. The calling project must use `nub` and define `lint` / `bundle` / `bump-deps` / `release:run` scripts and a commitlint config (e.g. via these configs).

- `ci.yml`: runs `bundle` (build + lint) on pushes/PRs and lints commit messages with commitlint
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

Manually dispatched. git-cliff computes the next version from the commits, then `release-it` bumps `package.json`, regenerates the changelog, commits and tags (both SSH-signed), publishes to npm, and cuts a GitHub release. There is no automatic trigger, so run it when a release is ready (the `release` script just does `gh workflow run release.yml`). A dispatch with no releasable commits fails fast at release-it's `Version not changed`.

Needs the `NPM_CI_TOKEN` and `CI_SIGNING_KEY` secrets (see [Secrets](#secrets)). The calling project must define `release` and `release:run` scripts, where `release:run` is `release-it --ci -i "$(adamhl8-cliff --bumped-version)"`.

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

### Secrets

Configure these on each repo that uses the workflows (Settings -> Secrets and variables -> Actions):

| Secret           | Used by           | What it is                                                                                                                                                                                                                     |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CI_TOKEN`       | `update-deps.yml` | PAT with `contents` and `pull-requests` write, so the opened PR triggers CI                                                                                                                                                    |
| `NPM_CI_TOKEN`   | `release.yml`     | npm automation token with publish access                                                                                                                                                                                       |
| `CI_SIGNING_KEY` | `release.yml`     | Private SSH key that signs the release commit and tag. Add the matching public key to your GitHub account as a Signing Key so the signature verifies as you. Use a dedicated, passphrase-less key, not your personal auth key. |

`GITHUB_TOKEN` is provided automatically. The release wrapper grants it `contents: write` to push the release commit and tag and to create the GitHub release.

## Notes

The `prepare` script looks like: `"prepare": "lefthook install && tsdown"`

nub installs `package.json` bin executables into the local `node_modules/.bin`. This means that we can run something like `adamhl8-knip` directly instead of doing `src/adamhl8-knip/index.tx`. That's why we have `tsdown` in the prepare script. Those executables need to be available.

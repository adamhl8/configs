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

This repo hosts two reusable workflows you can call from other projects instead of copy/pasting them. The calling project must use `nub` and define `lint` / `bundle` / `bump-deps` scripts and a commitlint config (e.g. via these configs).

- `ci.yml`: runs `bundle` (build + lint) on pushes/PRs and lints commit messages with commitlint
- `update-deps.yml`: weekly `bump-deps` run that opens a dependency-update PR

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

Requires a `CI_TOKEN` repo secret (a PAT with `contents` and `pull-requests` write) so the opened PR triggers the CI workflow.

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

## Notes

The `prepare` script looks like: `"prepare": "lefthook install && nub ./patch-knip.ts && tsdown"`

nub installs `package.json` bin executables into the local `node_modules/.bin`. This means that we can run something like `adamhl8-knip` directly instead of doing `src/adamhl8-knip/index.tx`. That's why we have `tsdown` in the prepare script. Those executables need to be available.

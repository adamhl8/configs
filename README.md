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

### oxfmt / oxlint

```ts
import { oxfmtConfig } from "@adamhl8/configs"
import { defineConfig } from "oxfmt"

const config = oxfmtConfig({ ... })

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

### vitest

```ts
import { vitestConfig } from "@adamhl8/configs"
import { defineConfig } from "vitest/config"

const config = vitestConfig({ ... })

export default defineConfig(config)
```

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

import { task } from "@adamhl8/bask"

import { prepare } from "#configs/bask.base.ts"

export * from "#configs/bask.base.ts"

export const tsdown = task(async ({ sh }) => {
  await sh`bun tsdown`
})

// On a fresh install, bun skips linking this package's own bins because `dist/` doesn't exist yet.
// Re-link after `tsdown` builds them, with `--ignore-scripts` so `prepare` doesn't run again.
export const relink = task(async ({ sh }) => {
  await sh`bun install --ignore-scripts --no-summary`
})

prepare.before(tsdown, relink)

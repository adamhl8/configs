// Migrate to ArkEnv 1.0 once it's stable, because 1.0 turns the `arkenv` package into its CLI.
// Importing `arkenv` as a library throws on 1.0.
// Swap the `arkenv` dependency for `@arkenv/core`, and import from it here and in `utils.ts`.
// Rewrite `parseEnv` with `arkenv` from `@arkenv/core/safe` and `formatIssues` from `@arkenv/core/issues`.
// That lets us drop `ts-explicit-errors`, which nothing else uses.
// Fix `requireWhen` so its `unset` placeholder stops leaking into errors like "must be a number or a symbol".
// Check whether the RC still prints "(was [REDACTED])" for a missing secret-looking key, where 0.12 says "(was missing)".
// Look at the new features we might use:
// - `emptyAsUndefined`, so `PORT=` in a `.env` file counts as unset and defaults apply
// - `onUndeclaredKey: "reject"`, to fail on keys the schema doesn't declare
// - issue `code`s like `MISSING_VARIABLE` on `ArkEnvError`
// - `arkenv check`, to validate the env in CI
import process from "node:process"

import arkenv from "arkenv"
import { attempt, isErr } from "ts-explicit-errors"

type ArkEnv = typeof arkenv

export const parseEnv = ((...args: Parameters<ArkEnv>) => {
  const env = attempt(() => arkenv(...args))
  if (isErr(env)) {
    console.error(env.message)
    process.exit(1)
  }
  return env
}) as ArkEnv

export { requireWhen } from "#env/utils.ts"

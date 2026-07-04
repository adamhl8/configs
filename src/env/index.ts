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

export { requireWhen } from "#/env/utils.ts"

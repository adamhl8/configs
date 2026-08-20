import { type as arkenvType } from "arkenv"
import type { type as arktype } from "arktype"

/**
 * Makes an env var required while `when` is true, otherwise optional.
 *
 * A set value must always satisfy `def`. An unset var takes `fallback` (exempt from `def` validation), or the key is
 * omitted entirely if no fallback is given.
 */
export function requireWhen<const def>(
  when: boolean,
  type: arktype.validate<def>,
): ReturnType<arktype.instantiate<def>["optional"]>
export function requireWhen<const def>(
  when: boolean,
  type: arktype.validate<def>,
  fallback: arktype.infer<def>,
): arktype.instantiate<def>
/* oxlint-disable typescript/no-unsafe-type-assertion */
export function requireWhen(when: boolean, type: unknown, ...rest: [unknown?]): never {
  const t = arkenvType.raw(type)
  if (when) return t as never
  if (rest.length === 0) return t.optional() as never
  const [fallback] = rest
  // defaulting to a sentinel keeps the fallback exempt from def validation without
  // letting an explicitly set value bypass it (env values can never be a symbol)
  const unset = Symbol("unset")
  return t
    .or(arkenvType.unit(unset))
    .pipe((v: unknown) => (v === unset ? fallback : v))
    .default(unset as never) as never
}

import { cloneDeep, isPlainObject, mergeWith } from "es-toolkit"
import type { MergeDeep, ReadonlyDeep, WritableDeep, SimplifyDeep } from "type-fest"

type AnyObj = object
type AnyFunction = (...args: never[]) => unknown

/**
 * How a wrapped user array is combined with the base array. - `"merge"` (the default for plain arrays): the user array
 * is appended to the base array - `"replace"`: the user array is used as-is
 */
type ArrayMergeMode = "merge" | "replace"

/**
 * A per-key array override. Wherever a config key takes an array, `{ value: [...], mode: "merge" | "replace" }` may be
 * passed instead; `mode` controls how that key's array combines with the base config's. The wrapper never appears in
 * the merged result. A config value that is exactly this shape is always consumed as a wrapper; an object with extra
 * keys is treated as a plain config object.
 */
interface ArrayOverride<Value extends readonly unknown[], Mode extends ArrayMergeMode = ArrayMergeMode> {
  readonly value: Value
  readonly mode: Mode
}

/** Runtime wrapper check, mirrored by IsArrayOverride: plain object with exactly the keys value (array) + mode. */
const isArrayOverride = (v: unknown): v is { value: unknown[]; mode: ArrayMergeMode } => {
  if (!isPlainObject(v)) return false
  if (Object.keys(v).length !== 2) return false
  const { value } = v
  const { mode } = v
  return Array.isArray(value) && (mode === "merge" || mode === "replace")
}

/**
 * A wrapper around es-toolkit's `mergeWith` with a custom merge function that concatenates arrays, honoring per-key
 * ArrayOverride wrappers. Wrapper interception must come first: the default path would deep-merge the wrapper as a
 * plain object.
 */
const merge = <T extends AnyObj, S extends AnyObj>(target: T, source: S): T & S =>
  mergeWith(target, source, (objValue: unknown, srcValue: unknown) => {
    if (isArrayOverride(srcValue)) {
      const { value: userArray, mode } = srcValue
      if (!Array.isArray(objValue)) return userArray
      const baseArray: unknown[] = objValue
      return mode === "merge" ? [...baseArray, ...userArray] : userArray
    }
    if (!Array.isArray(objValue)) return
    if (!Array.isArray(srcValue)) return srcValue
    const baseArray: unknown[] = objValue
    const userArray: unknown[] = srcValue
    return [...baseArray, ...userArray]
  })

/** True only when T is exactly the wrapper shape (keys value + mode, nothing else), mirroring isArrayOverride. */
type IsArrayOverride<T> = T extends { readonly value: readonly unknown[]; readonly mode: ArrayMergeMode }
  ? [keyof T] extends [keyof ArrayOverride<readonly unknown[]>]
    ? true
    : false
  : false

/**
 * For every array-typed value in T, additionally allow `{ value: <that array type>, mode: ArrayMergeMode }`.
 * Distributes over unions, does not recurse into array elements, and leaves functions/primitives alone.
 */
type WithArrayOverrides<T> = T extends readonly unknown[]
  ? T | ArrayOverride<T>
  : T extends AnyFunction
    ? T
    : T extends object
      ? { [K in keyof T]: WithArrayOverrides<T[K]> }
      : T

/** True if T contains (at any object depth, not inside arrays) a replace-mode wrapper. */
type HasReplaceWrapper<T> = T extends readonly unknown[]
  ? false
  : T extends AnyFunction
    ? false
    : T extends object
      ? IsArrayOverride<T> extends true
        ? T extends { readonly mode: "replace" }
          ? true
          : false
        : true extends { [K in keyof T]: HasReplaceWrapper<T[K]> }[keyof T]
          ? true
          : false
      : false

/** Keep only the key paths whose leaf is a replace-mode wrapper; unwrap those leaves to their `value` type. */
type DeepPickReplaceWrappers<T> = {
  [K in keyof T as HasReplaceWrapper<T[K]> extends true ? K : never]: IsArrayOverride<T[K]> extends true
    ? T[K] extends { readonly value: infer V extends readonly unknown[] }
      ? V
      : never
    : DeepPickReplaceWrappers<T[K]>
}

/** Drop key paths whose leaf is a replace-mode wrapper; unwrap merge-mode wrappers in place. */
type DeepDropReplaceWrappers<T> = {
  [K in keyof T as IsArrayOverride<T[K]> extends true
    ? T[K] extends { readonly mode: "replace" }
      ? never
      : K
    : K]: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends AnyFunction
      ? T[K]
      : IsArrayOverride<T[K]> extends true
        ? T[K] extends { readonly value: infer V extends readonly unknown[] }
          ? V
          : never
        : T[K] extends object
          ? DeepDropReplaceWrappers<T[K]>
          : T[K]
}

/**
 * The merged result type, exact for per-key overrides: pass 1 merges the user config minus replace-wrapper keys
 * (unwrapping merge-mode wrappers, which behave like plain arrays) with array spreading; pass 2 merges the unwrapped
 * replace-wrapper keys with array replacement. Instead of returning `BaseConfig & UserConfig` (from `merge`), this is a
 * more friendly type via `MergeDeep`.
 */
type MergedConfig<BaseConfig, UserConfig> = MergeDeep<
  MergeDeep<
    SimplifyDeep<WritableDeep<BaseConfig>>,
    SimplifyDeep<WritableDeep<DeepDropReplaceWrappers<UserConfig>>>,
    { arrayMergeMode: "spread" }
  >,
  SimplifyDeep<WritableDeep<DeepPickReplaceWrappers<UserConfig>>>,
  { arrayMergeMode: "replace" }
>

/**
 * The merge config function, where the `UserConfig` passed in is merged with `BaseConfig`.
 *
 * The `const` type parameter keeps literal types without requiring `as const` at the call site. The constraint is
 * `WithArrayOverrides<ReadonlyDeep<...>>` so readonly arrays/objects (e.g. from `as const`) are accepted and any
 * array-typed key can alternatively take an ArrayOverride wrapper; the result is `WritableDeep` so it stays assignable
 * to the tools' own (mutable) config types.
 */
export type MergeConfigFn<UserConfig, BaseConfig> = <
  const UserConfigToMerge extends WithArrayOverrides<ReadonlyDeep<UserConfig>>,
>(
  userConfig: UserConfigToMerge,
) => MergedConfig<BaseConfig, UserConfigToMerge>

/**
 * The optional merge config function, where the `userConfig` argument is optional. - if `UserConfig` is not provided,
 * the return type is `BaseConfig` - if `UserConfig` is provided, the return type is the merged type of `BaseConfig` and
 * `UserConfig`.
 *
 * CRITICAL: must stay a type-alias intersection (NOT `interface ... extends MergeConfigFn`): checking the
 * interface-inheritance relation forces tsc to relate the no-arg signature's return type against the recursive
 * `MergedConfig` type, which explodes to millions of type instantiations.
 */
export type OptionalMergeConfigFn<UserConfig, BaseConfig> = MergeConfigFn<UserConfig, BaseConfig> &
  (() => SimplifyDeep<WritableDeep<BaseConfig>>)

/**
 * Creates a config merge function with proper types for merging with a base config.
 *
 * `UserConfig` is not inferrable, so both type arguments must be passed explicitly. Returning the exact
 * `OptionalMergeConfigFn` instantiation (instead of relating a looser type to an annotation at the export site) keeps
 * tsc from eagerly evaluating the deep-mapped types over the full config type, which blows the instantiation depth
 * limit on large configs like tsdown's.
 */
export const createMergeConfigFn = <UserConfig extends AnyObj, BaseConfig extends ReadonlyDeep<UserConfig>>(
  baseConfig: BaseConfig,
): OptionalMergeConfigFn<UserConfig, BaseConfig> => {
  // We don't care about the specific type of userConfig here because we assert mergeConfigFn as the correct type below
  const mergeConfigFn = (userConfig?: AnyObj) => {
    // Return a clone so consumers can't mutate the shared base config
    // oxlint-disable-next-line unicorn/prefer-structured-clone - structuredClone does not properly clone functions
    if (userConfig === undefined) return cloneDeep(baseConfig)
    // Clone both target and source so we never mutate the original objects
    // oxlint-disable-next-line unicorn/prefer-structured-clone - structuredClone does not properly clone functions
    return merge(cloneDeep(baseConfig), cloneDeep(userConfig))
  }

  // CRITICAL: two-step assertion required: a direct cast makes tsc run a comparability check relating the
  // implementation signature against the recursive MergedConfig type (millions of instantiations).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return mergeConfigFn as unknown as OptionalMergeConfigFn<UserConfig, BaseConfig>
}

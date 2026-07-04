import { cloneDeep, mergeWith } from "es-toolkit"
import type { MergeDeep, ReadonlyDeep, WritableDeep, SimplifyDeep } from "type-fest"

type AnyObj = object

/**
 * How arrays in the user config are combined with arrays in the base config. - `"merge"` (default): the user array is
 * appended to the base array - `"replace"`: the user array is used as-is
 */
type ArrayMergeMode = "merge" | "replace"

/** A wrapper around es-toolkit's `mergeWith` with a custom merge function that concatenates or replaces arrays. */
const merge = <T extends AnyObj, S extends AnyObj>(target: T, source: S, arrays: ArrayMergeMode): T & S =>
  mergeWith(target, source, (objValue: unknown, srcValue: unknown) => {
    if (!Array.isArray(objValue)) return
    if (!Array.isArray(srcValue)) return srcValue
    const baseArray: unknown[] = objValue
    const userArray: unknown[] = srcValue
    return arrays === "merge" ? [...baseArray, ...userArray] : userArray
  })

/**
 * The merge config function, where the `UserConfig` passed in is merged with `BaseConfig`.
 *
 * Each `arrays` mode gets its own overload so the return type's `arrayMergeMode` matches the runtime behavior. The
 * `"replace"` overload comes first so it wins overload resolution when `{ arrays: "replace" }` is passed.
 *
 * The `const` type parameter keeps literal types without requiring `as const` at the call site. The constraint is
 * `ReadonlyDeep` so readonly arrays/objects (e.g. from `as const`) are accepted, and the result is `WritableDeep` so it
 * stays assignable to the tools' own (mutable) config types.
 */
export interface MergeConfigFn<UserConfig, BaseConfig> {
  <const UserConfigToMerge extends ReadonlyDeep<UserConfig>>(
    userConfig: UserConfigToMerge,
    options: { arrays: "replace" },
  ): MergeDeep<
    SimplifyDeep<WritableDeep<BaseConfig>>,
    SimplifyDeep<WritableDeep<UserConfigToMerge>>,
    { arrayMergeMode: "replace" }
  >
  <const UserConfigToMerge extends ReadonlyDeep<UserConfig>>(
    userConfig: UserConfigToMerge,
    options?: { arrays?: "merge" },
  ): MergeDeep<
    SimplifyDeep<WritableDeep<BaseConfig>>,
    SimplifyDeep<WritableDeep<UserConfigToMerge>>,
    { arrayMergeMode: "spread" }
  >
  // Instead of returning `BaseConfig & UserConfig` (from `merge`), return a more friendly type using `MergeDeep`
}

/**
 * The optional merge config function, where the `userConfig` argument is optional. - if `UserConfig` is not provided,
 * the return type is `BaseConfig` - if `UserConfig` is provided, the return type is the merged type of `BaseConfig` and
 * `UserConfig`.
 *
 * Note that this extends `MergeConfigFn`, so this type has both function signatures on it.
 */
export interface OptionalMergeConfigFn<UserConfig, BaseConfig> extends MergeConfigFn<UserConfig, BaseConfig> {
  (): SimplifyDeep<WritableDeep<BaseConfig>>
}

/**
 * Creates a config merge function with proper type overloads for merging with a base config.
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
  const mergeConfigFn = (userConfig?: AnyObj, options?: { arrays?: ArrayMergeMode }) => {
    // Return a clone so consumers can't mutate the shared base config
    // oxlint-disable-next-line unicorn/prefer-structured-clone - structuredClone does not properly clone functions
    if (userConfig === undefined) return cloneDeep(baseConfig)
    // Clone both target and source so we never mutate the original objects
    // oxlint-disable-next-line unicorn/prefer-structured-clone - structuredClone does not properly clone functions
    return merge(cloneDeep(baseConfig), cloneDeep(userConfig), options?.arrays ?? "merge")
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return mergeConfigFn as OptionalMergeConfigFn<UserConfig, BaseConfig>
}

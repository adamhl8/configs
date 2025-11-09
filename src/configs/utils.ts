import { mergeWith } from "es-toolkit"
import { clone } from "remeda"
import type { MergeDeep } from "type-fest"

type AnyObj = object

/**
 * A wrapper around es-toolkit's `mergeWith` with a custom merge function that concatenates arrays.
 */
function merge<T extends AnyObj, S extends AnyObj>(target: T, source: S): T & S {
  return mergeWith(target, source, (objValue: unknown, srcValue: unknown) =>
    Array.isArray(objValue) ? objValue.concat(srcValue) : undefined,
  )
}

/**
 * Type representing a merge config function, where the `UserConfig` passed in is merged with `BaseConfig`.
 */
export interface MergeConfigFn<UserConfig, BaseConfig> {
  // biome-ignore lint/style/useShorthandFunctionType: need to use call signature type
  <UserConfigToMerge extends UserConfig>(
    userConfig: UserConfigToMerge,
  ): MergeDeep<BaseConfig, UserConfigToMerge, { arrayMergeMode: "spread" }>
  // instead of returning `BaseConfig & UserConfig` (from `merge`), return a more friendly type using `MergeDeep`
}

/**
 * Type representing an overloaded function signature for MergeConfigFn:
 * - if `UserConfig` is not provided, the return type is `BaseConfig`
 * - if `UserConfig` is provided, the return type is the merged type of `BaseConfig` and `UserConfig`.
 *
 * This is needed to handle the fact that the `userConfig` argument is optional.
 *
 * Note that this extends `MergeConfigFn`, so this type has both function signatures on it.
 */
export interface OptionalMergeConfigFn<UserConfig, BaseConfig> extends MergeConfigFn<UserConfig, BaseConfig> {
  (): BaseConfig
}

/**
 * Creates a config merge function with proper type overloads for merging with a base config.
 */
export function createMergeConfigFn<
  UserConfig extends AnyObj,
  BaseConfig extends UserConfig,
  Required extends boolean = false, // if true, the created merge config function requires a userConfig to be passed in
>(baseConfig: BaseConfig) {
  // we don't care about the specific type of userConfig here because we assert mergeConfigFn as the correct type below
  const mergeConfigFn = (userConfig?: AnyObj) => {
    if (userConfig === undefined) return baseConfig
    // clone both target and source so we never mutate the original objects
    return merge(clone(baseConfig), clone(userConfig))
  }

  return mergeConfigFn as Required extends true // if Required is true
    ? MergeConfigFn<UserConfig, BaseConfig> // then the merge config function requires a userConfig to be passed in
    : OptionalMergeConfigFn<UserConfig, BaseConfig> // else, userConfig is optional
}

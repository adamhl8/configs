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
 * The merge config function, where the `UserConfig` passed in is merged with `BaseConfig`.
 */
export interface MergeConfigFn<UserConfig, BaseConfig> {
  // biome-ignore lint/style/useShorthandFunctionType: need to use call signature type
  <UserConfigToMerge extends UserConfig>(
    userConfig: UserConfigToMerge,
  ): MergeDeep<BaseConfig, UserConfigToMerge, { arrayMergeMode: "spread" }>
  // instead of returning `BaseConfig & UserConfig` (from `merge`), return a more friendly type using `MergeDeep`
}

/**
 * The optional merge config function, where the `userConfig` argument is optional.
 * - if `UserConfig` is not provided, the return type is `BaseConfig`
 * - if `UserConfig` is provided, the return type is the merged type of `BaseConfig` and `UserConfig`.
 *
 * Note that this extends `MergeConfigFn`, so this type has both function signatures on it.
 */
export interface OptionalMergeConfigFn<UserConfig, BaseConfig> extends MergeConfigFn<UserConfig, BaseConfig> {
  (): BaseConfig
}

/**
 * Creates a config merge function with proper type overloads for merging with a base config.
 */
export function createMergeConfigFn<UserConfig extends AnyObj, BaseConfig extends UserConfig>(baseConfig: BaseConfig) {
  // we don't care about the specific type of userConfig here because we assert mergeConfigFn as the correct type below
  const mergeConfigFn = (userConfig?: AnyObj) => {
    if (userConfig === undefined) return baseConfig
    // clone both target and source so we never mutate the original objects
    return merge(clone(baseConfig), clone(userConfig))
  }

  return mergeConfigFn as MergeConfigFn<UserConfig, BaseConfig> & OptionalMergeConfigFn<UserConfig, BaseConfig>
}

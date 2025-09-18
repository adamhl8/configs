import { mergeWith } from "es-toolkit"
import { clone, isPlainObject } from "remeda"
import type { MergeDeep } from "type-fest"

type AnyObj = Record<PropertyKey, unknown>

/**
 * A wrapper around es-toolkit's `mergeWith` with a custom merge function that concatenates arrays.
 */
function merge<T extends AnyObj, S extends AnyObj>(target: T, source: S): T & S {
  return mergeWith(target, source, (objValue: unknown, srcValue: unknown) =>
    Array.isArray(objValue) ? objValue.concat(srcValue) : undefined,
  )
}

type MergeDeepConcat<D, S> = MergeDeep<D, S, { arrayMergeMode: "spread" }>

export interface MergeConfigFn<UserConfigType, BaseConfig extends UserConfigType> {
  // if `userConfig` is not provided, return the type of `baseConfig`
  (): BaseConfig
  // if `userConfig` is provided, instead of returning `BaseConfig & UserConfig` (from `merge`), return a more friendly type using `MergeDeep`
  <UserConfig extends UserConfigType>(userConfig: UserConfig): MergeDeepConcat<BaseConfig, UserConfig>
}

/**
 * Creates a config merge function with proper type overloads for merging with a base config.
 */
export function createMergeConfigFn<UserConfigType, BaseConfig extends UserConfigType>(
  baseConfig: BaseConfig,
): MergeConfigFn<UserConfigType, BaseConfig> {
  function mergeConfig(): BaseConfig

  function mergeConfig<UserConfig extends UserConfigType>(
    userConfig: UserConfig,
  ): MergeDeepConcat<BaseConfig, UserConfig>

  function mergeConfig<UserConfig extends UserConfigType>(userConfig?: UserConfig) {
    if (userConfig === undefined) return baseConfig

    if (!(isPlainObject(baseConfig) && isPlainObject(userConfig)))
      throw new Error(`target and/or source is not an object: target='${baseConfig}'\nsource='${userConfig}'`)

    // clone both target and source so we never mutate the original objects
    return merge(clone(baseConfig), clone(userConfig))
  }

  return mergeConfig
}

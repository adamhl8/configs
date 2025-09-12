import { mergeWith } from "es-toolkit"
import { isPlainObject } from "remeda"
import type { MergeDeep } from "type-fest"

type AnyObj = Record<PropertyKey, unknown>

/**
 * A wrapper around es-toolkit's `mergeWith` with a custom merge function that concatenates arrays.
 */
export function merge<T extends AnyObj, S extends AnyObj>(target: T, source: S): T & S {
  return mergeWith(target, source, (objValue: unknown, srcValue: unknown) =>
    Array.isArray(objValue) ? objValue.concat(srcValue) : undefined,
  )
}

/**
 * Creates a config merge function with proper type overloads for merging with a base config.
 */
export function createMergeConfigFn<UserConfigType, BaseConfig extends UserConfigType>(baseConfig: BaseConfig) {
  //

  // if `userConfig` is not provided, return the type of `baseConfig`
  function mergeConfig(): BaseConfig

  // if `userConfig` is provided, instead of returning `BaseConfig & UserConfig` (from `merge`), return a more friendly type using `MergeDeep`
  function mergeConfig<UserConfig extends UserConfigType>(
    userConfig: UserConfig,
  ): MergeDeep<BaseConfig, UserConfig, { arrayMergeMode: "spread" }>

  function mergeConfig<UserConfig extends UserConfigType>(userConfig?: UserConfig) {
    if (userConfig === undefined) return baseConfig

    if (!(isPlainObject(baseConfig) && isPlainObject(userConfig)))
      throw new Error(`target and/or source is not an object: target='${baseConfig}'\nsource='${userConfig}'`)

    return merge(baseConfig, userConfig)
  }

  return mergeConfig
}

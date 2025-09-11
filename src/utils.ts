import { mergeWith } from "es-toolkit"

type AnyObj = Record<PropertyKey, unknown>

/**
 * A wrapper around es-toolkit's `mergeWith` with a custom merge function that concatenates arrays.
 */
export function merge<T extends AnyObj, S extends AnyObj>(target: T, source: S) {
  return mergeWith(target, source, (objValue: unknown, srcValue: unknown) =>
    Array.isArray(objValue) ? objValue.concat(srcValue) : undefined,
  )
}

/**
 * Creates a config merge function with proper type overloads for merging with a base config.
 */
export function createMergeConfigFn<T extends AnyObj>(baseConfig: T) {
  function mergeConfig(): T
  function mergeConfig<S extends AnyObj>(userConfig: S): T & S
  function mergeConfig<S extends AnyObj>(userConfig?: S) {
    return userConfig ? merge(baseConfig, userConfig) : baseConfig
  }
  return mergeConfig
}

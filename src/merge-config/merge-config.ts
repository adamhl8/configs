/* oxlint-disable unicorn/prefer-structured-clone -- structuredClone does not properly clone functions */
import { cloneDeep, mergeWith } from "es-toolkit"
import type { ReadonlyDeep } from "type-fest"

import type { Clean, MergedConfig, Mode } from "#merge-config/merge.types.ts"

/**
 * The runtime counterpart of MergedConfig in merge.types.ts: a deep merge whose customizer applies the array mode. The
 * source is pre-cloned so the result never aliases the caller's objects. The merge visits string keys only, so
 * symbol-keyed properties in user configs are dropped (the types mirror this).
 */
const merge = (target: object, source: object, mode: Mode): object =>
  mergeWith(target, cloneDeep(source), (objValue: unknown, srcValue: unknown) => {
    if (!Array.isArray(srcValue)) return
    const userArray: unknown[] = srcValue
    if (mode === "spread" && Array.isArray(objValue)) {
      const baseArray: unknown[] = objValue
      return [...baseArray, ...userArray]
    }
    return userArray
  })

/**
 * The merge config function. `userConfig` is deep merged into `BaseConfig` with arrays appended to the base array. The
 * optional `replaceConfig` is then deep merged into that result with arrays used as-is, so putting an array there
 * replaces just that key (sibling keys still merge normally, and a key in both configs gets the replace config's
 * value). Required keys must be provided in `userConfig`.
 *
 * The `const` type parameters keep literal types without requiring `as const` at the call site. The constraints accept
 * readonly arrays/objects (e.g. from `as const`), and the result is writable so it stays assignable to the tools' own
 * (mutable) config types.
 */
export type MergeConfigFn<UserConfig, BaseConfig> = (<const UserConfigToMerge extends ReadonlyDeep<UserConfig>>(
  userConfig: UserConfigToMerge,
) => MergedConfig<BaseConfig, UserConfigToMerge>) &
  (<
    const UserConfigToMerge extends ReadonlyDeep<UserConfig>,
    const ReplaceConfigToMerge extends ReadonlyDeep<Partial<UserConfig>>,
  >(
    userConfig: UserConfigToMerge,
    replaceConfig: ReplaceConfigToMerge,
  ) => MergedConfig<MergedConfig<BaseConfig, UserConfigToMerge>, ReplaceConfigToMerge, "replace">)

/** A MergeConfigFn that can also be called with no arguments, returning a writable clone of the base config. */
export type OptionalMergeConfigFn<UserConfig, BaseConfig> = MergeConfigFn<UserConfig, BaseConfig> &
  (() => Clean<BaseConfig>)

/**
 * Creates a config merge function with proper types for merging with a base config. `UserConfig` is not inferrable, so
 * both type arguments must be passed explicitly.
 */
export const createMergeConfigFn = <UserConfig extends object, BaseConfig extends ReadonlyDeep<UserConfig>>(
  baseConfig: BaseConfig,
): OptionalMergeConfigFn<UserConfig, BaseConfig> => {
  // Loosely typed on purpose, the assertion below gives it the precise public signature
  const mergeConfigFn = (userConfig?: object, replaceConfig?: object) => {
    // Start from a clone so consumers can't mutate the shared base config
    const result = cloneDeep(baseConfig)
    if (userConfig !== undefined) merge(result, userConfig, "spread")
    if (replaceConfig !== undefined) merge(result, replaceConfig, "replace")
    return result
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return mergeConfigFn as OptionalMergeConfigFn<UserConfig, BaseConfig>
}

/*
 * The type-level mirror of the runtime merge in merge-config.ts, one branch per rule: it computes the exact merged
 * config type so hovering a result shows the real keys/values. This file is type-only: nothing in it exists at
 * runtime.
 *
 * CRITICAL: this must stay a hand-rolled, depth-bounded walk. Library deep-merge types (e.g. type-fest's MergeDeep)
 * explode combinatorially in tsgo when related in an inference context, such as a merge fn called inside a `.map()`
 * callback: measured at millions of instantiations, 20+ second checks, and spurious TS2589 errors on valid calls.
 * Stacking this walk (the two-pass MergedConfig in MergeConfigFn) is measured safe because every level is depth-bounded
 * and flattened eagerly.
 */
type AnyFunction = (...args: never[]) => unknown

/** How user arrays combine with base arrays: appended in spread mode, used as-is in replace mode. */
export type Mode = "spread" | "replace"

/**
 * Recursion budget for the merge walk, threaded through every recursive type below. When a call fails the generic
 * constraint, these types run over the full constraint (the whole tool config type, with circular types like Console in
 * it), and the budget makes that walk terminate instead of exploding.
 */
type MaxDepth = readonly [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

/**
 * Values the walk must keep as-is instead of mapping over (a mapped type would mangle their methods into plain
 * properties): functions, the toStringTag-less built-ins, and everything declaring `Symbol.toStringTag` (Map, Set,
 * Promise, URL, typed arrays, streams, ...).
 */
type NonRecursive = AnyFunction | Date | RegExp | Error | { readonly [Symbol.toStringTag]: string }

/**
 * Makes a type deeply writable, keeping tuples, functions, and built-ins as-is. Symbol keys are kept: values that reach
 * Clean land in the result as wholesale clones at runtime, which preserve them (and filtering them here would mangle
 * interface-shaped values with symbol-keyed members, e.g. anything iterable). The `T extends object` gate comes first
 * so primitive leaves (most nodes of a config type) cost one relation, and only recursion spends the depth budget.
 */
export type Clean<T, Depth extends readonly unknown[] = MaxDepth> = T extends object
  ? Depth extends readonly [unknown, ...infer RemainingDepth]
    ? T extends NonRecursive
      ? T
      : { -readonly [K in keyof T]: Clean<T[K], RemainingDepth> }
    : T
  : T

/**
 * In spread mode, base and user arrays concatenate to an element-union array. In replace mode, or over a non-array
 * base, the user array is used as-is.
 */
type MergeArrays<
  BaseValue,
  UserValue extends readonly unknown[],
  Depth extends readonly unknown[],
  M extends Mode,
> = M extends "spread"
  ? BaseValue extends readonly unknown[]
    ? (Clean<BaseValue[number], Depth> | Clean<UserValue[number], Depth>)[]
    : Clean<UserValue, Depth>
  : Clean<UserValue, Depth>

/**
 * Merge one key's values: combine arrays per the mode, recurse into objects, else user wins. Gated on `UserValue
 * extends object` first for the same primitive-leaf reason as Clean.
 */
type MergeValues<BaseValue, UserValue, Depth extends readonly unknown[], M extends Mode> = UserValue extends object
  ? UserValue extends readonly unknown[]
    ? MergeArrays<BaseValue, UserValue, Depth, M>
    : UserValue extends NonRecursive
      ? UserValue
      : BaseValue extends readonly unknown[] | NonRecursive
        ? Clean<UserValue, Depth>
        : BaseValue extends object
          ? MergeObjects<BaseValue, UserValue, Depth, M>
          : Clean<UserValue, Depth>
  : UserValue

/**
 * Merge two object types key by key, in base key order. An optional user key (only possible when the user passes a
 * wide-typed value rather than a literal) may be absent at runtime, so it unions with the base value. User-only symbol
 * keys are dropped because the runtime merge visits string keys only. The final `extends infer Merged` flattens the
 * intersection through an anonymous mapped type: a named helper alias would show up as `SomeAlias<...>` in hovers
 * instead of the plain object.
 */
type MergeObjects<BaseConfig, UserConfig, Depth extends readonly unknown[], M extends Mode> = Depth extends readonly [
  unknown,
  ...infer RemainingDepth,
]
  ? {
      -readonly [K in keyof BaseConfig]: K extends keyof UserConfig
        ? undefined extends UserConfig[K]
          ?
              | MergeValues<BaseConfig[K], Exclude<UserConfig[K], undefined>, RemainingDepth, M>
              | Clean<BaseConfig[K], RemainingDepth>
          : MergeValues<BaseConfig[K], UserConfig[K], RemainingDepth, M>
        : Clean<BaseConfig[K], RemainingDepth>
    } & {
      -readonly [K in keyof UserConfig as K extends keyof BaseConfig | symbol ? never : K]: Clean<
        UserConfig[K],
        RemainingDepth
      >
    } extends infer Merged
    ? { [K in keyof Merged]: Merged[K] }
    : never
  : UserConfig

/**
 * The merged result type, exact per key: spread-mode arrays show the element-union of base and user, replace-mode
 * arrays show only the user's elements.
 */
export type MergedConfig<BaseConfig, UserConfig, M extends Mode = "spread"> = MergeObjects<
  BaseConfig,
  UserConfig,
  MaxDepth,
  M
>

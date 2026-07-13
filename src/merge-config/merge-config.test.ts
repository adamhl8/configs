import { describe, expect, test } from "bun:test"

import type { IsEqual } from "type-fest"

import { createMergeConfigFn } from "#merge-config/merge-config.ts"

const metaTag = Symbol.for("test/meta")

interface TestConfig {
  // | undefined so an explicit undefined is passable under exactOptionalPropertyTypes
  name?: string | undefined
  list?: string[]
  extra?: string[]
  nested?: { arr?: number[]; flag?: boolean; [metaTag]?: string }
  mixed?: string | string[]
  fn?: (x: number) => string
  map?: Map<string, string>
  listOfObjs?: { xs?: string[] }[]
}

const baseConfig = {
  name: "base",
  list: ["a", "b"],
  nested: { arr: [1, 2], flag: true },
  mixed: ["m"],
} as const satisfies TestConfig

const mergeFn = createMergeConfigFn<TestConfig, typeof baseConfig>(baseConfig)

describe("createMergeConfigFn", () => {
  test("plain arrays concat by default", () => {
    expect(mergeFn({ list: ["x"] }).list).toEqual(["a", "b", "x"])
  })

  test("a replace-config array replaces only its key", () => {
    const result = mergeFn({}, { list: ["x"] })
    expect(result).toEqual({ name: "base", list: ["x"], nested: { arr: [1, 2], flag: true }, mixed: ["m"] })
  })

  test("replace config on a key absent from the base config", () => {
    expect(mergeFn({}, { extra: ["x"] }).extra).toEqual(["x"])
  })

  test("a nested replace-config array preserves siblings", () => {
    const result = mergeFn({}, { nested: { arr: [9] } })
    expect(result.nested).toEqual({ arr: [9], flag: true })
  })

  test("a key in both configs gets the replace config's value", () => {
    expect(mergeFn({ list: ["x"] }, { list: ["y"] }).list).toEqual(["y"])
  })

  test("non-array values in the replace config merge like normal", () => {
    const result = mergeFn({}, { name: "two", nested: { flag: false } })
    expect(result.name).toBe("two")
    expect(result.nested).toEqual({ arr: [1, 2], flag: false })
  })

  test("base array + user non-array: user value wins", () => {
    expect(mergeFn({ mixed: "solo" }).mixed).toBe("solo")
  })

  test("replace-config arrays are used wholesale, elements are not merged", () => {
    const result = mergeFn({ listOfObjs: [{ xs: ["a"] }] }, { listOfObjs: [{ xs: ["x"] }] })
    expect(result.listOfObjs).toEqual([{ xs: ["x"] }])
  })

  test("plain array on a key absent from the base config", () => {
    expect(mergeFn({ extra: ["x"] }).extra).toEqual(["x"])
  })

  test("non-plain user values are cloned, not aliased", () => {
    const map = new Map<string, string>([["k", "v"]])
    const result = mergeFn({ map })
    expect(result.map).not.toBe(map)
    result.map.set("k2", "v2")
    expect(map.has("k2")).toBeFalse()
  })

  test("symbol-keyed properties in user configs are dropped", () => {
    const result = mergeFn({ nested: { flag: false, [metaTag]: "meta" } })
    expect(Object.getOwnPropertySymbols(result.nested)).toEqual([])
    expect(result.nested.arr).toEqual([1, 2])
  })

  test("explicit undefined keeps the base value", () => {
    expect(mergeFn({ name: undefined }).name).toBe("base")
  })

  test("an own __proto__ key never pollutes Object.prototype", () => {
    const nested: NonNullable<TestConfig["nested"]> = { flag: false }
    Object.defineProperty(nested, "__proto__", {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
      writable: true,
    })
    const result = mergeFn({ nested })
    expect(Object.hasOwn(result.nested, "polluted")).toBeFalse()
    expect("polluted" in {}).toBeFalse()
  })

  test("the result does not alias replace-config arrays", () => {
    const arr = ["x"]
    const result = mergeFn({}, { list: arr })
    expect(result.list).not.toBe(arr)
  })

  test("no-arg call returns a clone of the base config", () => {
    const result = mergeFn()
    expect(result).toEqual(baseConfig)
    expect(result.list).not.toBe(baseConfig.list)
  })

  test("inputs are not mutated", () => {
    const userConfig = { list: ["x"], nested: { arr: [9] } }
    const replaceConfig = { extra: ["e"], nested: { arr: [7] } }
    mergeFn(userConfig, replaceConfig)
    expect(userConfig).toEqual({ list: ["x"], nested: { arr: [9] } })
    expect(replaceConfig).toEqual({ extra: ["e"], nested: { arr: [7] } })
    expect(baseConfig).toEqual({
      name: "base",
      list: ["a", "b"],
      nested: { arr: [1, 2], flag: true },
      mixed: ["m"],
    })
  })
})

/* type-level assertions, enforced by the typecheck step */
type Expect<T extends true> = T

const c1 = mergeFn({ list: ["x"] })
const c2 = mergeFn({}, { list: ["x"] })
const c3 = mergeFn({}, { extra: ["x"] })
const c4 = mergeFn({}, { nested: { arr: [9] } })
const c5 = mergeFn({}, { mixed: ["m1"] })
const c6 = mergeFn({ fn: (x: number) => `${x}` })
const c7 = mergeFn()
const c8 = mergeFn({ list: ["x"] }, { list: ["y"] })
const c9 = mergeFn({ list: ["x"] }, { extra: ["e"] })
const c10 = mergeFn({ map: new Map<string, string>([["k", "v"]]) })
const c11 = mergeFn({ nested: { flag: false, [metaTag]: "meta" } })
const c12 = mergeFn({ name: undefined })
const c13 = mergeFn({ listOfObjs: [{ xs: ["a"] }] }, { listOfObjs: [{ xs: ["x"] }] })

export type TypeAssertions = [
  Expect<IsEqual<typeof c1.list, ("a" | "b" | "x")[]>>,
  Expect<IsEqual<typeof c2.list, ["x"]>>,
  Expect<IsEqual<typeof c2.name, "base">>,
  Expect<IsEqual<typeof c2.nested, { arr: [1, 2]; flag: true }>>,
  Expect<IsEqual<typeof c3.extra, ["x"]>>,
  Expect<IsEqual<typeof c3.list, ["a", "b"]>>,
  // a nested replace targets just its array, base siblings survive
  Expect<IsEqual<typeof c4.nested, { arr: [9]; flag: true }>>,
  Expect<IsEqual<typeof c5.mixed, ["m1"]>>,
  Expect<IsEqual<ReturnType<typeof c6.fn>, string>>,
  Expect<IsEqual<typeof c7.list, ["a", "b"]>>,
  // a key in both configs resolves to the replace config's value
  Expect<IsEqual<typeof c8.list, ["y"]>>,
  Expect<IsEqual<typeof c9.list, ("a" | "b" | "x")[]>>,
  Expect<IsEqual<typeof c9.extra, ["e"]>>,
  // Map is NonRecursive: kept as-is in the type, cloned at runtime
  Expect<IsEqual<typeof c10.map, Map<string, string>>>,
  // the user's symbol key is dropped from the merged type, matching the runtime
  Expect<IsEqual<typeof c11.nested, { arr: [1, 2]; flag: false }>>,
  // an explicitly-undefined user key falls back to the base value
  Expect<IsEqual<typeof c12.name, "base">>,
  Expect<IsEqual<typeof c13.listOfObjs, [{ xs: ["x"] }]>>,
]

// @ts-expect-error typo key (weak type violation)
mergeFn({ nmae: "x" })
// @ts-expect-error nested typo
mergeFn({ nested: { arrr: [1] } })
// @ts-expect-error typo key in the replace config
mergeFn({}, { nmae: "x" })
// @ts-expect-error wrong element type in a replace-config array
mergeFn({}, { list: [1] })
// @ts-expect-error the old global arrays option is not a config
mergeFn({ list: ["x"] }, { arrays: "replace" })

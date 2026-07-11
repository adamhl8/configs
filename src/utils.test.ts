import { describe, expect, test } from "bun:test"

import type { IsEqual } from "type-fest"

import { createMergeConfigFn } from "#utils.ts"

interface TestConfig {
  name?: string
  list?: string[]
  extra?: string[]
  nested?: { arr?: number[]; flag?: boolean }
  mixed?: string | string[]
  fn?: (x: number) => string
  ambiguous?: { value?: string[]; mode?: "merge" | "replace" }
  notWrapper?: { value?: string[]; mode?: "merge" | "replace"; other?: number }
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

  test("replace wrapper replaces only its key", () => {
    const result = mergeFn({ list: { value: ["x"], mode: "replace" } })
    expect(result).toEqual({ name: "base", list: ["x"], nested: { arr: [1, 2], flag: true }, mixed: ["m"] })
  })

  test("merge wrapper concats (explicit default)", () => {
    expect(mergeFn({ list: { value: ["x"], mode: "merge" } }).list).toEqual(["a", "b", "x"])
  })

  test("wrapper on a key absent from the base config", () => {
    expect(mergeFn({ extra: { value: ["x"], mode: "replace" } }).extra).toEqual(["x"])
  })

  test("wrapper deep in a nested object preserves siblings", () => {
    const replaced = mergeFn({ nested: { arr: { value: [9], mode: "replace" }, flag: false } })
    expect(replaced.nested).toEqual({ arr: [9], flag: false })
    const merged = mergeFn({ nested: { arr: { value: [9], mode: "merge" } } })
    expect(merged.nested).toEqual({ arr: [1, 2, 9], flag: true })
  })

  test("near-wrapper with an extra key is a plain config object", () => {
    const result = mergeFn({ notWrapper: { value: ["x"], mode: "merge", other: 1 } })
    expect(result.notWrapper).toEqual({ value: ["x"], mode: "merge", other: 1 })
  })

  test("exact wrapper shape is always consumed as a wrapper", () => {
    expect(mergeFn({ ambiguous: { value: ["x"], mode: "merge" } }).ambiguous).toEqual(["x"])
  })

  test("base array + user non-array: user value wins", () => {
    expect(mergeFn({ mixed: "solo" }).mixed).toBe("solo")
  })

  test("no-arg call returns a clone of the base config", () => {
    const result = mergeFn()
    expect(result).toEqual(baseConfig)
    expect(result.list).not.toBe(baseConfig.list)
  })

  test("inputs are not mutated", () => {
    const userConfig = { list: { value: ["x"], mode: "replace" } } as const
    mergeFn(userConfig)
    expect(userConfig).toEqual({ list: { value: ["x"], mode: "replace" } })
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
const c2 = mergeFn({ list: { value: ["x"], mode: "replace" } })
const c3 = mergeFn({ list: { value: ["x"], mode: "merge" } })
const c4 = mergeFn({ extra: { value: ["x"], mode: "replace" } })
const c5 = mergeFn({ nested: { arr: { value: [9], mode: "replace" }, flag: false } })
const c6 = mergeFn({ mixed: { value: ["m1"], mode: "replace" } })
const c7 = mergeFn({ fn: (x: number) => `${x}` })
const c8 = mergeFn()
const g1 = mergeFn({ notWrapper: { value: ["x"], mode: "merge", other: 1 } })
const g2 = mergeFn({ ambiguous: { value: ["x"], mode: "merge" } })

export type TypeAssertions = [
  Expect<IsEqual<typeof c1.list, ("a" | "b" | "x")[]>>,
  Expect<IsEqual<typeof c2.list, ["x"]>>,
  Expect<IsEqual<typeof c2.name, "base">>,
  Expect<IsEqual<typeof c2.nested, { arr: [1, 2]; flag: true }>>,
  Expect<IsEqual<typeof c3.list, ("a" | "b" | "x")[]>>,
  Expect<IsEqual<typeof c4.extra, ["x"]>>,
  Expect<IsEqual<typeof c4.list, ["a", "b"]>>,
  Expect<IsEqual<typeof c5.nested.arr, [9]>>,
  Expect<IsEqual<typeof c5.nested.flag, false>>,
  Expect<IsEqual<typeof c6.mixed, ["m1"]>>,
  Expect<IsEqual<ReturnType<typeof c7.fn>, string>>,
  Expect<IsEqual<typeof c8.list, ["a", "b"]>>,
  // near-wrapper stays a plain object; exact wrapper shape is consumed
  Expect<IsEqual<typeof g1.notWrapper, { value: ["x"]; mode: "merge"; other: 1 }>>,
  Expect<IsEqual<typeof g2.ambiguous, ["x"]>>,
]

// @ts-expect-error typo key (weak type violation)
mergeFn({ nmae: "x" })
// @ts-expect-error nested typo
mergeFn({ nested: { arrr: [1] } })
// @ts-expect-error missing mode
mergeFn({ list: { value: ["x"] } })
// @ts-expect-error bad mode string
mergeFn({ list: { value: ["x"], mode: "concat" } })
// @ts-expect-error wrong element type in wrapper value
mergeFn({ list: { value: [1], mode: "merge" } })
// @ts-expect-error wrapper inside array elements not allowed
mergeFn({ listOfObjs: [{ xs: { value: ["x"], mode: "merge" } }] })
// @ts-expect-error non-array key can't take a wrapper
mergeFn({ name: { value: ["x"], mode: "merge" } })
// @ts-expect-error the global arrays option was removed
mergeFn({ list: ["x"] }, { arrays: "replace" })

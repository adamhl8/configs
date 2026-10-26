import { describe, expect, it } from "bun:test"
import process from "node:process"

import { minimalEnv } from "#test-utils/shell/env.ts"

describe("minimalEnv", () => {
  it("returns only PATH and HOME from process.env", () => {
    expect(minimalEnv()).toEqual({ PATH: process.env["PATH"], HOME: process.env["HOME"] })
  })

  it("merges extra vars over the defaults", () => {
    expect(minimalEnv({ HOME: "/h", CI: "1" })).toEqual({ PATH: process.env["PATH"], HOME: "/h", CI: "1" })
  })
})

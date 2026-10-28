import { expect, it } from "bun:test"

import { greet } from "./src/greet.ts"
import { shout } from "./src/shout.ts"

it("shouts in the test process", () => {
  expect(shout(greet())).toBe("HELLO")
})

#!/usr/bin/env bun

import { greet } from "./greet.ts"
import { shout } from "./shout.ts"

console.log(process.argv[2] === "loud" ? shout(greet()) : greet())

process.once("exit", () => {
  console.error("goodbye")
})

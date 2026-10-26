#!/usr/bin/env bun

import { greet } from "./greet.ts"

console.log(process.argv[2] === "loud" ? greet().toUpperCase() : greet())

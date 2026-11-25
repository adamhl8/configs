#!/usr/bin/env bun
// @ts-expect-error - the test that packs this package adds the dependency
import { greeting } from "local-dependency"

console.log(`bin-package: ${greeting}`)

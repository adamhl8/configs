import { afterAll } from "bun:test"

import { removeTempDirs } from "#test-utils/temp-dir.ts"

afterAll(removeTempDirs)

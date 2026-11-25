import { afterAll } from "bun:test"

import { removeTempDirs } from "#test-utils/temp-dir.ts"

const REMOVAL_TIMEOUT_MS = 60_000

// Set a timeout because removing many installs can take longer than the default.
afterAll(removeTempDirs, REMOVAL_TIMEOUT_MS)

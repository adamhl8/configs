// @ts-expect-error - the test that packs this package adds the dependency
import { greeting } from "local-dependency"

export const scoped = `scoped: ${greeting}`

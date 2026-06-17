import fs from "node:fs/promises"

/*
 * The Biome config at BIOME_CONFIG_PATH enables the "all" linter preset, which turns on every
 * stable rule but NOT nursery rules. This script fills that gap:
 * - Fetches the latest Biome schema from `https://biomejs.dev/schemas/latest/schema.json`
 * - Generates a `linter.rules.nursery` object with every nursery rule set to `"error"`
 * - Applies OVERRIDES so specific nursery rules can be disabled or given options
 * - Writes the result back to `linter.rules.nursery`, leaving the rest of the config untouched
 */

const BIOME_CONFIG_PATH = "./src/configs/biome.base.json"
const DEFAULT_RULE_SEVERITY = "error"

const OVERRIDES: NurseryRules = {
  noReactNativeRawText: "off",
  noUntrustedLicenses: "off",
  useAwaitThenable: "off",
  useExplicitReturnType: "off",
  useExplicitType: "off",
  useSortedClasses: {
    level: DEFAULT_RULE_SEVERITY,
    fix: "safe",
  },
}

async function getNurseryRules() {
  const schema = (await (await fetch("https://biomejs.dev/schemas/latest/schema.json")).json()) as BiomeSchema

  const ruleNames = Object.keys(schema.$defs.Nursery.properties).filter(
    (key) => key !== "recommended" && key !== "preset",
  )

  const nurseryRules: NurseryRules = {}
  for (const ruleName of ruleNames) {
    nurseryRules[ruleName] = DEFAULT_RULE_SEVERITY
  }

  return nurseryRules
}

/** Sorts the rules alphabetically and puts overrides at the top */
function sortRules(rules: NurseryRules) {
  return {
    ...sortObjectKeys(OVERRIDES),
    ...sortObjectKeys(rules),
  }
}

const nurseryRules = await getNurseryRules()
const mergedRules = { ...nurseryRules, ...OVERRIDES }
const sortedRules = sortRules(mergedRules)
const biomeConfig = JSON.parse(await fs.readFile(BIOME_CONFIG_PATH, "utf-8")) as BiomeConfig
biomeConfig.linter.rules.nursery = sortedRules
await fs.writeFile(BIOME_CONFIG_PATH, JSON.stringify(biomeConfig, null, 2))

// === utils ===

function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))) as T
}

// ==== types ====

interface BiomeSchema {
  $defs: {
    Nursery: {
      properties: Record<string, unknown>
    }
  }
}

type NurseryRules = Record<string, string | Record<string, unknown>>

interface BiomeConfig {
  linter: {
    rules: {
      nursery: Record<string, unknown>
    }
  }
}

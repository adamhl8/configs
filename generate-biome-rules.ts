import fs from "node:fs/promises"
import { mergeDeep } from "remeda"

/*
 * This script does the following:
 * - Fetches the latest biome schema from `https://biomejs.dev/schemas/latest/schema.json`
 * - Based on that schema, generates a Biome `linter.rules` object where all the rules are set to `"on"` (`allRules`)
 * - Merges the `OVERRIDES` object into `allRules` (`mergedRules`)
 * - Replaces the `linter.rules` object in the Biome config at `BIOME_CONFIG_PATH` with `mergedRules`
 */

// you probably want this to be `./biome.json`
const BIOME_CONFIG_PATH = "./src/configs/biome.base.json"
const DEFAULT_RULE_SEVERITY = "error"

const OVERRIDES: Rules = {
  complexity: {
    noExcessiveCognitiveComplexity: "off",
    noExcessiveLinesPerFunction: "off",
    noForEach: "off",
    noVoid: "off",
    useLiteralKeys: "off",
  },
  correctness: {
    noNodejsModules: "off",
    noQwikUseVisibleTask: "off",
    noSolidDestructuredProps: "off",
    noUndeclaredDependencies: "off",
    noUndeclaredVariables: "off",
    noUnresolvedImports: "off",
    noVueDataObjectDeclaration: "off",
    noVueDuplicateKeys: "off",
    noVueReservedKeys: "off",
    noVueReservedProps: "off",
    useQwikClasslist: "off",
    useQwikMethodUsage: "off",
    useQwikValidLexicalScope: "off",
  },
  nursery: {
    noContinue: "off",
    noExcessiveClassesPerFile: "off",
    noExcessiveLinesPerFile: "off",
    noIncrementDecrement: "off",
    noSyncScripts: "off",
    noTernary: "off",
    noVueVIfWithVFor: "off",
    useAwaitThenable: "off",
    useExplicitReturnType: "off",
    useExplicitType: "off",
    useSortedClasses: {
      level: DEFAULT_RULE_SEVERITY,
      fix: "safe",
    },
    useVueDefineMacrosOrder: "off",
    useVueHyphenatedAttributes: "off",
    useVueMultiWordComponentNames: "off",
    useVueValidVBind: "off",
    useVueValidVElse: "off",
    useVueValidVElseIf: "off",
    useVueValidVHtml: "off",
    useVueValidVIf: "off",
    useVueValidVOn: "off",
    useVueValidVText: "off",
  },
  performance: {
    noBarrelFile: "off",
    noNamespaceImport: "off",
    useSolidForComponent: "off",
  },
  security: {
    noSecrets: "off",
  },
  style: {
    noEnum: "off",
    noHeadElement: "off",
    noJsxLiterals: "off",
    noMagicNumbers: "off",
    noProcessEnv: "off",
    useBlockStatements: "off",
    useConsistentMemberAccessibility: {
      level: DEFAULT_RULE_SEVERITY,
      options: {
        accessibility: "explicit",
      },
    },
    useExportsLast: "off",
    useFilenamingConvention: "off",
    useImportType: {
      level: DEFAULT_RULE_SEVERITY,
      options: {
        style: "separatedType",
      },
    },
    useNamingConvention: "off",
  },
  suspicious: {
    noConsole: "off",
    noReactSpecificProps: "off",
  },
}

async function getAllRules() {
  const schema = (await (await fetch("https://biomejs.dev/schemas/latest/schema.json")).json()) as BiomeSchema
  const ruleGroupName = Object.keys(schema.$defs.Rules.properties).filter((key) => key !== "recommended")

  const allRules: Rules = {}
  for (const groupName of ruleGroupName) {
    // definition names are in PascalCase
    const groupDefinitionName = groupName.charAt(0).toUpperCase() + groupName.slice(1)
    const groupDefinition = schema.$defs[groupDefinitionName]
    const ruleNames = Object.keys(groupDefinition?.properties ?? {}).filter((key) => key !== "recommended")

    allRules[groupName] = {}
    for (const ruleName of ruleNames) {
      allRules[groupName][ruleName] = DEFAULT_RULE_SEVERITY
    }
  }

  return allRules
}

/** Sorts the rules alphabetically and puts overrides at the top */
function sortRules(rules: Rules) {
  const sortedRules: Rules = {}

  for (const [groupName, groupRules] of Object.entries(rules)) {
    sortedRules[groupName] = {
      ...sortObjectKeys(OVERRIDES[groupName] ?? {}),
      ...sortObjectKeys(groupRules),
    }
  }

  return sortedRules
}

const allRules = await getAllRules()
const mergedRules = mergeDeep(allRules, OVERRIDES)
const sortedRules = sortRules(mergedRules)
const biomeConfig = JSON.parse(await fs.readFile(BIOME_CONFIG_PATH, "utf-8")) as BiomeConfig
biomeConfig.linter.rules = sortedRules
await fs.writeFile(BIOME_CONFIG_PATH, JSON.stringify(biomeConfig, null, 2))

// === utils ===

function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))) as T
}

// ==== types ====

interface BiomeSchema {
  $defs: {
    Rules: {
      properties: Record<string, unknown>
    }
    [definitionName: string]: {
      properties: Record<string, unknown>
    }
  }
}

interface Rules {
  [groupName: string]: {
    [ruleName: string]: string | Record<string, unknown>
  }
}

interface BiomeConfig {
  linter: {
    rules: Record<string, unknown>
  }
}

import fs from "node:fs/promises"
import { merge } from "es-toolkit"

/*
 * This script does the following:
 * - Fetches the latest biome schema from `https://biomejs.dev/schemas/latest/schema.json`
 * - Based on that schema, generates a Biome `linter.rules` object where all the rules are set to `"on"` (`allRules`)
 * - Merges the `OVERRIDES` object into `allRules` (`mergedRules`)
 * - Replaces the `linter.rules` object in the Biome config at `BIOME_CONFIG_PATH` with `mergedRules`
 */

const BIOME_CONFIG_PATH = "./src/biome.base.json"

const OVERRIDES = {
  complexity: {
    useLiteralKeys: "off",
    noExcessiveCognitiveComplexity: "off",
    noExcessiveLinesPerFunction: "off",
    noVoid: "off",
  },
  correctness: {
    noNodejsModules: "off",
    noSolidDestructuredProps: "off",
    noUndeclaredDependencies: "off",
    noUndeclaredVariables: "off",
  },
  nursery: {
    noSecrets: "off",
    noUnresolvedImports: "off",
    useExplicitType: "off",
  },
  performance: {
    noBarrelFile: "off",
    noNamespaceImport: "off",
  },
  style: {
    useImportType: {
      level: "on",
      options: {
        style: "separatedType",
      },
    },
    noEnum: "off",
    noProcessEnv: "off",
    useBlockStatements: "off",
    useConsistentMemberAccessibility: {
      level: "on",
      options: {
        accessibility: "explicit",
      },
    },
    useExportsLast: "off",
    useFilenamingConvention: "off",
    useNamingConvention: "off",
  },
  suspicious: {
    noConsole: "off",
    noReactSpecificProps: "off",
  },
}

async function getAllRules() {
  const schema = (await (await fetch("https://biomejs.dev/schemas/latest/schema.json")).json()) as BiomeSchema
  const ruleGroupName = Object.keys(schema.definitions.Rules.properties).filter((key) => key !== "recommended")

  const allRules: AllRules = {}
  for (const groupName of ruleGroupName) {
    // definition names are in PascalCase
    const groupDefinitionName = groupName.charAt(0).toUpperCase() + groupName.slice(1)
    const groupDefinition = schema.definitions[groupDefinitionName]
    const ruleNames = Object.keys(groupDefinition?.properties ?? {}).filter((key) => key !== "recommended")

    allRules[groupName] = {}
    for (const ruleName of ruleNames) {
      allRules[groupName][ruleName] = "on"
    }
  }

  return allRules
}

const allRules = await getAllRules()
const mergedRules = merge(allRules, OVERRIDES)
const biomeConfig = JSON.parse(await fs.readFile(BIOME_CONFIG_PATH, "utf-8")) as BiomeConfig
biomeConfig.linter.rules = mergedRules
await fs.writeFile(BIOME_CONFIG_PATH, JSON.stringify(biomeConfig, null, 2))

// ==== types ====

interface BiomeSchema {
  definitions: {
    Rules: {
      properties: Record<string, unknown>
    }
    [definitionName: string]: {
      properties: Record<string, unknown>
    }
  }
}

interface AllRules {
  [groupName: string]: {
    [ruleName: string]: "on"
  }
}

interface BiomeConfig {
  linter: {
    rules: Record<string, unknown>
  }
}

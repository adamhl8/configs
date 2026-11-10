import type { KnipConfig, KnipConfiguration } from "knip"

import type { ArgsMergeConfigFn } from "#merge-config/merge-config.ts"
import { createArgsMergeConfigFn } from "#merge-config/merge-config.ts"

type KnipArgs = Parameters<Extract<KnipConfig, (...args: never[]) => unknown>>[0]

/** Builds the base config for one knip run. `knip --production` leaves out tests and devDependencies. */
const createBaseConfig = ({ production }: KnipArgs) => {
  const isProduction = production === true
  return {
    // Mark `**/*` with `!`, because `knip --production` only reads marked patterns.
    // Mark the `__tests__` exclusion too, so it applies only to the production run.
    // Exclude fixtures with negated `project` globs because knip hints to remove an `ignore` glob that hides nothing.
    project: ["**/*!", "!**/__tests__/**!", "!**/fixtures/**", "!**/fixture/**"],
    bun: {
      // List `bask.ts` because bask loads it by path and nothing imports it.
      // Add it here because a top-level `entry` replaces knip's default entries.
      entry: ["**/*.test.ts", "bask.ts"],
    },
    // Keep an export that its own module uses, so a test can import it from that module.
    // A re-export that only tests use still shows up, so a package's main module exports only what runtime code uses.
    ignoreExportsUsedInFile: isProduction,
    // Skip binaries in the production run, because it ignores devDependencies and reports the dev tools that configs run.
    // Mark each branch `as const`, because the outer `as const` doesn't reach into a conditional.
    exclude: isProduction ? (["binaries"] as const) : ([] as const),
  } as const satisfies KnipConfiguration
}

type BaseConfig = ReturnType<typeof createBaseConfig>

// Return the config as a function, because knip calls it with its CLI arguments and the production run needs its own settings.
// Annotate the export so the published types name knip's types instead of spelling them out.
export const knipConfig: ArgsMergeConfigFn<KnipConfiguration, BaseConfig, KnipArgs> = createArgsMergeConfigFn<
  KnipConfiguration,
  BaseConfig,
  KnipArgs
>(createBaseConfig)

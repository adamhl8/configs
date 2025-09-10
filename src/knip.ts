import type { KnipConfig } from "knip"

export const knipConfig = {
  entry: ["**/*.test.ts"], // knip automatically grabs the `./src/index.ts` entrypoint with its tsdown plugin
  project: ["**"],
} as const satisfies KnipConfig

import { knipConfig, IGNORE_BINARIES } from "#/configs/knip.base.ts"

const config = knipConfig(
  {
    ignoreBinaries: [...IGNORE_BINARIES, "adamhl8-cliff", "git-cliff"],
    ignoreDependencies: [],
  },
  { arrays: "replace" },
)

export default config

import { knipConfig, IGNORE_BINARIES } from "#/configs/knip.base.ts"

const config = knipConfig(
  {
    ignoreBinaries: [...IGNORE_BINARIES, "adamhl8-cliff", "git-cliff"],
    // this repo lists the base's other ignores as real deps, so only markdown-toc needs ignoring here
    ignoreDependencies: ["markdown-toc"],
  },
  { arrays: "replace" },
)

export default config

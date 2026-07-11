import { knipConfig } from "#configs/knip.base.ts"

const config = knipConfig({
  ignoreDependencies: { value: [], mode: "replace" },
})

export default config

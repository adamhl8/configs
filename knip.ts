import { knipConfig } from "#configs/knip.base.ts"

// Knip doesn't read commands run with bask's `sh`, which is the only place this repo runs its own bins and `markdown-toc`.
const config = knipConfig({ ignoreDependencies: ["@adamhl8/configs", "markdown-toc"] })

export default config

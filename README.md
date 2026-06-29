# configs

Configs (`tsconfig`, `oxfmt`, `oxlint`, etc.) I use across my projects.

```sh
nub add -D @adamhl8/configs
```

### tsconfig

```json
{
  "extends": "@adamhl8/configs/tsconfig"
}
```

### oxfmt / oxlint

```ts
import { oxfmtConfig } from "@adamhl8/configs"
import { defineConfig } from "oxfmt"

const config = oxfmtConfig({ ... })

export default defineConfig(config)
```

### knip

```ts
import { knipConfig } from "@adamhl8/configs"

export default knipConfig({ ... })
```

### tsdown

```ts
import { tsdownConfig } from "@adamhl8/configs"
import { defineConfig } from "tsdown"

const config = tsdownConfig({ ... })

export default defineConfig(config)
```

### vitest

```ts
import { vitestConfig } from "@adamhl8/configs"
import { defineConfig } from "vitest/config"

const config = vitestConfig({ ... })

export default defineConfig(config)
```

## Notes

The `prepare` script looks like: `"prepare": "lefthook install && nub ./patch-knip.ts && tsdown"`

nub installs `package.json` bin executables into the local `node_modules/.bin`. This means that we can run something like `adamhl8-knip` directly instead of doing `src/adamhl8-knip/index.tx`. That's why we have `tsdown` in the prepare script. Those executables need to be available.

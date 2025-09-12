# configs

Configs (`tsconfig`, `biome`, etc) I use across my projects.

```sh
bun add -D @adamhl8/configs
```

### tsconfig

```json
{
  "extends": "@adamhl8/configs/tsconfig"
}
```

### biome

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "extends": ["@adamhl8/configs/biome"]
}
```

#### Config notes

```jsonc
"json": {
  "formatter": {
    // this is 'auto' by default, except that biome uses 'always' for package.json
    // setting it to 'auto' explicitly makes it consistent across all files, including package.json
    "expand": "auto"
  }
},
```

```jsonc
// https://github.com/biomejs/biome/issues/6676 - Plugins are resolved relative to the *root* config, not the config specifying the plugin
// Extending this config from the root config of this project causes an error because the plugin files do not exist in 'node_modules'. i.e. the whole 'node_modules/@adamhl8/configs' directory doesn't exist because that's *this* project (we don't install this project in itself)
// As a workaround, we use the prepare script to manually copy the './src/biome-plugins/' directory to the correct location in 'node_modules'.
"plugins": ["./node_modules/@adamhl8/configs/dist/biome-plugins/import-paths.grit"],
```

### knip

```ts
import { knipConfig } from "@adamhl8/configs"
import type { KnipConfig } from "knip"

const config = knipConfig({ ... }) satisfies KnipConfig

export default config
```

### tsdown

```ts
import { tsdownConfig } from "@adamhl8/configs"
import { defineConfig } from "tsdown"

export default defineConfig(tsdownConfig())
```

### prettier

```js
import { config } from "@adamhl8/configs/prettier"

export default {
  ...config,
}
```

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

#### Notes

```jsonc
"json": {
  "formatter": {
    // this is 'auto' by default, except that biome uses 'always' for package.json
    // setting it to 'auto' explicitly makes it consistent across all files, including package.json
    "expand": "auto"
  }
},
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

export default defineConfig(tsdownConfig({ ... }))
```

### prettier

```js
import { prettierConfig } from "@adamhl8/configs"

export default prettierConfig({ ... })
```

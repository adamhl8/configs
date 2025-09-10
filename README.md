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

### prettier

```js
import { config } from "@adamhl8/configs/prettier"

export default {
  ...config,
}
```

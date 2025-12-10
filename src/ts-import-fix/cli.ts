import { message, multiple, object, option, string } from "@optique/core"
import { run } from "@optique/run"

export function cli() {
  const options = object({
    write: option("-w", "--write", {
      description: message`Write changes to files`,
    }),
    skipAlias: option("--skip-alias", {
      description: message`Skip transforming relative imports to use an alias`,
    }),
    fileIgnorePatterns: multiple(
      option("-f", "--file-ignore", string({ metavar: "PATTERN" }), {
        description: message`Additional glob patterns for files to ignore`,
      }),
    ),
    importIgnoreStrings: multiple(
      option("-i", "--import-ignore", string(), {
        description: message`An import path *containing* the given string will be ignored`,
      }),
    ),
  })
  const parseResult = run(options, {
    programName: "ts-import-fix",
    help: "option",
    showDefault: { prefix: " [default: " },
  })

  return parseResult
}

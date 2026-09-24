# user-defined functions are unstable as of just 1.52
set unstable
set allow-duplicate-recipes

# runs cmd if the condition command succeeds, echoing cmd only when it runs
run-when(cmd, condition) := f"if {{ condition }}; then echo {{ quote(style("command", cmd)) }}; {{ cmd }}; fi"

in-ci := '[ -n "${CI:-}" ]'
not-in-ci := '[ -z "${CI:-}" ]'

# run if not in CI, the repo has a root module, and the aws profile exists on this machine
tofu-run-condition := not-in-ci + ' && ls *.tofu >/dev/null 2>&1 && aws configure list-profiles 2>/dev/null | grep -qx adamhl8'

# public recipes are thin wrappers over private _recipes so an override can still call the original
# e.g. `prepare: _prepare` + extra lines

prepare: _prepare
_prepare:
    @{{ run-when("lefthook install", not-in-ci) }}
    bun adamhl8-gitignore
    bun adamhl8-bunfig
    bun oxfmt bunfig.toml
    @{{ run-when("tofu init -upgrade", tofu-run-condition) }}

bump-deps: _bump-deps
_bump-deps:
    bunx npm-check-updates --upgrade --format group
    rm -f bun.lock
    rm -rf node_modules/
    bun install --no-summary --no-cache

tofu-check: _tofu-check
_tofu-check:
    @{{ run-when("tofu plan -detailed-exitcode -concise -compact-warnings", tofu-run-condition) }}

lint: _lint
_lint:
    bun markdown-toc -i --bullets '-' --maxdepth 3 ./README.md
    bun oxlint --fix --fix-suggestions --fix-dangerously
    bun oxfmt
    @# format all justfiles, excluding ones that are gitignored
    git ls-files -z --cached --others --exclude-standard ':(glob)**/[Jj]ustfile' ':(glob)**/.justfile' ':(glob)**/*.just' | xargs -0 -r -n1 just --fmt --justfile
    bun knip-bun
    @{{ run-when("actionlint", "[ -d .github/workflows ]") }}
    @just test

build: _build
# lint fixes and formatting are applied in place, so in CI fail if the build changed or created any files
# --intent-to-add makes untracked files show up in the diff
_build: lint && tofu-check
    @{{ run-when("bun tsdown", "[ -f tsdown.config.ts ]") }}
    @{{ run-when("git add --intent-to-add --all && git diff --exit-code", in-ci) }}

test: _test
_test:
    @bun test --pass-with-no-tests

release: _release
_release:
    gh workflow run release.yml

[private]
release-run: _release-run

_release-run:
    bun release-it -VV --ci

commit-types: _commit-types
_commit-types:
    @bun commitlint --print-config json | bun -e 'console.log("Commit types:\n    " + (await Bun.stdin.json()).rules["type-enum"][2].join("\n    "))'

[default]
_default:
    @{{ just_executable() }} --list
    @echo
    @{{ just_executable() }} commit-types

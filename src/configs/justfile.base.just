# user-defined functions are unstable as of just 1.52
set unstable
set default-list
set allow-duplicate-recipes

# runs cmd if the condition command succeeds, echoing cmd only when it runs
run-when(cmd, condition) := f"if {{condition}}; then echo {{style("command", cmd)}}; {{cmd}}; fi"

# run if not in CI, the repo has a root module, and the aws profile exists on this machine
tofu-run-condition := '[ -z "${CI:-}" ] && ls *.tofu >/dev/null 2>&1 && aws configure list-profiles 2>/dev/null | grep -qx adamhl8'

# public recipes are thin wrappers over private _recipes so an override can still call the original
# e.g. `prepare: _prepare` + extra lines

prepare: _prepare
_prepare:
    lefthook install
    bun adamhl8-gitignore
    bun adamhl8-bunfig
    bun oxfmt bunfig.toml
    @{{ run-when("tofu init -upgrade", tofu-run-condition) }}

bump-deps: _bump-deps
_bump-deps:
    bunx npm-check-updates --upgrade --format group
    rm -f bun.lock
    rm -rf node_modules/
    bun install --no-summary

tofu-check: _tofu-check
_tofu-check:
    @{{ run-when("tofu plan -detailed-exitcode -concise -compact-warnings", tofu-run-condition) }}

lint: _lint
_lint:
    bun markdown-toc -i --bullets '-' --maxdepth 3 ./README.md
    bun oxlint --fix --fix-suggestions --fix-dangerously
    bun oxfmt
    bun knip-bun
    @just test

build: _build
_build: lint && tofu-check
    @{{ run-when("bun tsdown", "[ -f tsdown.config.ts ]") }}

test: _test
_test:
    @bun test --pass-with-no-tests

release: _release
_release:
    gh workflow run release.yml

[private]
release-run: _release-run

_release-run:
    bun release-it -VV --ci -i "$(bun adamhl8-cliff --bumped-version)"

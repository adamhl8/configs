# user-defined functions are unstable as of just 1.52
set unstable
set default-list
set allow-duplicate-recipes

export PATH := justfile_directory() + "/node_modules/.bin:" + env("PATH")

# runs cmd if the condition command succeeds, echoing cmd only when it runs
run-when(cmd, condition) := f"if {{condition}}; then echo {{style("command", cmd)}}; {{cmd}}; fi"

# public recipes are thin wrappers over private _recipes so an override can still call the original
# e.g. `prepare: _prepare` + extra lines

prepare: _prepare
_prepare:
    lefthook install
    adamhl8-gitignore
    adamhl8-bunfig
    oxfmt bunfig.toml

bump-deps: _bump-deps
_bump-deps:
    bunx npm-check-updates --upgrade --format group
    rm -f bun.lock
    rm -rf node_modules/
    bun i --ignore-scripts --no-summary

tofu-check: _tofu-check
_tofu-check:
    @# run if not in CI, the repo has a root module, and the aws profile exists on this machine
    @{{ run-when("tofu plan -detailed-exitcode -concise -compact-warnings", '[ -z "${CI:-}" ] && ls *.tofu >/dev/null 2>&1 && aws configure list-profiles 2>/dev/null | grep -qx adamhl8') }}

lint: _lint
_lint:
    markdown-toc -i --bullets '-' --maxdepth 3 ./README.md
    oxlint --fix --fix-suggestions --fix-dangerously
    oxfmt
    knip
    @just test

build: _build
_build: lint && tofu-check
    @{{ run-when("tsdown", "[ -f tsdown.config.ts ]") }}

test: _test
_test:
    @bun test --pass-with-no-tests

release: _release
_release:
    gh workflow run release.yml

[private]
release-run: _release-run

_release-run:
    release-it --ci -i "$(adamhl8-cliff --bumped-version)"

# user-defined functions are unstable as of just 1.52
set unstable
set default-list
set allow-duplicate-recipes

export PATH := justfile_directory() + "/node_modules/.bin:" + env("PATH")

# runs cmd if the [ ] condition holds, echoing cmd only when it runs
run-when(cmd, condition) := f"if [ {{condition}} ]; then echo {{style("command", cmd)}}; {{cmd}}; fi"

# public recipes are thin wrappers over private _recipes so an override can still call the original
# e.g. `prepare: _prepare` + extra lines

prepare: _prepare
_prepare:
    lefthook install

bump-deps: _bump-deps
_bump-deps:
    nub update -L
    rm -f lock.yaml
    nub i --no-frozen-lockfile
    oxfmt lock.yaml

tofu-check: _tofu-check
_tofu-check:
    @{{ run-when("tofu plan -detailed-exitcode -concise -compact-warnings", '-z "${CI:-}"') }}

lint: _lint
_lint:
    markdown-toc -i --bullets '-' --maxdepth 3 ./README.md
    oxlint --fix --fix-suggestions --fix-dangerously
    oxfmt
    knip
    @{{ run-when("just test", "-f vitest.config.ts") }}

build: _build
_build: lint && tofu-check
    @{{ run-when("tsdown", "-f tsdown.config.ts") }}

test: _test
_test:
    vitest run

release: _release
_release:
    gh workflow run release.yml

[private]
release-run: _release-run

_release-run:
    release-it --ci -i "$(adamhl8-cliff --bumped-version)"

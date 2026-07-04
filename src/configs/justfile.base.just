# user-defined functions are unstable as of just 1.52
set unstable
set default-list
set allow-duplicate-recipes
set lazy

export PATH := justfile_directory() + "/node_modules/.bin:" + env("PATH")

# runs cmd if the [ ] condition holds, echoing cmd only when it runs
run-when(cmd, condition) := f"if [ {{condition}} ]; then echo {{style("command", cmd)}}; {{cmd}}; fi"

current_repo := `basename -s .git $(git remote get-url origin)`

prepare:
    lefthook install
    @{{ run-when("tsdown", f"{{current_repo}} = configs") }}

bump-deps:
    nub update -L
    rm -f lock.yaml
    nub i --no-frozen-lockfile
    oxfmt lock.yaml

lint:
    markdown-toc -i --bullets '-' --maxdepth 3 ./README.md
    oxlint --fix --fix-suggestions --fix-dangerously
    oxfmt
    knip
    @{{ run-when("just test", "-f vitest.config.ts") }}

build: lint
    @{{ run-when("tsdown", "-f tsdown.config.ts") }}

test:
    vitest run

release:
    gh workflow run release.yml

[private]
release-run:
    release-it --ci -i "$(adamhl8-cliff --bumped-version)"

import "src/configs/justfile.base.just"

tsdown:
    tsdown

# on a fresh install, bun skips linking this package's own bins because dist/ doesn't exist yet, so re-link after tsdown builds them (--ignore-scripts avoids re-running prepare)
relink:
    bun i --ignore-scripts --no-summary

prepare: tsdown relink _prepare

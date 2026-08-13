#!/usr/bin/env sh

set -e

npm run build

cd out

# GitHub Pages runs Jekyll over whatever it is given, and Jekyll skips every
# directory whose name starts with an underscore. Without this file the whole
# of _next/ is dropped and the site is served without scripts or styles.
touch .nojekyll

# Explicit branch name: git init follows init.defaultBranch, which is "main"
# here, so the old "master:gh-pages" refspec no longer matched anything.
git init -b deploy
git add -A
git commit -m "New Deployment"
git push -f git@github.com:henryjfv/CV.git deploy:gh-pages

cd -

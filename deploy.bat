#!/usr/bin/env sh

set -e

npm run build

cd dist

# Explicit branch name: git init follows init.defaultBranch, which is "main"
# here, so the old "master:gh-pages" refspec no longer matched anything.
git init -b deploy
git add -A
git commit -m "New Deployment"
git push -f git@github.com:henryjfv/CV.git deploy:gh-pages

cd -

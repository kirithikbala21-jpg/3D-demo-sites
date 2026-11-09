#!/bin/sh
# Builds the demos site for Cloudflare Pages (demos.kbventures.com.au): only the six demo folders, nothing else from the repo.
set -e
rm -rf dist && mkdir dist
for d in barber-demo cafe-demo-v2 gym-demo plumber-demo salon-demo parts-store-demo; do
  cp -r "$d" "dist/$d"
  rm -rf "dist/$d/tools" "dist/$d/tests" "dist/$d/node_modules"
done
printf '/ https://web.kbventures.com.au/work 302\n' > dist/_redirects
printf 'User-agent: *\nAllow: /\n' > dist/robots.txt
echo "built dist/"

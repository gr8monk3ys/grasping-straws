#!/bin/sh
# Serve the built site and drive it end to end (run `npm run build` first).
set -e
python3 -m http.server 8317 --bind 127.0.0.1 --directory dist >/dev/null 2>&1 &
server=$!
trap 'kill $server' EXIT
sleep 1
node scripts/verify.js

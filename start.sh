#!/bin/sh
# set +e
set -e

find . -name ".DS_Store" -delete

brew services start redis &
# brew services restart redis

cd app
# NODE_DEBUG=true node --trace-deprecation server.js
nodemon --trace-deprecation server.js -i dbChat


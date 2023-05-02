#!/bin/sh
# set +e
set -e

find . -name ".DS_Store" -delete

brew services start redis
NODE_DEBUG=true node --trace-deprecation server.js


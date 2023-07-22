#!/bin/sh
# set +e
set -e

find . -name ".DS_Store" -delete

brew services start redis &
# brew services restart redis

pkill -9 turnserver
turnserver -o -c /usr/local/etc/turnserver.conf -a -f -v -r beijing --relay-threads 50
ps -ef|grep turn

cd app
# NODE_DEBUG=true node --trace-deprecation server.js
nodemon --trace-deprecation server.js -i dbChat


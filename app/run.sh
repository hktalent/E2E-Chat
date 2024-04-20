# brew services  start redis
find . -name ".DS_Store*" -delete
find tmp -empty -delete
# cd /app/
# npm install
# npm prune --production=true
# npm prune --omit=dev
rm -rf static/js.js static/v8.js static/css.css;
# DEBUG=true 
# NODE_DEBUG=true 
# node --inspect --trace-deprecation server.js
NODE_ENV=production node server.js

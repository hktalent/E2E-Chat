brew services  start redis
rm -rf static/js.js static/v8.js static/css.css;
# DEBUG=true 
node --inspect --trace-deprecation server.js


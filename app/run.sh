# brew services  start redis
find . -name ".DS_Store*" -delete
find tmp -empty -delete
echo "最近 1 天修改过文件 start"
find . -type f -mtime -1|grep -v '.git'|grep -Ev 'node_modules|dbChat'
echo "最近 1 天修改过文件 end"
# cd /app/
# npm install
# npm prune --production=true
# npm prune --omit=dev
rm -rf tmp
rm -rf static/js.js static/v8.js static/vt/*
# 合并产物按源文件 mtime 复用，重启时不再重复压缩/混淆
# rm -f static/js/,.js static/css.css
# DEBUG=true 
# NODE_DEBUG=true 
# node --inspect --trace-deprecation server.js
NODE_ENV=production node server.js
# DEBUG=true node server.js
# DEBUG=true NODE_ENV=debug node server.js

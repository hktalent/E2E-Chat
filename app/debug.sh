curPwd=`pwd`
cd $HOME/MyWork/web-ai-51pwn
yarn build
gitpush "up"

cd $HOME/MyWork/web-ai
yarn build
gitpush "up"

cd $curPwd
rm -rf static/js.js static/css.css
node server.js

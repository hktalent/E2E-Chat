curPwd=`pwd`
cd $HOME/MyWork/web-ai-51pwn
yarn build
cd $HOME/MyWork/web-ai
yarn build
cd $curPwd
rm -rf static/js.js static/css.css
node server.js

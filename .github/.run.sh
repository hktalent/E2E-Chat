tmux new -s ss -d
tmux send -t "ss" "tools/frp -c tools/frpcweb.ini" Enter
cd app
NODE_DEBUG=true node --trace-deprecation server.js

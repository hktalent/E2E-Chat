# export rip=144.202.116.91
# export rip=65.49.208.113
#export rport=22
# export rport=26188
xxx="app1"
function rcp(){
	rport=26188
	rip="65.49.208.113"
	scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -C -r -P ${rport} "$1"  root@${rip}:"$2"
	rport=22
	rip="144.202.116.91"
	scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -C -r -P ${rport} "$1"  root@${rip}:"$2"
}

# reset;ssh -i ~/.ssh/id_rsa -C -p ${rport} root@${rip}

ls app/*.js|xargs -I % ./rcp.sh % /root/${xxx}/%

rcp app/static/js/pmap.json /root/${xxx}/app/static/js/
rcp app/package.json /root/${xxx}/app/
rcp app/nodemon.json /root/${xxx}/app/
# rcp app/static/index_en.html /root/${xxx}/app/static/

rcp app/static/plyr.svg /root/${xxx}/app/static/
# 静态资源，经常需要更新

rcp app/static/js/pmap.json /root/${xxx}/app/static/js/
rcp app/static/index.html /root/${xxx}/app/static/
rcp app/static/js.js /root/${xxx}/app/static/
rcp app/static/js/p2pchat.js /root/${xxx}/app/static/js/
rcp app/static/css.css /root/${xxx}/app/static/
rcp app/static/v8.js /root/${xxx}/app/static/

rcp app/static/js/bundle.js /root/${xxx}/app/static/js/
rcp app/static/js/ocr.js /root/${xxx}/app/static/js/

rcp app/static/js/v8.js /root/${xxx}/app/static/js/
rcp app/static/js/msd.js /root/${xxx}/app/static/js/
rcp app/static/js/common.js /root/${xxx}/app/static/js/
rcp app/static/js/392.js /root/${xxx}/app/static/js/
rcp app/static/js/tensorflow.js /root/${xxx}/app/static/js/

rm -rf i.js
wget --no-check-certificate -c https://127.0.0.1:2083/js/i.js
rcp i.js /root/${xxx}/app/static/js/
rm -rf i.js

# rm -rf sw.js
# wget --no-check-certificate -c https://127.0.0.1:2083/js/sw.js
# rcp sw.js /root/${xxx}/app/static/js/
# rm -rf sw.js

rcp app/static/js/p2pfs.js /root/${xxx}/app/static/js/
rcp app/static/js/sw.js /root/${xxx}/app/static/js/
rcp app/static/js/crypto-js.min.js /root/${xxx}/app/static/js/
rcp app/static/js/fix.js /root/${xxx}/app/static/js/
rcp app/static/js/tfjs.js /root/${xxx}/app/static/js/
rcp app/static/js/plyr.js /root/${xxx}/app/static/js/
rcp app/static/js/webtorrent.min.js /root/${xxx}/app/static/js/

rcp app/static/js/stunLists.js /root/${xxx}/app/static/js/

rcp app/static/js/client.min.js.map /root/${xxx}/app/static/js/
rcp app/static/js/socket.io.js /root/${xxx}/app/static/js/

rcp app/static/js/html5-qrcode.min.js /root/${xxx}/app/static/js/
rcp app/static/js/qrcode.min.js /root/${xxx}/app/static/js/
rcp app/static/js/adapter-latest.js /root/${xxx}/app/static/js/
rcp app/static/js/RecordRTC.min.js /root/${xxx}/app/static/js/
rcp app/static/js/jquery.min.js /root/${xxx}/app/static/js/
rcp app/static/js/client.min.js /root/${xxx}/app/static/js/

# server
# p2pchat 不能随便更新，更新时需要关闭 domainLock debugProtection
rcp app/p2pchat.js_1 /root/${xxx}/app/p2pchat.js
rcp app/mergeRes.js /root/${xxx}/app/
rcp app/myapp_51pwn.js /root/${xxx}/app/
rcp app/expressOptions.js /root/${xxx}/app/
rcp app/server.js /root/${xxx}/app/

# rcp app/static/msg.mp3 /root/${xxx}/app/static/
# rcp app/static/online.mp3 /root/${xxx}/app/static/
# rcp app/static/wh01.mp3 /root/${xxx}/app/static/
# rcp app/static/k01.mp3 /root/${xxx}/app/static/

# rcp app/static/favicon.ico /root/${xxx}/app/static/
# rcp app/static/model/tfjs-backend-wasm-threaded-simd.wasm /root/${xxx}/app/static/model/
# rcp app/static/model/tfjs-backend-wasm-simd.wasm /root/${xxx}/app/static/model/
# rcp app/static/model/tfjs-backend-wasm.wasm /root/${xxx}/app/static/model/

# rcp app/static/model/yolov8n_web_model /root/${xxx}/app/static/model/
# rcp app/static/model/yolov8n-seg_web_model /root/${xxx}/app/static/model/
# rcp app/static/model/yolov8x-seg_web_model /root/${xxx}/app/static/model/

# rcp app/static/models /root/${xxx}/app/static/
# rcp app/static/model /root/${xxx}/app/static/

# 静态资源，不需要常更新
# rcp app/static/css/b.svg /root/${xxx}/app/static/css/
# rcp app/static/js/ie.js /root/${xxx}/app/static/js/
# rcp app/static/js/kindle.js /root/${xxx}/app/static/js/
# rcp app/static/js/test.js /root/${xxx}/app/static/js/
# rcp app/static/x.html /root/${xxx}/app/static/
# rcp app/static/cp1.svg /root/${xxx}/app/static/
# rcp app/static/msg.mp3 /root/${xxx}/app/static/
# rcp app/static/online.mp3 /root/${xxx}/app/static/

export rip=65.49.208.113
export rport=26188

xxx="app1"


rcp app/package.json /root/${xxx}/app/
rcp app/nodemon.json /root/${xxx}/app/
rcp app/static/index_en.html /root/${xxx}/app/static/

rcp app/static/plyr.svg /root/${xxx}/app/static/
# 静态资源，经常需要更新
rcp app/static/js.js /root/${xxx}/app/static/
rcp app/static/css.css /root/${xxx}/app/static/

rcp app/static/index.html /root/${xxx}/app/static/

rcp app/static/js/bundle.js /root/${xxx}/app/static/js/
rcp app/static/js/ocr.js /root/${xxx}/app/static/js/
rcp app/static/js/v8.js /root/${xxx}/app/static/js/

rcp app/static/js/sw.js /root/${xxx}/app/static/js/
rcp app/static/js/client.min.js.map /root/${xxx}/app/static/js/
rcp app/static/js/socket.io.js /root/${xxx}/app/static/js/
rcp app/static/js/plyr.js /root/${xxx}/app/static/js/
rcp app/static/js/fix.js /root/${xxx}/app/static/js/
rcp app/static/js/aes.js /root/${xxx}/app/static/js/
rcp app/static/js/html5-qrcode.min.js /root/${xxx}/app/static/js/
rcp app/static/js/qrcode.min.js /root/${xxx}/app/static/js/
rcp app/static/js/adapter-latest.js /root/${xxx}/app/static/js/
rcp app/static/js/RecordRTC.min.js /root/${xxx}/app/static/js/
rcp app/static/js/jquery.js /root/${xxx}/app/static/js/
rcp app/static/js/client.min.js /root/${xxx}/app/static/js/



# server
rcp app/p2pchat.js_1 /root/${xxx}/app/p2pchat.js
rcp app/mergeRes.js /root/${xxx}/app/
rcp app/myapp_51pwn.js /root/${xxx}/app/
rcp app/server.js /root/${xxx}/app/
rcp app/expressOptions.js /root/${xxx}/app/


# rcp app/static/model/yolov8n_web_model /root/${xxx}/app/static/model/
# rcp app/static/model/yolov8n-seg_web_model /root/${xxx}/app/static/model/

# rcp app/static/models /root/${xxx}/app/static/
# rcp app/static/model /root/${xxx}/app/static/

# 静态资源，不需要常更新
# rcp app/static/css/b.png /root/${xxx}/app/static/css/b.png
# rcp app/static/js/ie.js /root/${xxx}/app/static/js/
# rcp app/static/js/kindle.js /root/${xxx}/app/static/js/
# rcp app/static/js/test.js /root/${xxx}/app/static/js/
# rcp app/static/x.html /root/${xxx}/app/static/
# rcp app/static/cp1.svg /root/${xxx}/app/static/
# rcp app/static/msg.mp3 /root/${xxx}/app/static/
# rcp app/static/online.mp3 /root/${xxx}/app/static/

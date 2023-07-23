# E2E-Chat
端对端（E2E）、点对点(P2P)加密聊天系统
不受任何国家、政府、组织、机构监管，安全可靠、隐秘

https://127.0.0.1:2083/?eAi=true&cnId=51pwn&startChat=1

# 新特性
- VIP 支持 AI 视频中对象检测
- 允许上传图片、其他文件
- 允许粘贴上传文件、图片
- 自动识别网络的可用性，选用安全的 P2P/E2E 线路
- P2P/E2E 时采用当前通道协商的最大数据包 发送文件, 每个人 对应不一样，尤其是在群聊、群发文件时，每个人发送的包数据大小不一样，进行自适应
- ios 手机键盘显示和隐藏时，界面布局“响应式”自适应
- 网络端口后自动重连、自动加入群聊，即便 P2P 不可用时，仍然可以发送消息
- 图片支持点击放大
- 默认 1 分钟自动销毁聊天内容，特别注意，苹果手机目前测试发现，如果浏览器在后台后，计时器会被系统暂停，重新打开后计时器会继续
- 增加参数控制前端 https://chat.51pwn.com:2083/?eAi=true&cnId=51pwn&startChat=1

# more
```
 优化png
 brew install optipng jpegoptim
 optipng $HOME/MyWork/E2E_chat/app/static/css/b.png
```
# /usr/local/etc/turnserver.conf

https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js
https://github.com/tensorflow/tfjs-models
https://tensorflow.google.cn/js/models?hl=zh-cn
https://storage.googleapis.com/tfjs-models/demos/face-landmarks-detection/index.html?model=mediapipe_face_mesh

```
# cat /usr/local/etc/turnserver.conf|grep -Ev '^#|^\s*$'
listening-device=eth0
listening-port=3478
listening-ip=65.49.208.113
external-ip=65.49.208.113
realm=REDACTED_TURN_CREDENTIAL
no-rfc5780
no-stun-backward-compatibility
response-origin-only-with-rfc5780
user=e2eu:REDACTED_TURN_CREDENTIAL
cli-password=REDACTED_TURN_CREDENTIAL
tls-listening-port=5349
relay-threads=50
lt-cred-mech
pidfile="/var/run/turnserver.pid"
cert= /root/app2/ca/fullchain.pem
pkey=/root/app2/ca/privkey.pem
fingerprint
lt-cred-mech
relay-ip=65.49.208.113



```
# change
- 解决了 navigator.mediaDevices.getUserMedia 在 AI 中二次调用导致无法正常检测对象的 bug
- 优化了静态资源压缩等问题

# How Run
```
find . -name ".DS_Store" -delete

export rip=`host 51pwn.com|grep -Eo '(([0-9]{1,3}\.){3}[0-9]{1,3})'`
export rport=26188

ssh -i ~/.ssh/id_rsa -C -p ${rport} root@${rip}
tmux ls
docker run -d -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -p 5349:5349/udp -p 49152-65535:49152-65535/udp coturn/coturn


# https://github.com/fatedier/frp/releases/download/v0.48.0/frp_0.48.0_linux_amd64.tar.gz

brew services start redis
yarn upgrade --latest
NODE_DEBUG=true node --trace-deprecation server.js

```

# TURN and STUN Server
https://github.com/coturn/coturn

```
docker run -d -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -p 5349:5349/udp -p 49152-65535:49152-65535/udp coturn/coturn
```


# code
```
snyk config set api=1d0e5ffb-8d5f-452a-ab64-a40dbc14c376
snyk test
```


# other
```
./doSshSocks5.sh;so

pkill -9 ssh;sc
```

翻墙后可以看到做坐标的地址信息
https://www.openstreetmap.org/search?whereami=1&query=30.67573%2C103.96051



```
 
yum install -y gcc-c++
yum -y install openssl-devel 
wget https://github.com/libevent/libevent/releases/download/release-2.1.12-stable/libevent-2.1.12-stable.tar.gz
tar -zxvf libevent-2.1.12-stable.tar.gz
cd libevent-2.1.12-stable
./configure --prefix=/usr --libdir=/usr/lib64
make
make install



wget https://github.com/coturn/coturn/archive/master.zip
yum install -y unzip zip
unzip master.zip 
cd coturn-master/
./configure
make
make install


which turnserver
turnadmin -a -u e2eu -p REDACTED_TURN_CREDENTIAL -r beijing
cd /usr/local/etc
cp turnserver.conf.default turnserver.conf
openssl req -x509 -newkey rsa:2048 -keyout /etc/turn_server_pkey.pem -out /etc/turn_server_cert.pem -days 99999 -nodes 
ls -lah /etc/turn_server_pkey.pem /etc/turn_server_cert.pem

vi /usr/local/etc/turnserver.conf
listening-port=3478

listening-device=eth0
external-ip=65.49.208.113
listening-ip=65.49.208.113
user=username:password
realm= REDACTED_TURN_CREDENTIAL
cli-password=REDACTED_TURN_CREDENTIAL
tls-listening-port=5349
relay-threads=50
lt-cred-mech
pidfile="/var/run/turnserver.pid"
cert= /root/app2/ca/fullchain.pem
pkey=/root/app2/ca/privkey.pem
relay-ip=65.49.208.113
relay-ports=1000-65534

pkill -9 turnserver
turnserver -o -c /usr/local/etc/turnserver.conf -a -f -v -r beijing --relay-threads 50
ps -ef|grep turn


基于coturn部署，启动了turnserver，但是测试发现，始终他的relay中继功能没有其作用，如何解决？
如果您已经成功地启动了coturn，但是relay中继功能没有正常工作，可能有几个原因。

    防火墙问题：检查您的服务器防火墙配置以确保TURN协议（包括UDP和TCP）的数据包可以顺利通过。端口号默认为3478，但是也可能使用其他端口，具体取决于您的配置。

    NAT穿透问题：如果您的客户端位于NAT网络之后，则必须确保正确配置了TURN服务器。请参阅coturn文档以获取更多详细信息，特别是关于STUN/TURN的配置。

    证书配置问题：如果您使用了加密协议（例如TLS），则必须在TURN服务器上配置正确的证书。请确保证书路径和密码正确。

    配置错误：最后，请检查coturn的配置文件，确保已正确设置relay功能。具体来说，需要设置以下参数：

relay-ip=<your-public-IP>
relay-ports=<port-range-to-be-used-for-relay>

其中，<your-public-IP>是您的服务器公共IP地址，<port-range-to-be-used-for-relay>是一组用于中继的端口号。请注意，此参数应该只包含您选择的端口范围，而不是3478之类的TURN协议本身所需的端口。

如果以上步骤都已检查并确认，但是relay中继功能仍然无法正常工作，请尝试重新启动coturn，并查看日志以获取更多详细信息。
```

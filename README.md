# E2E-Chat
端对端（E2E）、点对点(P2P)加密聊天系统
不受任何国家、政府、组织、机构监管，安全可靠、隐秘

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

# /usr/local/etc/turnserver.conf
```
# cat /usr/local/etc/turnserver.conf|grep -Ev '^#|^\s*$'
listening-device=eth0
listening-port=3478
listening-ip=65.49.208.113
external-ip=65.49.208.113
realm=e2zeuP_p
no-rfc5780
no-stun-backward-compatibility
response-origin-only-with-rfc5780
user=e2eu:e2zeuP_p
cli-password=e2zeuP_p
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
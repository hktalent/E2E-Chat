# E2E-Chat
端对端（E2E）、点对点(P2P)加密聊天系统
不受任何国家、政府、组织、机构监管，安全可靠、隐秘

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
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


brew services start redis
NODE_DEBUG=true node --trace-deprecation server.js

```
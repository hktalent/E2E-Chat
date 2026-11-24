> **E2E Chat** —— 无服务器 E2E 点对点聊天：WebRTC DataChannel + 邀请码/回应码直连，同一套客户端代码既跑在 chat.51pwn.com，也可打包为 Windows / macOS / Linux 桌面应用。
> 桌面端见 [desktop/README.md](desktop/README.md)，安全与隐私说明见 [SECURITY.md](SECURITY.md)。

# Docker + cloudflared 部署指南

## 快速启动

```sh
sh startServer.sh
```

脚本幂等，自动完成：检查 docker → 启动容器 → 等待本地 HTTPS → 检查 cloudflared 配置（缺失自动修复）→ 启动隧道 → 验证公网 200。

## 架构

```
浏览器
  │  HTTPS (cloudflare 签发证书)
  ▼
Cloudflare Edge
  │  Argo Tunnel (http2)
  ▼
cloudflared 本机隧道进程
  │  HTTPS (Cloudflare Origin CA 自签证书, noTLSVerify)
  ▼
127.0.0.1:2083
  │  docker 端口映射 2083→2083
  ▼
容器 e2e_chat  (node:20-alpine, /app/run.sh → node server.js)
```

---

## 多协议频道（IRC / Matrix / XMPP）

在原有 WebRTC P2P 能力之外，Web 版与桌面版都可直接浏览/加入传统 IM 网络的公开频道（聊天室），用于「既有生态 + 自有 P2P」并存互通。既有功能（chat.51pwn.com 首页、P2P 直连、邀请码/回应码、sig-bridge）不受影响，全部为新增挂载点。

- 入口页面：`/im.html`（首页导航栏 🌐 图标进入）
- 页面能力：按 `IRC / Matrix / XMPP` 过滤，列出频道名、说明（topic）、协议标签、**在线人数**；点击「加入」即进入聊天面板，可收发消息、离开。协议由频道地址前缀（`irc://` / `matrix://` / `xmpp://`）自动匹配，调用方无需关心实现。
- 桌面端（Electron）同样内置该页面与接口，本地即可浏览/加入。

### 接口（前缀 `/api/im`，仅对该前缀启用 JSON body）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/im/protocols` | 三协议可用状态（`ok` / `connected` / `note`） |
| GET | `/api/im/channels?protocol=all\|irc\|matrix\|xmpp&q=&limit=400` | 聚合频道列表（人数降序），失败协议在 `errors[]` 里给出明确原因 |
| POST | `/api/im/join` | `{channel}` → `{sid, protocol, server, name}` |
| GET | `/api/im/messages?sid=&cursor=` | 增量拉取消息 |
| POST | `/api/im/send` | `{sid, text}` |
| POST | `/api/im/leave` | `{sid}` |

错误码：`NEED_CREDENTIALS` → 401（需登录凭据）、`BAD_PROTOCOL` → 400、`NO_SESSION`。

### 环境变量（不配也能跑，未配的协议会显示原因）

```
IM_IRC_SERVERS_JSON    # 覆盖 IRC 服务器数组，形如 [{"host":"irc.libera.chat","port":6697,"tls":true,"label":"Libera.Chat"}]
IM_IRC_LOCAL           # 只连自建 ircd，如 127.0.0.1:6667（纯文本）
IM_IRC_NICK/IM_IRC_PASS# 有值则走 SASL PLAIN（Libera 等要求登录的网络）
IM_MATRIX_HS           # 默认 https://matrix.org
IM_MATRIX_TOKEN/USER   # 有 token 才可加入房间（只读列表不需要）
IM_XMPP_JID/IM_XMPP_PASS# 有账号才可加入 MUC
IM_XMPP_MUC            # 默认 conference.xmpp.jp
IM_XMPP_SERVICE        # 默认 xmpp://xmpp.jp:5222
IM_IRC_DISABLE / IM_MATRIX_DISABLE / IM_XMPP_DISABLE  # 关掉某协议
```

### 出网与代理（关键）

公网 IRC / Matrix 在多数网络被直连阻断，Node 的 `fetch` **不会**自动走系统代理。因此桥接层自带零依赖出网层 `app/im/netproxy.js`，支持 SOCKS5 / SOCKS5h / HTTP CONNECT（含用户名密码），并可由环境变量控制：

```
IM_SOCKS_PROXY=socks5://127.0.0.1:1081     # 推荐：本机系统代理（如 mihomo/clash 的 mixed 端口）
IM_HTTP_PROXY=http://127.0.0.1:8080        # 或者 HTTP 代理
IM_PROXY_FALLBACK=1                        # 允许回落 ALL_PROXY / HTTPS_PROXY
IM_PROXY_AUTODETECT=1                      # macOS 下自动读系统代理（scutil --proxy），桌面版默认开启
```

实测（本机 SOCKS 1081）：`matrix.org` 200、`irc.oftc.net` LIST 2861 个频道、`open.ircnet.net` 5059 个频道。未配置代理时三协议仍可运行，只是各自的 `errors[]` 会给出"不可达/超时"原因。

### 容器如何用上宿主代理

宿主代理通常只监听 `127.0.0.1`，容器访问不到。用内置的零依赖端口转发把它的入口开到 `0.0.0.0:10811`：

```sh
node app/im/proxy-relay.js                                 # 0.0.0.0:10811 -> 127.0.0.1:1081
IM_SOCKS_PROXY=socks5://host.docker.internal:10811 \
  docker compose -f app/docker-compose.yaml up -d           # 重建容器并注入代理
```

`docker-compose.yaml` 已把所有 IM 相关变量做成 `${VAR:-}` 透传，不设置即退回直连，不影响既有功能。想让中继开机常驻（launchd）：

```sh
cat > ~/Library/LaunchAgents/com.e2echat.imrelay.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.e2echat.imrelay</string>
  <key>ProgramArguments</key><array>
    <string>/usr/local/bin/node</string>
    <string>/Users/51pwn/MyWork/E2E_chat/app/im/proxy-relay.js</string>
  </array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/imrelay.log</string>
  <key>StandardErrorPath</key><string>/tmp/imrelay.err</string>
</dict></plist>
PLIST
launchctl load ~/Library/LaunchAgents/com.e2echat.imrelay.plist
```

### 故障隔离（刻意设计）

- 每个协议、每台 IRC 服务器独立 `try/catch` + 独立超时，某一路失败只写进自己的 `errors[]`，不影响其它协议；
- `/api/im/channels` 单协议硬上限 15s，`LIST` 9s，注册最多等 10s 即放行；
- IRC 列表有 60s 缓存 + 启动后 3s 起后台预热、每 5 分钟兜底刷新，页面请求命中缓存（实测 12–26ms）；
- `irc-client` 的 error 事件若无人监听只写日志，绝不因未捕获事件让进程退出；
- `server.js` / `desktop/server-core.js` 挂载 `/api/im` 均包在 `try/catch`，桥接失败不影响主站与 P2P；
- 实测：把代理指向死端口（`127.0.0.1:9`）后，`/api/im/channels` 43ms 返回 200（`channels: []` + 三协议错误），`/`、`/im.html`、`/js/sig-bridge.js` 全部 200，进程存活。

### 实现位置

```
app/im/config.js            三协议配置（全部走环境变量）
app/im/irc-client.js        纯 net/tls IRC 客户端（SASL PLAIN / 限速 / LIST 回落）
app/im/adapters/{irc,matrix,xmpp}.js   协议适配（列表 + 加入 + 收发）
app/im/hub.js               统一会话中心（sid、消息缓冲、空闲回收）
app/im/index.js             /api/im 路由
app/static/im.html          频道页
app/static/js/im-client.js  页面逻辑（同源 fetch，零依赖）
desktop/server-core.js      桌面端同样挂载 /api/im
app/im/README.md            详细接口 / 变量 / 联调说明
```

---

## 一、Docker 容器

### 镜像选型（坑）

| 镜像 | 结果 |
|------|------|
| `node:17.0.1-alpine3.14` | ❌ **必用** → `classic-level` musl 预编译库报 `_ZSt28__throw_bad_array_new_lengthv: symbol not found`（alpine 3.14 的 libstdc++ 太旧），异常被 `uncaughtException` 吞掉，进程僵死、不监听端口 |
| `node:20-alpine` | ✅ **稳定工作**，自带的 musl glibc 兼容 classic-level 当前预编译 |

另：classic-level 会预加载 `darwin-x64+arm64`、`linux-x64` 两套 `.node`（宿主机 macOS 和容器 Linux 各用各的，volume 挂载不会互相污染）。

### docker-compose.yaml 详解（文件：`app/docker-compose.yaml`）

```yaml
services:
  my-app:
    image: node:20-alpine
    container_name: e2e_chat                 # 固定名字便于 docker 命令定位
    restart: unless-stopped                  # 容器崩溃自动拉起，daemon 重启后不自动启动
    working_dir: /app                        # ⚠️ 必须，否则 run.sh 里 find . 会从 / 扫整个文件系统
    ports:
      - "2083:2083"
    volumes:
      - <PROJECT_ROOT>/app:/app              # 源码/运行时数据（dbChat、dbChatIp）
      - <PROJECT_ROOT>/ca:/ca                # Cloudflare Origin CA: fullchain.pem / privkey.pem
    command: /app/run.sh
```

关键配置项说明：

- **working_dir**：容器默认 `/`，`run.sh` 第一行 `find . -name ".DS_Store*" -delete` 会扫到 `/proc/*`、`/sys/*`。显式指定 `/app` 后所有路径相对 app 目录。
- **volumes 挂载 dbChat/dbChatIp**：LevelDB 运行时数据持久化在本机，容器重建不丢失。但 `.gitignore` 必须排除这两个目录，避免误提交（本机 `.gitignore` 已含 `app/dbChat/` 与 `app/dbChatIp/`）。
- **ca 目录**：`server.js` 读取 `../ca/privkey.pem`（相对 app 是 `../ca`），因此挂载点必须是 `/ca` 且宿主机相对路径 `../ca`。证书是 Cloudflare Origin CA（SAN: `*.51pwn.com, 51pwn.com`），不在系统信任链，cloudflared 入口需要 `noTLSVerify: true`。

### 生命周期命令

```sh
cd <PROJECT_ROOT>/app

# 启动/首次构建
docker compose up -d

# 重启（容器名固定后，两种命令都可用）
docker compose restart
docker restart e2e_chat

# 停止
docker compose stop
docker stop e2e_chat

# 删除容器（保留数据卷）
docker compose down
# 连同数据卷一起删（慎用）
docker compose down -v

# 看日志
docker logs -f e2e_chat
docker logs e2e_chat --tail 100

# 进容器排查
docker exec -it e2e_chat sh

# 验证本地 HTTPS 服务
curl -sk https://127.0.0.1:2083/
```

### 启动状态观察

容器启动后有个耗时几十秒的**同步阻塞阶段**——`myapp_51pwn.js` 里要遍历 static/js 下所有 JS 做缓存预读。期间：

- `docker ps` 显示 `Up` ✅
- `netstat -tln` 端口 2083 **尚未监听** ❌
- curl 直接报 `SSL_ERROR_SYSCALL` / `Connection reset` ❌
- 最后一条日志是 `init tfjs.js ...ms`

**正常标志**：日志出现 `start port 2083`，此时 2083 开始监听。

---

## 二、cloudflared Argo Tunnel

### 前置条件

1. 安装 cloudflared（macOS）：
   ```sh
   brew install cloudflared
   cloudflared --version   # 应有输出
   ```
2. Cloudflare 账号已登录过该机器（首次需执行）：
   ```sh
   cloudflared tunnel login
   # 浏览器打开选择 Zone（51pwn.com）后本机生成 cert.pem
   ls ~/.cloudflared/      # 应能看到 cert.pem
   ```

### 创建隧道（首次）

```sh
cloudflared tunnel create <TUNNEL_NAME>
# 输出形如：
# Created tunnel <TUNNEL_ID>
# Using tunnel credentials <HOME>/.cloudflared/<TUNNEL_ID>.json

cloudflared tunnel list   # 列出所有隧道及活跃连接
```

**安全原则**：隧道 JSON 凭证文件内容（含私钥）**绝对不能**贴到代码/文档里，保持在 `~/.cloudflared/` 并加入 `.gitignore`。

### config.yml 说明（`~/.cloudflared/config.yml`）

```yaml
tunnel: <TUNNEL_ID>                              # cloudflared tunnel create 输出的 416d... 格式
credentials-file: <HOME>/.cloudflared/<TUNNEL_ID>.json

ingress:
  # hostname 顺序从上到下匹配，最后一条兜底 404
  - hostname: chat.51pwn.com
    service: https://127.0.0.1:2083
    originRequest:
      noTLSVerify: true                          # Origin CA 不在系统信任链，必须加
  # 其他子域名继续追加
  # - hostname: xxx.51pwn.com
  #   service: http://127.0.0.1:3000
  - service: http_status:404                     # 兜底：所有未匹配子域名返回 404
```

⚠️ **不要**把自己真实的 TUNNEL_ID 或 credentials-file 路径提交到共享仓库；每个 clone 机器本地各自维护。

### DNS 路由（Cloudflare 后台与隧道的绑定）

```sh
# 把 chat.51pwn.com CNAME 指向隧道
cloudflared tunnel route dns <TUNNEL_ID> chat.51pwn.com

# 若 Cloudflare DNS 后台已有同名 A/CNAME 记录需要覆盖
cloudflared tunnel route dns --overwrite-dns <TUNNEL_ID> chat.51pwn.com

# 检查 DNS 记录
dig +short chat.51pwn.com CNAME
# 应有输出：<TUNNEL_ID>.cfargotunnel.com
```

### 启动隧道

```sh
# 前台启动（调试用，直接看日志）
cloudflared --config ~/.cloudflared/config.yml tunnel run

# 后台常驻（日常用）
nohup cloudflared --config ~/.cloudflared/config.yml tunnel run \
  > /tmp/cloudflared.log 2>&1 &

# ⚠️ 当前网络 QUIC/UDP 不稳定，强制走 http2（TCP）
nohup cloudflared --config ~/.cloudflared/config.yml tunnel --protocol http2 run \
  > /tmp/cloudflared.log 2>&1 &
```

**protocol 选择**：

| 协议 | 命令 | 适用场景 |
|------|------|----------|
| QUIC（默认） | `tunnel run` | 家庭宽带/UDP 通畅 → 延迟低、稳定 |
| http2（TCP） | `tunnel --protocol http2 run` | 公司网/VPN/运营商对 UDP 干扰大 → **推荐本项目用** |

### 隧道状态监控

```sh
cloudflared tunnel info <TUNNEL_ID>
# 输出中 CONNECTOR ID 行显示活跃连接数；CONNECTED 是运行时状态
# 没有任何活跃连接 = 隧道进程未运行或连不上 edge

tail -f /tmp/cloudflared.log                    # 实时日志
curl -sI https://chat.51pwn.com/                # 公网验证，应返回 200
```

正常日志关键行：

```
Registered tunnel connection connIndex=0 ... location=lax09 protocol=http2
# ↑ 注册成功，edge 节点已就绪
ERR ... no more connections active and exiting
# ↑ 隧道进程退出，需重启
ERR Unable to reach the origin service ... dial tcp 127.0.0.1:2083: connect: connection refused
# ↑ cloudflared 到源站失败 → 容器没起来/端口未监听
WRN Failed to dial a quic connection ... timeout: no recent network activity
# ↑ UDP 被干扰，改用 --protocol http2
```

---

## 三、自启动 / 崩溃自愈（三层保障）

### 第 1 层：Docker Desktop 开机自启（系统登录时）

Docker.app 已通过 macOS Login Items 加入登录自启。

```sh
# 手动查看/管理
osascript -e 'tell application "System Events" to get the name of every login item'
# 想移除 Docker：
osascript -e 'tell application "System Events" to delete login item "Docker"'
```

### 第 2 层：容器 `restart: unless-stopped`

`docker-compose.yaml` 里的 `restart: unless-stopped` 保证：
- 容器崩了 → Docker daemon 自动拉起
- Docker Desktop 重启后 → 容器自动恢复
- `docker stop e2e_chat` 手动停的 → **不会**被自动拉起（`unless-stopped` 语义）

### 第 3 层：cloudflared 通过 launchd 常驻

已创建 LaunchAgent：`~/Library/LaunchAgents/com.user.cloudflared.tunnel.plist`

内容要点（绝对路径、协议 http2、KeepAlive 无限重试）：

```xml
<key>Label</key><string>com.user.cloudflared.tunnel</string>
<key>ProgramArguments</key>
<array>
  <string>/usr/local/bin/cloudflared</string>
  <string>--config</string><string><HOME>/.cloudflared/config.yml</string>
  <string>tunnel</string><string>--protocol</string><string>http2</string><string>run</string>
</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key>
<dict><key>SuccessfulExit</key><false/></dict>
```

**启用/禁用**（需要自己在系统终端里执行，IDE 沙箱权限不足）：

```sh
# 启用（开机自启 + 当前立即启动）
launchctl load -w ~/Library/LaunchAgents/com.user.cloudflared.tunnel.plist

# 禁用
launchctl unload ~/Library/LaunchAgents/com.user.cloudflared.tunnel.plist

# 查看状态
launchctl list | grep cloudflared
ps aux | grep "cloudflared.*tunnel.*run" | grep -v grep
```

**注意**：
- 登录项 Docker Desktop 自启 + 容器 `unless-stopped` = **容器自动恢复** ✅
- launchd RunAtLoad = **cloudflared 自动恢复** ✅
- 任何一层挂了，`sh startServer.sh` 都能一键补位

### 崩溃自愈验证清单

```sh
# 容器挂了
docker kill e2e_chat; sleep 3; docker ps --filter name=e2e_chat   # 应自动复活
curl -sk -o /dev/null -w "%{http_code}\n" --max-time 5 https://127.0.0.1:2083/

# cloudflared 挂了
pkill -f "cloudflared.*tunnel.*run"; sleep 6
curl -sk -o /dev/null -w "%{http_code}\n" --max-time 15 https://chat.51pwn.com/   # 应自动恢复
```

---

## 四、故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| 容器反复重启（exit 1），日志无 `start port 2083` | classic-level 符号缺失 / 其他未捕获异常 | 换 `node:20-alpine` 镜像；`docker logs e2e_chat` 定位具体异常 |
| curl 本地 2083 连接被 reset | 容器尚未启动完成（正在合并静态资源） | 等日志出现 `start port 2083` |
| cloudflared 日志 `dial tcp 127.0.0.1:2083 refused` | 容器挂了 / 还没 listen | `docker start e2e_chat` 或重启 |
| 公网 530 / error code 1033 | Cloudflare edge 找不到活动隧道连接 | `cloudflared tunnel info` 检查活跃连接；重启隧道 |
| 公网 502 | cloudflared 连得上 edge 但源站 127.0.0.1:2083 拒绝 | 同本地 2083 refused |
| QUIC 日志反复断 | 本机/路由器 UDP 被干扰 | 加 `--protocol http2` |
| 本地 curl 报 SSL issuer 校验失败 | 证书是 Cloudflare Origin CA | 加 `-k`，cloudflared ingress 加 `noTLSVerify: true` |
| `cloudflared tunnel route dns` 报已有记录 | Cloudflare 后台有 A 记录占位 | 加 `--overwrite-dns` 覆盖 |

---

## 访问入口

| 类型 | URL |
|------|-----|
| 公网（推荐） | https://chat.51pwn.com/ |
| 公网带参数 | https://chat.51pwn.com/?eAi=true&cnId=51pwn&startChat=1 |
| 本地直连（证书校验需 -k） | https://127.0.0.1:2083/ |

# 下一个版本
0、增加对 RTSP 视频流的支持（ rtsp://admin:MJAmg%40028@192.168.0.124/live/main ）
web -> send rtsp -> server start ffmpeg -> socket -> web 创建UI

1、根据 p2p类型设置视频清晰度【已经优化，但是目前测试相应的代码没有运行】
webrtc RTCPeerConnection传输视频时，
1)、都在一个内网就高清；
2)、NAT成功，p2p也高清；
3)、nat失败，基于中继服务器转发，就用低清晰度
动态改变视频流的清晰度

2、zip、tfjs 在web worker中运行

3、vip 存储 到网络存储中

4、语言图片只有可见时才加载--懒惰加载（observer.observe(img);）【已经优化】

5、存储的视频解码base64后存储，确保使用更少的空间【已经优化】

6、性能、综合、评估测试【已经优化】
https://www.ssllabs.com/ssltest/analyze.html?viaform=on&d=chat.51pwn.com
https://www.webpagetest.org/result/240510_AiDcFM_BQF/
https://pagespeed.web.dev/analysis/https-chat-51pwn-com/salr21qnwz?form_factor=mobile
sslscan chat.51pwn.com:2083
sslyze --regular chat.51pwn.com:2083

ab -c 100 -n 5000 https://chat.51pwn.com:2083
wrk -t8 -c200 -d30s --latency  "https://chat.51pwn.com:2083"


# E2E-Chat
端对端（E2E）、点对点(P2P)加密聊天系统
不受任何国家、政府、组织、机构监管，安全可靠、隐秘

https://127.0.0.1:2083/?eAi=true&cnId=51pwn&startChat=1

# chrome crash
```
chrome://crashes/

open ~/Library/Application\ Support/Google/Chrome/Crashpad/completed/

```

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


/**
https://webtorrent.io/intro

在 node_modules/engine.io/build/transports/polling.js 文件中，将 OutgoingMessage.prototype._headers 替换为 OutgoingMessage.headers。
 */
# 优化js
在线生成脚本的 integrity
https://www.srihash.org

```
rm -rf app/static/js/tfjs.js
wget -c -O app/static/js/tfjs.js 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js'

/usr/local/Cellar/openjdk@11/11.0.16.1/libexec/openjdk.jdk/Contents/Home/bin/java  -jar $HOME/MyWork/E2E_chat/tools/closure-compiler-v20230502.jar --js adapter-latest.js --js_output_file adapter-min.js


xxf=static/js/sw.js;uglifyjs $xxf -c -m -o $xxf

```

# more
```
 优化png
 brew install optipng jpegoptim
 optipng $HOME/MyWork/E2E_chat/app/static/css/b.png

png 转 svg 体积大幅减小
 https://convertio.co/download/0fdcfc32fe46d0833316de0767842e7f0ec93c/

convert ./me.png EXAMPLE.svg
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

rm -rf static/js.js;rm -rf static/v8.js;node server.js
find . -name ".DS_Store" -delete

export rip=`host 51pwn.com|grep -Eo '(([0-9]{1,3}\.){3}[0-9]{1,3})'`
export rport=26188

reset;ssh -i ~/.ssh/id_rsa -C -p ${rport} root@${rip}
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

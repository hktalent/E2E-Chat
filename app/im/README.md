# 多协议 IM 桥接（IRC / Matrix / XMPP）

给 E2E Chat 增加「浏览公共频道 → 加入 → 聊天」能力，协议由频道地址自动匹配。
**所有新代码都在 `app/im/` 与 `/api/im/*`、`/im.html` 下，不改动原有 P2P / sig-bridge 逻辑，也不影响 chat.51pwn.com 的既有功能。**

## 目录结构

```
app/im/
  config.js            配置（全部可用环境变量覆盖，仓库内不含凭据）
  irc-client.js        极简 IRC 客户端（TLS、SASL PLAIN、LIST/JOIN/PRIVMSG/NAMES）
  adapters/irc.js      IRC 适配器（多服务器连接池，按频道 fan-out）
  adapters/matrix.js   Matrix Client-Server API 适配器
  adapters/xmpp.js     XMPP MUC 适配器（@xmpp/client）
  hub.js               统一会话中心（频道 ID → 会话 → 消息缓冲）
  index.js             /api/im/* 路由
app/static/im.html     频道页
app/static/js/im-client.js
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/im/protocols` | 三协议能力与连接状态 |
| GET | `/api/im/channels?protocol=all&q=&limit=` | 跨协议聚合频道列表（含人数、话题、服务器） |
| POST | `/api/im/join` | `{channelId}` → `{sid}`，协议由 `irc://` `matrix://` `xmpp://` 自动匹配 |
| GET | `/api/im/messages?sid=&cursor=` | 轮询消息（cursor 递增） |
| POST | `/api/im/send` | `{sid,text}` |
| POST | `/api/im/leave` | `{sid}` |

频道 ID 采用 URI 形式，可直接分享：

```
irc://irc.libera.chat/%23python
matrix://matrix.org/%21abc%3Amatrix.org
xmpp://conference.xmpp.jp/room%40conference.xmpp.jp
```

## 配置（环境变量）

| 变量 | 说明 |
| --- | --- |
| `IM_IRC_SERVERS_JSON` | 覆盖 IRC 服务器数组，元素 `{host,port,tls,label,sasl:{user,pass}}` |
| `IM_IRC_NICK` / `IM_IRC_PASS` | IRC SASL PLAIN 账号（Libera 等要求 SASL 的网络必须配） |
| `IM_IRC_LOCAL` | `host:port`，指向自建 ircd（明文），设置后只连它 |
| `IM_IRC_DISABLE` | `1` 关闭 IRC |
| `IM_MATRIX_HS` | homeserver，默认 `https://matrix.org` |
| `IM_MATRIX_TOKEN` / `IM_MATRIX_USER` | Matrix access token；不配则只能浏览公共房间 |
| `IM_XMPP_JID` / `IM_XMPP_PASS` | XMPP 账号（列 MUC 与发言必须有） |
| `IM_XMPP_MUC` | MUC 服务域，默认 `conference.xmpp.jp` |
| `IM_XMPP_SERVICE` | 连接串，默认 `xmpp://xmpp.jp:5222` |

## 已知的网络前提

- IRC：TCP/TLS 出网。Libera 对部分网络要求 SASL，未配账号时会返回明确错误。
- Matrix：HTTPS 到 homeserver。matrix.org 在部分网络不可达，换可达的 homeserver 即可。
- XMPP：TCP 5222 或 websocket。

## 本地联调（真实 ircd，非 mock）

```bash
# 1) 启动测试 ircd（ircdkit 实现，端口 6667，内置 #test/#random/#help）
node app/im/ircd-test.js

# 2) 启动带桥接的应用
cd app && PORT=2085 IM_IRC_LOCAL=127.0.0.1:6667 node server.js

# 3) 验证
curl -sk "https://127.0.0.1:2085/api/im/channels?protocol=irc"
open   https://127.0.0.1:2085/im.html
```

## 出网代理（netproxy.js）与故障隔离

- `netproxy.js`：零依赖 SOCKS5 / SOCKS5h / HTTP CONNECT 隧道；`requestJson()` 无代理时用全局 fetch，有代理时用 `https.request` + 自建 agent（隧道 + TLS）。
- 环境变量：`IM_SOCKS_PROXY` / `IM_HTTP_PROXY` / `IM_PROXY_FALLBACK=1`（回落 `ALL_PROXY`、`HTTPS_PROXY`）。
- 容器访问宿主代理：`node im/proxy-relay.js`（默认 `0.0.0.0:10811 -> 127.0.0.1:1081`），然后 `IM_SOCKS_PROXY=socks5://host.docker.internal:10811` 重建容器。
- 隔离约定：每个协议、每台 IRC 服务器独立 try/catch + 超时；单协议列表硬上限 15s；`irc-client` 的 error 事件无人监听时只写日志，不会走未捕获路径（进程不会因某个网络异常退出）。
- 缓存：IRC 列表 60s 缓存 + 启动 3s 后后台预热 + 每 5 分钟兜底刷新；冷启动 6–13s，命中缓存 12–26ms。

## 频道列表 7 天持久缓存

- `cache.js`：`<repo>/app/im/.cache/<key>.json`，原子写（tmp+rename），读取时超过 `IM_CACHE_TTL_DAYS`（默认 7）即作废。
- 策略是「缓存优先 + 后台刷新」：有快照立即返回（`stale:true` / `asOf`），`setImmediate` 里静默刷新；网络失败回退快照并给 soft 提示；无快照才阻塞拉取。
- key：`irc_<host>`、`matrix_<homeserver>`、`xmpp_<muc>`。
- 目录已在根 `.gitignore`（`app/im/.cache/`），不进仓库。

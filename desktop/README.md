# E2E Chat Desktop（Windows / macOS / Linux）

把 `chat.51pwn.com` 的同一套前端代码装进 Electron 壳里，实现**不依赖任何服务器**的端到端加密聊天。
桌面端启动时在 `127.0.0.1` 上跑一个内嵌服务（`https` + 自签证书），页面加载的是**和网页版完全相同的 `app/static`**，
两者共用同一份源码，网页版行为零变化。

## 两种信令模式

| 模式 | 启动参数 | 说明 |
| --- | --- | --- |
| **manual（默认，真·无服务器）** | `sig=manual` | 不走任何 socket/服务器。双方通过**邀请码 / 回应码**手工交换 SDP + ICE，随后全程 WebRTC 直连（DataChannel）。 |
| local（局域网/单机可选） | `sig=local` | 使用内嵌实例自带的 `socket.io /pChat` 做信令，仅在 127.0.0.1 内，等价于网页版的房间发现。 |

手工模式的完整流程：

1. 双方各自填入**相同频道名**（频道名同时是消息加密口令）。
2. A 点「① 生成邀请码」→ 得到一段 `E2EC1:...` 码（约 13KB，含 SDP + ICE）。
3. A 把码发给 B；B 粘贴后点「② 粘贴并连接」→ 得到**回应码**。
4. B 把回应码回传 A；A 粘贴后点「②」→ 面板显示「已直连」，即可收发文字/文件。

### 二维码 / 扫码

- 生成码后面板下方自动出现**二维码**，点一下可全屏放大，方便用手机或另一台设备扫。
- 「③ 扫码」调用摄像头，用内置 `jsQR` **本地解码**，扫到即自动填入并开始连接（不联网、不上传）。
- 二维码由内置 `qrcode` 本地生成（`app/static/js/qrcode.min.js`），只在桌面端用到时才按需加载，网页版不下载。

### 有效期倒计时

- 每个码默认 **180 秒**有效（调试可加 `?ttl=30`）。
- 剩余时间显示在面板标题右侧；**剩 30 秒内变橙色并闪烁**，归零后提示「码已过期 · 请重新生成」。
- 过期只是提示：只要对方在有效期内生成了对应码，仍可粘贴完成连接。

### 码体积

| 版本 | 邀请码长度 | 说明 |
| --- | --- | --- |
| 早期明文版 | ~13.7KB | SDP 含 audio/video 三段 + 全部 ICE 候选 |
| 当前版本 | **~2.9KB** | 只协商数据通道 + ICE 候选去重限流 + `deflate-raw` 压缩（`E2EC2:` 前缀，旧 `E2EC1` 码仍可解析） |

面板里的 `sig / ice / conn / local / remote / iceN / ch` 是诊断行，用来判断卡在哪一步。（另含 `ph / ttl` 两项：状态机与剩余秒数）

## 开发 / 本地运行

```bash
cd desktop
npm install
npm start            # Electron 窗口（manual 模式）
npm run start:local  # Electron 窗口（内嵌信令模式）

node dev-server.js   # 不启 Electron，仅用浏览器验证内嵌服务（默认 20831）
# 打开 https://127.0.0.1:20831/?d=1&sig=manual ，自签证书需点“继续前往”
```

运行时数据（`dbChat`、`resImg`、合并缓存 `static/js/,.js`）写在系统 userData 目录，安装包内资源只读。

自签 https 证书也不再随仓库分发：首次运行时由 `server-core.js` 用纯 JS（`selfsigned`）在用户数据目录 `ca/` 下自动生成 `local.key` / `local.cert`（SAN: 127.0.0.1 / ::1 / localhost），私钥只留在本机。

## 打包

```bash
npm run dist:mac      # dmg + zip（x64 / arm64）
npm run dist:win      # nsis + portable（x64）
npm run dist:linux    # AppImage + deb（x64）
```

推送 tag 会自动三平台打包并发布 Release：

```bash
git tag v1.0.0 && git push origin v1.0.0
```

流水线：`.github/workflows/build-desktop.yml`（matrix：macos-14 / windows-latest / ubuntu-latest）。

安装包**未签名**：macOS 首次打开需右键 →「打开」；Windows 需在 SmartScreen 中选「仍要运行」。

## 与网页版的关系（重要）

- 未改动 `app/server.js`、`app/myapp_51pwn.js`、`app/p2pchat.js` 的任何逻辑。
- 对客户端只做了两处**带守卫**的增量改动，网页版走原路径：
  - `app/static/js/p2pchat.js`：`socket = window.__E2E_SIG__ ? (window.__E2E_SIG__() || io("/pChat")) : io("/pChat")`；
    尾部导出 `window.__E2E_INTERNALS__` 供桥接读取内部状态。
  - `app/static/index.html`：多引入一个 `sig-bridge.js`，该脚本在非 `?d=1` 页面直接 return。
- 因此 `chat.51pwn.com` 仍然以原来的 socket.io + 服务器兜底中继方式运行。

## 已知限制

- 手工码模式需要**带外传递**两段码（这正是“无服务器”的代价：WebRTC 必须有 SDP/ICE 交换）。
- 对称 NAT（约 15–30% 场景）无法打洞，需 TURN 中继；桌面版默认复用 `stunLists.js` 里的 ICE 列表。
- mesh 房间上限约 8 人；数据通道建在 `connected` 之后（沿用原客户端逻辑）。
- `desktop/ca/` 里的自签证书只用于 `127.0.0.1`，不入系统信任库，随包分发。

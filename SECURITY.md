# 安全说明（Security Policy）

本项目提供端到端加密的点对点聊天，仓库本身**不包含任何私钥、证书或第三方凭据**。

## 仓库中不会出现的东西

| 类型 | 处理方式 |
| --- | --- |
| TLS / 自签证书私钥 | 不入库。桌面端首次运行在用户数据目录自动生成（`selfsigned`），服务端部署请自备证书并放在 `ca/`（已被 `.gitignore` 忽略） |
| TURN 凭据 | 不入库。`app/static/js/stunLists.js` 仅保留公开 STUN 与占位模板，私有 TURN 请部署时注入 |
| 聊天数据 / 上传图片 | 不入库（`app/dbChat/`、`app/resImg/` 已忽略） |
| 模型权重与安装包 | 不入库（`app/static/model*`、`*.zip`、`desktop/release/`） |

## 报告问题

如发现疑似泄露，请开 issue 或私下联系维护者，不要在公开 issue 中粘贴真实凭据。

## 使用提醒

- 本项目含自建部署脚本（Docker + Cloudflare Tunnel），部署时所需的隧道凭证放在 `$HOME/.cloudflared/`，**不要提交**。
- 手工 P2P 模式依赖 STUN 打洞，对称 NAT 下可能失败；如需中继请自建 TURN 并通过部署侧配置。

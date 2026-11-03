#!/bin/sh
# E2E_chat 一键启动脚本
# 功能：启动 Docker 容器（Node.js HTTPS 服务 :2083）+ 检查并启动 cloudflared 隧道（chat.51pwn.com）
# 用法：./startServer.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$PROJECT_ROOT/app"
CONTAINER_NAME="e2e_chat"
LOCAL_URL="https://127.0.0.1:2083"
PUBLIC_URL="https://chat.51pwn.com"
DOMAIN="chat.51pwn.com"
CF_CONFIG="$HOME/.cloudflared/config.yml"
TUNNEL_ID="416d8666-6b3c-4232-8fde-a3995eabfa40"
CF_LOG="/tmp/cloudflared_chat.log"

echo "========== 1/5 检查 Docker =========="
if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] 未安装 docker，请先安装 Docker Desktop"; exit 1
fi
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker daemon 未运行，请先启动 Docker Desktop"; exit 1
fi
echo "[OK] docker 可用"

echo "========== 2/5 启动应用容器 =========="
cd "$APP_DIR"
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[OK] 容器 $CONTAINER_NAME 已在运行"
else
    # 确保基础镜像存在（node:20-alpine，本地无则拉取）
    docker compose up -d
    echo "[OK] 容器 $CONTAINER_NAME 已启动"
fi

echo "========== 3/5 等待本地 HTTPS 服务就绪 =========="
n=0
while [ $n -lt 30 ]; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 5 "$LOCAL_URL/" 2>/dev/null || true)
    if [ "$code" = "200" ]; then
        echo "[OK] $LOCAL_URL 返回 200"
        break
    fi
    n=$((n+1)); sleep 2
done
if [ "$code" != "200" ]; then
    echo "[ERROR] 本地服务未就绪，查看日志: docker logs $CONTAINER_NAME"; exit 1
fi

echo "========== 4/5 检查 cloudflared 配置 =========="
if ! command -v cloudflared >/dev/null 2>&1; then
    echo "[ERROR] 未安装 cloudflared，请执行: brew install cloudflared"; exit 1
fi
# 检查隧道凭证与配置
if [ ! -f "$CF_CONFIG" ]; then
    echo "[ERROR] 缺少 $CF_CONFIG"; exit 1
fi
if [ ! -f "$HOME/.cloudflared/${TUNNEL_ID}.json" ]; then
    echo "[ERROR] 缺少隧道凭证 $HOME/.cloudflared/${TUNNEL_ID}.json，请执行: cloudflared tunnel login && cloudflared tunnel create <name>"; exit 1
fi
# 检查 ingress 是否包含目标域名，没有则自动修复
if ! grep -q "$DOMAIN" "$CF_CONFIG"; then
    echo "[FIX] $CF_CONFIG 缺少 $DOMAIN ingress，自动追加"
    /usr/bin/sed -i '' "s|^\( *- service: http_status:404\)|  - hostname: $DOMAIN\n    service: $LOCAL_URL\n    originRequest:\n      noTLSVerify: true\n\1|" "$CF_CONFIG"
fi
# 检查 DNS 路由（CNAME 应指向 <tunnel-id>.cfargotunnel.com）
if ! dig +short CNAME "$DOMAIN" 2>/dev/null | grep -q "cfargotunnel.com"; then
    echo "[FIX] $DOMAIN 未指向隧道，自动创建/覆盖 DNS 路由"
    cloudflared tunnel route dns --overwrite-dns "$TUNNEL_ID" "$DOMAIN"
fi
echo "[OK] cloudflared 配置检查完成"

echo "========== 5/5 启动隧道并验证 =========="
if pgrep -f "cloudflared.*tunnel.*run" >/dev/null 2>&1; then
    echo "[OK] cloudflared tunnel 已在运行"
else
    # 当前网络环境下 QUIC(UDP) 不稳定，强制使用 http2 协议
    nohup cloudflared --config "$CF_CONFIG" tunnel --protocol http2 run > "$CF_LOG" 2>&1 &
    echo "[OK] cloudflared tunnel 已启动 (pid $!)，日志: $CF_LOG"
    sleep 8
fi

# 等待隧道连接注册
n=0
while [ $n -lt 15 ]; do
    if cloudflared tunnel info "$TUNNEL_ID" 2>/dev/null | grep -q "cfargotunnel\|EDGE\|xl"; then
        break
    fi
    n=$((n+1)); sleep 2
done

code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 25 "$PUBLIC_URL/" 2>/dev/null || true)
if [ "$code" = "200" ]; then
    echo "[OK] $PUBLIC_URL 返回 200，服务发布成功"
else
    echo "[WARN] $PUBLIC_URL 返回 $code，请查看隧道日志: tail -f $CF_LOG"; exit 1
fi

echo ""
echo "全部完成："
echo "  本地:   $LOCAL_URL"
echo "  公网:   $PUBLIC_URL"
echo "  容器日志: docker logs -f $CONTAINER_NAME"
echo "  隧道日志: tail -f $CF_LOG"

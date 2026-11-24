/**
 * Matrix 适配器：走 Client-Server API。
 * - 公共房间列表（含人数）无需登录
 * - 加入房间 / 发消息 / 拉历史需要 access token（环境变量 IM_MATRIX_TOKEN）
 */
const cfg = require('../config');
const netproxy = require('../netproxy');
const cache = require('../cache');

let statusCache = { ts: 0, value: null };
let roomsCache = { ts: 0, value: null };

const HS = () => cfg.matrix.homeserver.replace(/\/+$/, '');
const TOKEN = () => cfg.matrix.accessToken;

async function api(path, { method = 'GET', body, token, timeout = 12000 } = {}) {
  // 统一出网层：直连或经系统 SOCKS/HTTP 代理（见 im/netproxy.js）
  return netproxy.requestJson(HS() + path, { method, body, token, timeout });
}

async function probe() {
  if (statusCache.value && Date.now() - statusCache.ts < 60 * 1000) return statusCache.value;
  let value;
  try {
    await api("/_matrix/client/versions", { timeout: 3000 });
    value = { reachable: true, error: null };
  } catch (e) {
    value = { reachable: false, error: e.message };
  }
  statusCache = { ts: Date.now(), value };
  return value;
}

async function refreshRooms() {
  const data = await api('/_matrix/client/v3/publicRooms?limit=200');
  const items = (data.chunk || [])
    .filter((r) => r && r.room_id)
    .map((r) => ({
      id: `matrix://${cfg.matrix.homeserver.replace(/^https?:\/\//, '')}/` + encodeURIComponent(r.room_id),
      protocol: 'matrix',
      protocolLabel: 'Matrix',
      server: cfg.matrix.homeserver.replace(/^https?:\/\//, ''),
      name: r.canonical_alias || r.name || r.room_id,
      roomId: r.room_id,
      members: r.num_joined_members || 0,
      topic: (r.topic || '').slice(0, 140),
      joinRule: r.join_rule || ''
    }));
  roomsCache = { ts: Date.now(), value: items };
  cache.save('matrix_' + cfg.matrix.homeserver.replace(/^https?:\/\//, ''), items);
  return items;
}

async function listChannels({ q = '', limit = 200 } = {}) {
  if (roomsCache.value && Date.now() - roomsCache.ts < cfg.listCacheMs) return filter(roomsCache.value, q, limit);

  // 有 7 天快照：先返回缓存（stale），后台静默刷新
  const snapNow = cache.load('matrix_' + cfg.matrix.homeserver.replace(/^https?:\/\//, ''));
  if (snapNow) {
    setImmediate(() => { refreshRooms().then(() => probe().catch(() => {})).catch(() => {}); });
    const r = filter(cache.markStale(snapNow.items, snapNow.ts), q, limit);
    r.errors = [{ server: cfg.matrix.homeserver, soft: true, error: '后台刷新中，当前为本地缓存（' + Math.round(snapNow.ageMs / 3600000) + ' 小时前，最长 7 天）' }];
    return r;
  }

  const p = await probe();
  if (!p.reachable) return fallback(q, limit, p.error);
  try {
    const items = await refreshRooms();
    return filter(items, q, limit);
  } catch (e) {
    return fallback(q, limit, e.message);
  }
}

/** 网络不可达时用 7 天内快照兜底 */
function fallback(q, limit, errMsg) {
  const snap = cache.load('matrix_' + cfg.matrix.homeserver.replace(/^https?:\/\//, ''));
  if (!snap) return { channels: [], errors: [{ server: cfg.matrix.homeserver, error: errMsg }], total: 0 };
  const r = filter(cache.markStale(snap.items, snap.ts), q, limit);
  r.errors = [{
    server: cfg.matrix.homeserver,
    soft: true,
    error: '网络异常，展示本地缓存（' + Math.round(snap.ageMs / 3600000) + ' 小时前，最长 7 天）：' + errMsg
  }];
  return r;
}

function filter(items, q, limit) {
  let res = items;
  if (q) {
    const lq = q.toLowerCase();
    res = res.filter((c) => (c.name || '').toLowerCase().includes(lq) || (c.topic || '').toLowerCase().includes(lq));
  }
  res = res.slice().sort((a, b) => b.members - a.members);
  return { channels: res.slice(0, limit), errors: [], total: res.length };
}

function parseChannelId(channelId) {
  const m = /^matrix:\/\/([^/]+)\/(.+)$/.exec(channelId);
  if (!m) throw new Error('bad matrix channel id');
  return { host: m[1], roomIdOrAlias: decodeURIComponent(m[2]) };
}

async function join(channelId, onMessage) {
  const { roomIdOrAlias } = parseChannelId(channelId);
  const token = TOKEN();
  if (!token) {
    const err = new Error('Matrix 需要账号：请配置 IM_MATRIX_TOKEN 后才能加入/发言');
    err.code = 'NEED_CREDENTIALS';
    throw err;
  }
  const joined = await api(`/_matrix/client/v3/join/${encodeURIComponent(roomIdOrAlias)}`, { method: 'POST', body: {}, token });
  const roomId = joined.room_id || roomIdOrAlias;

  let since = null;
  const timer = setInterval(async () => {
    try {
      const sync = await api(
        `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=8${since ? '&from=' + encodeURIComponent(since) : ''}`,
        { token, timeout: 8000 }
      );
      const events = (sync.chunk || []).reverse();
      for (const ev of events) {
        if (ev.type !== 'm.room.message' || !ev.event_id) continue;
        if (since && ev.event_id === since) continue;
        if (ev.sender === cfg.matrix.userId) continue;
        onMessage({
          channel: roomId,
          from: ev.sender || 'unknown',
          text: (ev.content && (ev.content.body || '')) || '',
          ts: ev.origin_server_ts || Date.now()
        });
      }
      if (sync.end) since = sync.end;
    } catch (_) {}
  }, 5000);
  timer.unref && timer.unref();

  return {
    protocol: 'matrix',
    server: cfg.matrix.homeserver,
    name: roomId,
    send: async (text) => {
      const txn = 'e2e' + Date.now() + Math.floor(Math.random() * 999);
      await api(`/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
        method: 'PUT',
        body: { msgtype: 'm.text', body: text },
        token
      });
    },
    leave: async () => {
      clearInterval(timer);
      try { await api(`/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST', body: {}, token }); } catch (_) {}
    }
  };
}

function status() {
  const connected = !!(statusCache.value && statusCache.value.reachable);
  return {
    id: 'matrix',
    label: 'Matrix',
    enabled: cfg.matrix.enabled,
    ok: cfg.matrix.enabled,
    connected,
    hasCredentials: !!TOKEN(),
    note: TOKEN()
      ? '已配置账号，可加入并发言'
      : (connected ? '可浏览公共房间；加入/发言需配置 IM_MATRIX_TOKEN' : '服务端不可达：' + (statusCache.value && statusCache.value.error || '')),
    server: cfg.matrix.homeserver
  };
}

module.exports = { id: 'matrix', label: 'Matrix', status, listChannels, join, parseChannelId, probe };

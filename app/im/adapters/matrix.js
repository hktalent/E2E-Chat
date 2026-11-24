/**
 * Matrix 适配器：走 Client-Server API。
 * - 公共房间列表（含人数）无需登录
 * - 加入房间 / 发消息 / 拉历史需要 access token（环境变量 IM_MATRIX_TOKEN）
 */
const cfg = require('../config');

let statusCache = { ts: 0, value: null };
let roomsCache = { ts: 0, value: null };

const HS = () => cfg.matrix.homeserver.replace(/\/+$/, '');
const TOKEN = () => cfg.matrix.accessToken;

async function api(path, { method = 'GET', body, token, timeout = 12000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(HS() + path, {
      method,
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        token ? { Authorization: 'Bearer ' + token } : {}
      ),
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
    const text = await r.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) {}
    if (!r.ok) {
      const err = new Error(`Matrix ${r.status}: ${(json && (json.error || json.errcode)) || text.slice(0, 120)}`);
      err.status = r.status;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
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

async function listChannels({ q = '', limit = 200 } = {}) {
  const p = await probe();
  if (!p.reachable) return { channels: [], errors: [{ server: cfg.matrix.homeserver, error: p.error }], total: 0 };
  if (roomsCache.value && Date.now() - roomsCache.ts < cfg.listCacheMs) return filter(roomsCache.value, q, limit);
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
  return filter(items, q, limit);
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

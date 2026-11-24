/**
 * IRC 适配器：匿名连接公共网络，列出频道（含人数）、加入频道、收发消息。
 * 多网页会话共享同一条到某台服务器的连接，按频道 fan-out。
 */
const IrcClient = require('../irc-client');
const cfg = require('../config');

/** host -> {client, refs:Map(channel->Set(session)), topics:Map} */
const pool = new Map();
const lastList = new Map(); // host -> {ts, items}

function connFor(server) {
  const key = server.host;
  let ent = pool.get(key);
  if (ent && ent.client && ent.client.ready && ent.client.sock && !ent.client.sock.destroyed) return ent;
  ent = {
    client: new IrcClient({
      host: server.host,
      port: server.port,
      tls: server.tls !== false,
      nick: (cfg.irc && cfg.irc.nick) || undefined,
      sasl: server.sasl || null
    }),
    refs: new Map(),
    topics: new Map()
  };
  ent.client.on('error', (e) => console.warn('[im:irc]', server.host, e && e.message));
  ent.client.on('message', (m) => {
    const subs = ent.refs.get(m.channel);
    if (!subs) return;
    for (const fn of subs) { try { fn(m); } catch (_) {} }
  });
  pool.set(key, ent);
  return ent;
}

async function connect(server) {
  const ent = connFor(server);
  if (ent.client.ready) return ent;
  try {
    await ent.client.connect(8000);
  } catch (e) {
    pool.delete(server.host);
    throw e;
  }
  return ent;
}

let warming = false;
async function warmup() {
  if (warming) return;
  warming = true;
  try {
    for (const server of cfg.irc.servers || []) {
      const cached = lastList.get(server.host);
      if (cached && Date.now() - cached.ts < cfg.listCacheMs) continue;
      try {
        const ent = await connect(server);
        const items = await Promise.race([
          ent.client.list(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('LIST 超时')), 9000))
        ]);
        const mapped = items.filter((it) => it && it.name && it.name[0] === '#').map((it) => ({
          id: `irc://${server.host}/` + encodeURIComponent(it.name),
          protocol: 'irc',
          protocolLabel: server.label || server.host,
          server: server.host,
          name: it.name,
          members: it.members,
          topic: (it.topic || '').slice(0, 140)
        }));
        lastList.set(server.host, { ts: Date.now(), items: mapped });
      } catch (e) { /* 预热失败不影响请求 */ }
    }
  } finally { warming = false; }
}
// 模块加载 3 秒后开始预热，之后每 5 分钟兜底刷新一次
setTimeout(() => { warmup().catch(() => {}); }, 3000).unref?.();
setInterval(() => { warmup().catch(() => {}); }, 5 * 60 * 1000).unref?.();

async function listChannels({ q = '', limit = 300 } = {}) {
  const servers = cfg.irc.servers || [];
  const results = await Promise.all(servers.map(async (server) => {
    const cached = lastList.get(server.host);
    if (cached && Date.now() - cached.ts < cfg.listCacheMs) {
      return { items: cached.items, error: null };
    }
    try {
      const ent = await connect(server);
      const items = await Promise.race([
        ent.client.list(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('LIST 超时')), 9000))
      ]);
      const mapped = items
        .filter((it) => it && it.name && it.name[0] === '#')
        .map((it) => ({
          id: `irc://${server.host}/` + encodeURIComponent(it.name),
          protocol: 'irc',
          protocolLabel: server.label || server.host,
          server: server.host,
          name: it.name,
          members: it.members,
          topic: (it.topic || '').slice(0, 140)
        }));
      lastList.set(server.host, { ts: Date.now(), items: mapped });
      return { items: mapped, error: null };
    } catch (e) {
      return { items: [], error: { server: server.host, error: e.message } };
    }
  }));

  let out = [];
  const errors = [];
  for (const r of results) {
    out.push(...r.items);
    if (r.error) errors.push(r.error);
  }
  if (q) {
    const lq = q.toLowerCase();
    out = out.filter((c) => c.name.toLowerCase().includes(lq) || (c.topic || '').toLowerCase().includes(lq));
  }
  out.sort((a, b) => b.members - a.members);
  return { channels: out.slice(0, limit), errors, total: out.length };
}

function parseChannelId(channelId) {
  // irc://host/#channel
  const m = /^irc:\/\/([^/]+)\/(.+)$/.exec(channelId);
  if (!m) throw new Error('bad irc channel id');
  return { host: m[1], channel: decodeURIComponent(m[2]) };
}

async function join(channelId, onMessage) {
  const { host, channel } = parseChannelId(channelId);
  const server = (cfg.irc.servers || []).find((s) => s.host === host);
  if (!server) throw new Error('未配置的 IRC 服务器: ' + host);
  const ent = await connect(server);
  if (!ent.refs.has(channel)) {
    ent.refs.set(channel, new Set());
    ent.client.join(channel);
    // 记录频道人数，便于列表显示当前已加入状态
    ent.topics.set(channel, true);
  }
  ent.refs.get(channel).add(onMessage);

  return {
    protocol: 'irc',
    server: host,
    name: channel,
    send: (text) => ent.client.say(channel, text),
    leave: () => {
      const set = ent.refs.get(channel);
      if (set) {
        set.delete(onMessage);
        if (!set.size) { ent.refs.delete(channel); ent.client.part(channel); }
      }
    }
  };
}

function status() {
  const servers = cfg.irc.servers || [];
  const detail = servers.map((s) => {
    const ent = pool.get(s.host);
    return { host: s.host, connected: !!(ent && ent.client && ent.client.ready), channels: ent ? ent.refs.size : 0 };
  });
  const anyConnected = detail.some((d) => d.connected);
  return {
    id: 'irc',
    label: 'IRC',
    enabled: cfg.irc.enabled,
    ok: cfg.irc.enabled,
    connected: anyConnected,
    note: anyConnected ? '匿名只读/可发言（公共频道）' : '已配置，尚未建立连接（首次拉取列表时自动连接）',
    servers: detail
  };
}

module.exports = { id: 'irc', label: 'IRC', status, listChannels, join, parseChannelId };

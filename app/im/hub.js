/**
 * 统一会话中心：把 IRC / Matrix / XMPP 三个适配器抽象成同一套「频道 + 会话」模型。
 * 频道 ID 采用 URI 形式，方案段即协议：irc://  matrix://  xmpp://
 */
const crypto = require('crypto');
const cfg = require('./config');

const adapters = {
  irc: require('./adapters/irc'),
  matrix: require('./adapters/matrix'),
  xmpp: require('./adapters/xmpp')
};

const sessions = new Map(); // sid -> {id, protocol, channel, name, send, leave, msgs:[], at}

function protocols() {
  return Object.values(adapters).map((a) => a.status());
}

/**
 * 聚合频道列表。
 * @param {{protocol?:string,q?:string,limit?:number}} opt
 */
async function listChannels(opt = {}) {
  const limit = Math.min(Math.max(parseInt(opt.limit, 10) || 300, 1), 600);
  const q = opt.q || '';
  const targets = opt.protocol && opt.protocol !== 'all'
    ? [adapters[opt.protocol]].filter(Boolean)
    : Object.values(adapters);

  const results = await Promise.all(targets.map(async (a) => {
    try {
      const r = await a.listChannels({ q, limit });
      return { id: a.id, channels: r.channels || [], errors: r.errors || [], total: r.total || 0 };
    } catch (e) {
      return { id: a.id, channels: [], errors: [{ server: '', error: e.message }], total: 0 };
    }
  }));

  const merged = [];
  const errors = [];
  for (const r of results) {
    merged.push(...r.channels);
    errors.push(...r.errors.map((x) => ({ protocol: r.id, ...x })));
  }
  merged.sort((a, b) => (b.members || 0) - (a.members || 0));
  const clipped = merged.slice(0, limit);
  return {
    channels: clipped,
    total: merged.length,
    errors,
    protocols: protocols()
  };
}

/**
 * 加入频道。协议由频道 ID 里的 scheme 决定，调用方不需要关心中间协议。
 */
async function join(channelId, clientTag = '') {
  const scheme = String(channelId).split('://')[0];
  const adapter = adapters[scheme];
  if (!adapter) throw Object.assign(new Error('不支持的频道协议: ' + scheme), { code: 'BAD_PROTOCOL' });

  const sid = crypto.randomBytes(8).toString('hex');
  const msgs = [];
  const rec = { id: sid, protocol: scheme, channel: channelId, name: '', at: Date.now() };

  const conn = await adapter.join(channelId, (m) => {
    const item = { from: m.from || '', text: m.text || '', ts: m.ts || Date.now() };
    msgs.push(item);
    if (msgs.length > cfg.maxMessages) msgs.splice(0, msgs.length - cfg.maxMessages);
    rec.at = Date.now();
  });

  rec.name = conn.name || channelId;
  rec.server = conn.server || '';
  rec.send = conn.send;
  rec.leave = conn.leave;
  rec.msgs = msgs;
  sessions.set(sid, rec);

  return { sid, protocol: scheme, channel: channelId, name: rec.name, server: rec.server };
}

function getSession(sid) {
  const s = sessions.get(sid);
  if (s) s.at = Date.now();
  return s;
}

async function send(sid, text) {
  const s = sessions.get(sid);
  if (!s) throw Object.assign(new Error('会话不存在或已过期'), { code: 'NO_SESSION' });
  s.msgs.push({ from: '我', text: String(text).slice(0, 4000), ts: Date.now(), self: true });
  if (s.msgs.length > cfg.maxMessages) s.msgs.splice(0, s.msgs.length - cfg.maxMessages);
  await s.send(text);
  return true;
}

function messages(sid, after = 0) {
  const s = sessions.get(sid);
  if (!s) throw Object.assign(new Error('会话不存在或已过期'), { code: 'NO_SESSION' });
  const from = Math.max(parseInt(after, 10) || 0, 0);
  return { messages: s.msgs.slice(from), cursor: s.msgs.length, name: s.name, protocol: s.protocol };
}

async function leave(sid) {
  const s = sessions.get(sid);
  if (!s) return false;
  sessions.delete(sid);
  try { await s.leave(); } catch (_) {}
  return true;
}

// 空闲会话回收
setInterval(() => {
  const now = Date.now();
  for (const [sid, s] of sessions) {
    if (now - s.at > cfg.sessionIdleMs) {
      sessions.delete(sid);
      try { s.leave(); } catch (_) {}
    }
  }
}, 60 * 1000).unref();

module.exports = { protocols, listChannels, join, send, messages, leave, getSession };

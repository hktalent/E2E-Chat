/**
 * XMPP 适配器（MUC 群聊）：依赖 @xmpp/client。
 * - 列出公共 MUC 房间需要账号（disco#items + disco#info 取人数）
 * - 加入/发言需要账号（环境变量 IM_XMPP_JID / IM_XMPP_PASS）
 */
const cfg = require('../config');
const cache = require('../cache');

let lib = null;
try { lib = require('@xmpp/client'); } catch (_) { lib = null; }

let xmpp = null;
let online = false;
let joinPromise = null;
const roomSubs = new Map(); // roomJid -> Set(cb)

const MUC = () => cfg.xmpp.mucDomain;
const FULLJID = () => (cfg.xmpp.jid || '').split('@')[0];

function haveCred() {
  return !!(cfg.xmpp.jid && cfg.xmpp.password && lib);
}

async function connect() {
  if (!haveCred()) {
    const e = new Error('XMPP 需要账号：请配置 IM_XMPP_JID / IM_XMPP_PASS');
    e.code = 'NEED_CREDENTIALS';
    throw e;
  }
  if (online && xmpp) return xmpp;
  if (joinPromise) return joinPromise;

  const { client, xml } = lib;
  const service = cfg.xmpp.service;
  xmpp = client({
    service,
    domain: cfg.xmpp.jid.split('@')[1],
    resource: 'e2echat',
    username: FULLJID(),
    password: cfg.xmpp.password
  });
  xmpp.on('error', (e) => console.warn('[im:xmpp]', e.message));
  xmpp.on('offline', () => { online = false; });
  xmpp.on('stanza', (stanza) => {
    if (!stanza.is('message') || stanza.attrs.type !== 'groupchat') return;
    const from = stanza.attrs.from || '';
    const room = from.split('/')[0];
    const nick = from.split('/')[1] || '';
    const body = stanza.getChildText('body');
    if (!body) return;
    cornershot(room, { channel: room, from: nick, text: body, ts: Date.now() });
  });

  joinPromise = (async () => {
    try {
      await xmpp.start();
      online = true;
      return xmpp;
    } finally {
      joinPromise = null;
    }
  })();
  return joinPromise;
}

function cornershot(room, msg) {
  const subs = roomSubs.get(room);
  if (!subs) return;
  for (const fn of subs) { try { fn(msg); } catch (_) {} }
}

async function discoItems(jid, node) {
  const { xml } = lib;
  const iq = xml('iq', { type: 'get', to: jid, id: 'e2e' + Math.random().toString(36).slice(2) },
    xml('query', { xmlns: 'http://jabber.org/protocol/disco#items' }));
  const res = await xmpp.iqCaller.request(iq, 10000);
  const q = res.getChild('query');
  if (!q) return [];
  return q.getChildren('item').map((it) => ({ jid: it.attrs.jid, name: it.attrs.name || '' }));
}

async function discoOccupants(roomJid) {
  const { xml } = lib;
  const iq = xml('iq', { type: 'get', to: roomJid, id: 'e2e' + Math.random().toString(36).slice(2) },
    xml('query', { xmlns: 'http://jabber.org/protocol/disco#info' }));
  const res = await xmpp.iqCaller.request(iq, 8000);
  const q = res.getChild('query');
  const form = q && q.getChild('x', 'jabber:x:data');
  if (!form) return 0;
  for (const f of form.getChildren('field')) {
    if (f.attrs.var === 'muc#roominfo_occupants') {
      const v = f.getChildText('value');
      return parseInt(v, 10) || 0;
    }
  }
  return 0;
}

async function listChannels({ q = '', limit = 120 } = {}) {
  if (!haveCred()) {
    const snap0 = cache.load('xmpp_' + MUC());
    if (snap0) {
      let r0 = cache.markStale(snap0.items, snap0.ts);
      if (q) { const lq = q.toLowerCase(); r0 = r0.filter((c) => (c.name || '').toLowerCase().includes(lq) || (c.title || '').toLowerCase().includes(lq)); }
      r0.sort((a, b) => b.members - a.members);
      return { channels: r0.slice(0, limit), errors: [{ server: MUC(), soft: true, error: '未配置账号，展示本地缓存（' + Math.round(snap0.ageMs / 3600000) + ' 小时前，最长 7 天）' }], total: r0.length };
    }
  }
  if (!haveCred()) {
    return { channels: [], errors: [{ server: MUC(), error: 'XMPP 未配置账号（IM_XMPP_JID / IM_XMPP_PASS）' }], total: 0 };
  }
  try {
    await connect();
  } catch (e) {
    return xmppFallback(q, limit, e.message);
  }
  let items;
  try {
    items = await discoItems(MUC());
  } catch (e) {
    return xmppFallback(q, limit, e.message);
  }
  const first = items.slice(0, Math.min(items.length, 40));
  const counts = await Promise.all(first.map((it) => discoOccupants(it.jid).catch(() => 0)));
  const all = items.map((it, i) => ({
    id: `xmpp://${MUC()}/` + encodeURIComponent(it.jid),
    protocol: 'xmpp',
    protocolLabel: 'XMPP',
    server: MUC(),
    name: it.jid,
    title: it.name,
    members: counts[i] || 0,
    topic: ''
  }));
  let res = all;
  if (q) {
    const lq = q.toLowerCase();
    res = res.filter((c) => c.name.toLowerCase().includes(lq) || (c.title || '').toLowerCase().includes(lq));
  }
  res.sort((a, b) => b.members - a.members);
  cache.save('xmpp_' + MUC(), all);
  return { channels: res.slice(0, limit), errors: [], total: res.length };
}

function xmppFallback(q, limit, errMsg) {
  const snap = cache.load('xmpp_' + MUC());
  if (!snap) return { channels: [], errors: [{ server: MUC(), error: errMsg }], total: 0 };
  let res = cache.markStale(snap.items, snap.ts);
  if (q) {
    const lq = q.toLowerCase();
    res = res.filter((c) => (c.name || '').toLowerCase().includes(lq) || (c.title || '').toLowerCase().includes(lq));
  }
  res.sort((a, b) => b.members - a.members);
  return {
    channels: res.slice(0, limit),
    errors: [{ server: MUC(), soft: true, error: '网络异常，展示本地缓存（' + Math.round(snap.ageMs / 3600000) + ' 小时前，最长 7 天）：' + errMsg }],
    total: res.length
  };
}

function parseChannelId(channelId) {
  const m = /^xmpp:\/\/([^/]+)\/(.+)$/.exec(channelId);
  if (!m) throw new Error('bad xmpp channel id');
  return { muc: m[1], room: decodeURIComponent(m[2]) };
}

async function join(channelId, onMessage) {
  const { room } = parseChannelId(channelId);
  const c = await connect();
  const { xml } = lib;
  const nick = 'e2e' + Math.random().toString(36).slice(2, 7);
  if (!roomSubs.has(room)) roomSubs.set(room, new Set());
  roomSubs.get(room).add(onMessage);
  c.send(xml('presence', { to: `${room}/${nick}` },
    xml('x', { xmlns: 'http://jabber.org/protocol/muc' })));

  return {
    protocol: 'xmpp',
    server: MUC(),
    name: room,
    send: (text) => {
      c.send(xml('message', { to: room, type: 'groupchat' }, xml('body', {}, String(text).slice(0, 2000))));
    },
    leave: () => {
      const subs = roomSubs.get(room);
      if (subs) { subs.delete(onMessage); if (!subs.size) roomSubs.delete(room); }
      try { c.send(xml('presence', { to: `${room}/${nick}`, type: 'unavailable' })); } catch (_) {}
    }
  };
}

function status() {
  return {
    id: 'xmpp',
    label: 'XMPP',
    enabled: cfg.xmpp.enabled,
    ok: cfg.xmpp.enabled && !!lib,
    connected: online,
    hasCredentials: !!cfg.xmpp.jid,
    note: !lib ? '未安装 @xmpp/client，XMPP 不可用'
      : (cfg.xmpp.jid ? (online ? '已连接，可列出/加入 MUC 房间' : '已配置账号，首次使用时连接')
        : '需要配置 IM_XMPP_JID / IM_XMPP_PASS'),
    service: cfg.xmpp.service,
    muc: MUC()
  };
}

module.exports = { id: 'xmpp', label: 'XMPP', status, listChannels, join, parseChannelId, connect };

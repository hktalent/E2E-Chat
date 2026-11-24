/**
 * 多协议 IM 桥接的 HTTP 接口层。
 * 挂载点：在 server.js 的 cbkApp 回调里 require('./im')(app)。
 * 所有路由都在 /api/im/ 下，不改动任何既有页面与接口。
 */
const express = require('express');
const hub = require('./hub');
const matrix = require('./adapters/matrix');

function json(res, code, obj) {
  res.status(code).set('Content-Type', 'application/json; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

module.exports = function mount(app) {
  // 只对 /api/im 生效的 JSON 解析，避免影响既有路由
  app.use('/api/im', express.json({ limit: '64kb' }));
  const wrap = (fn) => async (req, res) => {
    try {
      const out = await fn(req, res);
      if (out !== undefined) json(res, 200, out);
    } catch (e) {
      const code = e && e.code === 'NEED_CREDENTIALS' ? 401 : (e && e.code === 'BAD_PROTOCOL' ? 400 : 500);
      console.warn('[im]', req.method, req.url, e && e.message);
      json(res, code, { ok: false, code: (e && e.code) || 'ERROR', error: e.message });
    }
  };

  // 协议能力与状态
  app.get('/api/im/protocols', wrap(async () => {
    await matrix.probe().catch(() => {});
    return { ok: true, protocols: hub.protocols() };
  }));

  // 频道列表（跨协议聚合，含人数）
  // 参数：protocol=all|irc|matrix|xmpp  q=关键词  limit=条数
  app.get('/api/im/channels', wrap(async (req) => {
    if (req.query.protocol === 'matrix' || !req.query.protocol) {
      await matrix.probe().catch(() => {});
    }
    const r = await hub.listChannels({
      protocol: req.query.protocol || 'all',
      q: req.query.q || '',
      limit: req.query.limit
    });
    return { ok: true, ...r };
  }));

  // 加入频道：协议由频道 ID 自动匹配
  app.post('/api/im/join', wrap(async (req) => {
    const body = req.body || {};
    const channelId = body.channelId || req.query.channelId;
    if (!channelId) {
      const e = new Error('缺少 channelId');
      e.code = 'BAD_PROTOCOL';
      throw e;
    }
    const s = await hub.join(channelId, body.tag || '');
    return { ok: true, ...s };
  }));

  // 轮询消息：cursor 为上次返回的 cursor
  app.get('/api/im/messages', wrap(async (req) => {
    const sid = req.query.sid;
    if (!sid) throw Object.assign(new Error('缺少 sid'), { code: 'NO_SESSION' });
    const r = hub.messages(sid, req.query.cursor || 0);
    return { ok: true, ...r };
  }));

  // 发送消息
  app.post('/api/im/send', wrap(async (req) => {
    const body = req.body || {};
    if (!body.sid) throw Object.assign(new Error('缺少 sid'), { code: 'NO_SESSION' });
    if (!body.text) throw Object.assign(new Error('消息为空'), { code: 'BAD_PROTOCOL' });
    await hub.send(body.sid, body.text);
    return { ok: true };
  }));

  // 离开会话
  app.post('/api/im/leave', wrap(async (req) => {
    const body = req.body || {};
    return { ok: await hub.leave(body.sid) };
  }));
};

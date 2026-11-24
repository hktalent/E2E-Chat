/**
 * 多协议 IM 桥接配置。
 * 全部可通过环境变量覆盖，仓库内不保存任何凭据。
 */
module.exports = {
  // 单个客户端会话的消息保留条数
  maxMessages: 200,
  // 会话空闲回收时间（毫秒）
  sessionIdleMs: 30 * 60 * 1000,
  // 频道列表缓存时间
  listCacheMs: 60 * 1000,

  irc: {
    enabled: process.env.IM_IRC_DISABLE !== '1',
    // 默认连接公共网络；可用 IM_IRC_SERVERS_JSON 覆盖（数组，元素含 host/port/tls/label/sasl）
    servers: (function () {
      if (process.env.IM_IRC_SERVERS_JSON) {
        try {
          const v = JSON.parse(process.env.IM_IRC_SERVERS_JSON);
          if (Array.isArray(v) && v.length) return v;
        } catch (e) { console.warn('[im] IM_IRC_SERVERS_JSON 解析失败: ' + e.message); }
      }
      const nick = process.env.IM_IRC_NICK || '';
      const pass = process.env.IM_IRC_PASS || '';
      const sasl = nick && pass ? { user: nick, pass } : null;
      // 指定了 IM_IRC_LOCAL 时只连本地 ircd，避免被公网不可达拖慢
      if (process.env.IM_IRC_LOCAL) {
        return [{
          host: process.env.IM_IRC_LOCAL.split(':')[0],
          port: parseInt(process.env.IM_IRC_LOCAL.split(':')[1] || '6667', 10),
          tls: false,
          label: '自建 ircd'
        }];
      }
      // 默认挂三个真实网络（并行拉取，单网络失败只影响自身，不影响其它协议与其它网络）
      return [
        { host: 'irc.libera.chat', port: 6697, tls: true, label: 'Libera.Chat', sasl },
        { host: 'irc.oftc.net', port: 6697, tls: true, label: 'OFTC' }
      ].filter(Boolean);
    })(),
    nick: process.env.IM_IRC_NICK || '',
    pass: process.env.IM_IRC_PASS || ''
  },

  matrix: {
    enabled: process.env.IM_MATRIX_DISABLE !== '1',
    homeserver: process.env.IM_MATRIX_HS || 'https://matrix.org',
    // 可选：房间列表公开可读；加入/发言需要 access token
    accessToken: process.env.IM_MATRIX_TOKEN || '',
    userId: process.env.IM_MATRIX_USER || ''
  },

  xmpp: {
    enabled: process.env.IM_XMPP_DISABLE !== '1',
    service: process.env.IM_XMPP_SERVICE || 'xmpp://xmpp.jp:5222',
    // 列出 MUC 房间与加入房间必须有账号
    jid: process.env.IM_XMPP_JID || '',
    password: process.env.IM_XMPP_PASS || '',
    mucDomain: process.env.IM_XMPP_MUC || 'conference.xmpp.jp'
  }
};

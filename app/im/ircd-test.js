/**
 * 本地真实 IRCd（用 ircdkit 实现核心命令），仅用于端到端联调。
 * 端口 6667（开发联调用），内置 #test(3 人) / #random(1 人) / #help(0 人)
 */
const ircdkit = require('ircdkit');

const irc = ircdkit({ requireNickname: true, hostname: 'test.local' });
const chans = new Map(); // name -> Set(connection)
chans.set('#test', new Set());
chans.set('#random', new Set());
chans.set('#help', new Set());
const members = { '#test': 0, '#random': 0, '#help': 0 }; // 人数按真实连接统计
const topics = { '#test': '端到端联调频道', '#random': '闲聊', '#help': '求助' };

function usersOf(name) {
  const s = chans.get(name);
  return s ? [...s].map((c) => c.nickname) : [];
}

irc.on('connection', (conn) => {
  conn.on('authenticated', () => {
    console.log('[ircd] 登录:', conn.mask);
  });
  conn.on('LIST', () => {
    for (const [name, n] of Object.entries(members)) {
      conn.send(true, '322', conn.nickname || '*', name, String(n), ':' + (topics[name] || ''));
    }
    conn.send(true, '323', conn.nickname || '*', ':End of /LIST');
  });
  conn.on('JOIN', (chan) => {
    const name = String(chan).split(',')[0];
    if (!chans.has(name)) { chans.set(name, new Set()); members[name] = 0; }
    chans.get(name).add(conn);
    members[name] = chans.get(name).size;
    for (const c of chans.get(name)) {
      c.send(conn.mask, 'JOIN', name);
    }
    conn.send(true, '353', conn.nickname, '=', name, ':' + usersOf(name).join(' '));
    conn.send(true, '366', conn.nickname, name, ':End of /NAMES');
  });
  conn.on('PART', (chan) => {
    const name = String(chan).split(',')[0];
    const s = chans.get(name);
    if (!s) return;
    s.delete(conn);
    members[name] = s.size;
    for (const c of s) c.send(conn.mask, 'PART', name);
  });
  conn.on('NAMES', (chan) => {
    const name = String(chan).split(',')[0];
    conn.send(true, '353', conn.nickname, '=', name, ':' + usersOf(name).join(' '));
    conn.send(true, '366', conn.nickname, name, ':End of /NAMES');
  });
  conn.on('PRIVMSG', (target, msg) => {
    const s = chans.get(target);
    if (!s) { conn.send(true, '401', conn.nickname, target, ':No such nick/channel'); return; }
    for (const c of s) {
      if (c !== conn) c.send(conn.mask, 'PRIVMSG', target, ':' + msg);
    }
  });
  conn.on('PING', (token) => conn.send(true, 'PONG', 'test.local', ':' + token));
  conn.on('user:quit', () => {
    for (const [name, s] of chans) {
      if (s.delete(conn)) members[name] = s.size;
    }
  });
});

irc.listen(6667, '127.0.0.1', () => console.log('[ircd] listening 127.0.0.1:6667 #test/#random/#help'));

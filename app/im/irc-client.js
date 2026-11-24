/**
 * 极简 IRC 客户端（RFC1459/2812 子集），仅依赖 net/tls。
 * 支持：注册、LIST、JOIN/PART、PRIVMSG、NAMES、PING/PONG 保活、自动重连不在此层处理。
 * 事件：ready / list / listend / message / join / part / names / nickinuse / error / close
 */
const net = require('net');
const tls = require('tls');
const { EventEmitter } = require('events');

class IrcClient extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.host = opts.host || 'irc.libera.chat';
    this.port = opts.port || 6697;
    this.tls = opts.tls !== false;
    this.nick = opts.nick || ('e2e' + Math.random().toString(36).slice(2, 8));
    this.sasl = opts.sasl || null;       // {user, pass}
    this.capNegotiated = false;
    this.sock = null;
    this.ready = false;
    this.listBuf = [];
    this.listPending = false;
    this.sendQueue = [];
    this.sendTimer = null;
    this.lastSend = 0;
    this._listeners = 0;
    this.setMaxListeners(50);
  }

  connect(timeout = 12000) {
    return new Promise((resolve, reject) => {
      if (this.sock && this.ready) return resolve(this);
      let done = false;
      const onErr = (e) => { if (!done) { done = true; reject(e); } };
      const opts = { host: this.host, port: this.port };
      const s = this.tls
        ? tls.connect({ ...opts, servername: this.host, rejectUnauthorized: false }, onConnect)
        : net.connect(opts, onConnect);
      let timer = setTimeout(() => {
        if (!done) { done = true; try { s.destroy(); } catch (_) {} reject(new Error('IRC connect timeout')); }
      }, timeout);

      const self = this;
      function onConnect() {
        clearTimeout(timer);
        self.sock = s;
        s.setEncoding('utf8');
        s.on('data', (d) => self._onData(d));
        s.on('error', (e) => { self.emit('error', e); onErr(e); });
        s.on('close', () => {
          self.ready = false;
          self.emit('close');
          if (!self.ready && !self._gotWelcome) onErr(new Error('IRC 连接被关闭（可能要求 SASL 或拒绝匿名）'));
        });
        // 注册：先协商能力，支持时用 SASL 认证
        if (self.sasl) self._raw('CAP LS 302');
        self._raw(`NICK ${self.nick}`);
        self._raw(`USER ${self.nick} 0 * :E2E Chat web bridge`);
      }
      this.once('ready', () => { if (!done) { done = true; resolve(this); } });
    });
  }

  _raw(line) {
    if (!this.sock || this.sock.destroyed) return false;
    try { this.sock.write(line + '\r\n'); return true; } catch (e) { return false; }
  }

  /** 限速发送：IRC 网络普遍限制 2 行/秒 */
  _queue(line) {
    this.sendQueue.push(line);
    this._flush();
  }

  _flush() {
    if (this.sendTimer || !this.sendQueue.length) return;
    const gap = Math.max(0, 550 - (Date.now() - this.lastSend));
    this.sendTimer = setTimeout(() => {
      this.sendTimer = null;
      const line = this.sendQueue.shift();
      if (line) { this._raw(line); this.lastSend = Date.now(); }
      if (this.sendQueue.length) this._flush();
    }, gap);
  }

  _onData(chunk) {
    for (const rawLine of chunk.split(/\r?\n/)) {
      const line = rawLine.replace(/\r/g, '');
      if (!line) continue;
      try { this._parse(line); } catch (e) { this.emit('error', e); }
    }
  }

  _parse(line) {
    // 前缀
    let prefix = '';
    if (line[0] === ':') {
      const sp = line.indexOf(' ');
      prefix = line.slice(1, sp).replace(/^:/, '');
      line = line.slice(sp + 1);
    }
    // 命令（数字或字母）
    const sp = line.indexOf(' ');
    let cmd = sp === -1 ? line : line.slice(0, sp);
    let rest = sp === -1 ? '' : line.slice(sp + 1);
    // 尾参数
    let trailing = null;
    if (rest.indexOf(' :') !== -1) {
      const i = rest.indexOf(' :');
      trailing = rest.slice(i + 2);
      rest = rest.slice(0, i);
    }
    const args = rest ? rest.split(' ').filter(Boolean) : [];
    if (trailing !== null) args.push(trailing);

    const nick = prefix.split('!')[0];

    if (cmd === 'PING') { this._raw('PONG :' + (args[0] || '')); return; }

    if (cmd === 'CAP') {
      const sub = (args[1] || '').toUpperCase();
      if (sub === 'LS' || sub === 'ACK') {
        if (this.sasl && !this._saslStarted) {
          this._saslStarted = true;
          this._raw('AUTHENTICATE PLAIN');
        } else if (!this.sasl && !this.capNegotiated) {
          this.capNegotiated = true;
          this._raw('CAP END');
        }
      }
      return;
    }
    if (cmd === 'AUTHENTICATE') {
      // 服务器给出 'AUTHENTICATE +'，回 PLAIN 载荷
      if (this.sasl && (args[0] === '+' || args[0] === '=')) {
        const payload = Buffer.from(
          `${this.sasl.user}\u0000${this.sasl.user}\u0000${this.sasl.pass}`
        ).toString('base64');
        this._raw('AUTHENTICATE ' + payload);
      }
      return;
    }
    if (cmd === '903' || cmd === '900') {
      if (cmd === '903' && !this.capNegotiated) {
        this.capNegotiated = true;
        this._raw('CAP END');
      }
      this.emit('sasl', { ok: true, text: args.slice(1).join(' ') });
      return;
    }
    if (cmd === '904' || cmd === '905' || cmd === '906' || cmd === '907') {
      this.capNegotiated = true;
      this._raw('CAP END');
      this.emit('sasl', { ok: false, text: args.slice(1).join(' ') });
      return;
    }

    if (cmd === '001') { // welcome
      this.ready = true;
      this._gotWelcome = true;
      this.emit('ready', args[1] || '');
      return;
    }
    if (cmd === '433' || cmd === '432') { // nick in use / invalid
      this.nick = this.nick + Math.floor(Math.random() * 90 + 10);
      this._raw(`NICK ${this.nick}`);
      this.emit('nickinuse', this.nick);
      return;
    }
    if (cmd === '322') { // LIST 项目: <chan> <count> :topic
      this.listBuf.push({ name: args[1], members: parseInt(args[2], 10) || 0, topic: args[3] || '' });
      return;
    }
    if (cmd === '323') { // end of LIST
      this.listPending = false;
      this.emit('list', this.listBuf);
      this.listBuf = [];
      this.emit('listend');
      return;
    }
    if (cmd === '353') { // NAMES: <chan> :a b c
      const names = (args[3] || '').split(' ').filter(Boolean);
      this.emit('names', args[2], names);
      return;
    }
    if (cmd === '366') { this.emit('namesend', args[1]); return; }
    if (cmd === 'PRIVMSG') {
      this.emit('message', { channel: args[0], from: nick, text: args[1] || '', ts: Date.now() });
      return;
    }
    if (cmd === 'JOIN') { this.emit('join', { channel: args[0], nick }); return; }
    if (cmd === 'PART') { this.emit('part', { channel: args[0], nick }); return; }
    if (cmd === 'QUIT') { this.emit('quit', { nick }); return; }
    if (cmd === 'NICK') { this.emit('nick', { from: nick, to: args[0] }); return; }
    if (cmd === 'ERROR') { this.emit('error', new Error(args.join(' '))); return; }
    if (/^4|^5/.test(cmd)) { this.emit('noticeError', { cmd, args }); }
  }

  /** 拉取频道列表 */
  list() {
    this.listBuf = [];
    this.listPending = true;
    this._queue('LIST');
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        const partial = this.listBuf;
        this.listBuf = [];
        this.removeListener('list', once);
        resolve(partial);
      }, 15000);
      const once = (items) => { clearTimeout(t); resolve(items); };
      this.once('list', once);
      this.once('error', (e) => { clearTimeout(t); reject(e); });
    });
  }

  join(channel) { this._queue(`JOIN ${channel}`); }
  part(channel) { this._queue(`PART ${channel}`); }
  names(channel) { this._queue(`NAMES ${channel}`); }

  say(channel, text) {
    const clean = String(text).replace(/\r|\n/g, ' ').slice(0, 400);
    this._queue(`PRIVMSG ${channel} :${clean}`);
  }

  quit(msg = 'bye') {
    this._raw(`QUIT :${msg}`);
    setTimeout(() => { try { this.sock && this.sock.destroy(); } catch (_) {} }, 200);
  }
}

module.exports = IrcClient;

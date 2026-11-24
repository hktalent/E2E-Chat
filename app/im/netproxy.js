/**
 * 极简出网代理支持（零依赖）。
 * 背景：matrix.org / 公网 IRCd 在部分网络被直连阻断，而本机系统代理（SOCKS5）可通。
 * Node 的 fetch 不会自动走系统代理，所以这里自己实现 SOCKS5 / HTTP CONNECT 隧道。
 *
 * 环境变量（任选其一，未设置则直连）：
 *   IM_SOCKS_PROXY=socks5://127.0.0.1:1081     仅 IM 桥接使用
 *   IM_HTTP_PROXY=http://127.0.0.1:8080        仅 IM 桥接使用
 *   IM_PROXY_FALLBACK=1                        允许回落到 HTTPS_PROXY / HTTP_PROXY / ALL_PROXY
 */
const net = require('net');
const tls = require('tls');
const https = require('https');
const { URL } = require('url');

function pickProxy() {
  const explicit = process.env.IM_SOCKS_PROXY || process.env.IM_HTTP_PROXY || '';
  if (explicit) return explicit;
  if (process.env.IM_PROXY_FALLBACK === '1') {
    const fb = process.env.ALL_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy || '';
    if (fb) return fb;
  }
  return '';
}

function parseProxy(str) {
  if (!str) return null;
  try {
    const u = new URL(str.indexOf('://') === -1 ? 'socks5://' + str : str);
    const kind = (u.protocol || 'socks5:').replace(':', '');
    const port = parseInt(u.port || (kind === 'socks5' || kind === 'socks5h' ? '1080' : '8080'), 10);
    return {
      kind: kind === 'socks5h' ? 'socks5h' : kind,
      host: u.hostname,
      port,
      user: u.username ? decodeURIComponent(u.username) : '',
      pass: u.password ? decodeURIComponent(u.password) : ''
    };
  } catch (e) {
    return null;
  }
}

const PROXY = parseProxy(pickProxy());
const proxyActive = () => !!PROXY;
const describe = () => (PROXY ? `${PROXY.kind}://${PROXY.host}:${PROXY.port}` : '直连');

/** SOCKS5（含可选用户名密码认证）建隧道；支持 socks5h 远端解析与本地解析 */
function socksConnect(targetHost, targetPort, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!PROXY) return reject(new Error('未配置代理'));
    const { kind, host, port, user, pass } = PROXY;
    let done = false;
    const finish = (err, sock) => { if (done) return; done = true; err ? reject(err) : resolve(sock); };
    const sock = net.connect({ host, port });
    const timer = setTimeout(() => { try { sock.destroy(); } catch (_) {} finish(new Error('代理握手超时')); }, timeout);
    sock.setNoDelay(true);

    sock.once('connect', () => {
      const methods = user ? [0x00, 0x02] : [0x00];
      sock.write(Buffer.from([0x05, methods.length, ...methods]));
    });
    sock.once('error', (e) => { clearTimeout(timer); finish(e); });

    let stage = 'greet';
    const onData = (buf) => {
      if (stage === 'greet') {
        if (buf[0] !== 0x05) return finish(new Error('代理不是 SOCKS5'));
        const method = buf[1];
        if (method === 0xff) return finish(new Error('代理拒绝所有认证方式'));
        if (method === 0x02) {
          if (!user) return finish(new Error('代理要求认证但未配置用户名'));
          const u = Buffer.from(user), p = Buffer.from(pass);
          sock.write(Buffer.concat([Buffer.from([0x01, u.length]), u, Buffer.from([p.length]), p]));
          stage = 'auth';
          return;
        }
        stage = 'connect';
        sendConnect();
        return;
      }
      if (stage === 'auth') {
        if (buf[1] !== 0x00) return finish(new Error('代理认证失败'));
        stage = 'connect';
        sendConnect();
        return;
      }
      // 回包：VER REP RSV ATYP ...
      if (buf[1] !== 0x00) {
        const codes = { 1: '一般失败', 2: '规则不允许', 3: '网络不可达', 4: '主机不可达', 5: '连接被拒', 6: 'TTL 超时', 7: '不支持的命令', 8: '不支持的地址类型' };
        return finish(new Error('SOCKS5 连接失败: ' + (codes[buf[1]] || ('code ' + buf[1]))));
      }
      clearTimeout(timer);
      sock.removeListener('data', onData);
      finish(null, sock);
    };

    function sendConnect() {
      const remote = kind === 'socks5h';
      let addr;
      if (remote) {
        const h = Buffer.from(targetHost);
        addr = Buffer.concat([Buffer.from([0x03, h.length]), h]);
      } else if (net.isIP(targetHost) === 4) {
        const parts = targetHost.split('.').map(Number);
        addr = Buffer.concat([Buffer.from([0x01]), Buffer.from(parts)]);
      } else {
        const h = Buffer.from(targetHost);
        addr = Buffer.concat([Buffer.from([0x03, h.length]), h]);
      }
      sock.write(Buffer.concat([Buffer.from([0x05, 0x01, 0x00]), addr, Buffer.from([targetPort >> 8, targetPort & 0xff])]));
    }

    sock.on('data', onData);
  });
}

/** HTTP CONNECT 隧道 */
function httpConnect(targetHost, targetPort, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!PROXY) return reject(new Error('未配置代理'));
    const { host, port, user, pass } = PROXY;
    const req = net.connect({ host, port });
    let done = false;
    const finish = (err, sock) => { if (done) return; done = true; err ? reject(err) : resolve(sock); };
    const timer = setTimeout(() => { try { req.destroy(); } catch (_) {} finish(new Error('代理握手超时')); }, timeout);
    req.once('error', (e) => { clearTimeout(timer); finish(e); });
    req.once('connect', () => {
      let head = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n`;
      if (user) head += 'Proxy-Authorization: Basic ' + Buffer.from(`${user}:${pass}`).toString('base64') + '\r\n';
      req.write(head + '\r\n');
    });
    req.once('data', (buf) => {
      const line = buf.toString('latin1').split('\r\n')[0];
      if (!/^HTTP\/1\.[01] 200/.test(line)) {
        clearTimeout(timer);
        return finish(new Error('HTTP 代理拒绝: ' + line));
      }
      clearTimeout(timer);
      req.removeAllListeners('data');
      finish(null, req);
    });
  });
}

/** 建立到目标的原始 TCP（必要时走代理） */
function connectRaw(host, port, timeout = 10000) {
  if (!proxyActive()) return new Promise((resolve, reject) => {
    const s = net.connect({ host, port }, () => resolve(s));
    const timer = setTimeout(() => { try { s.destroy(); } catch (_) {} reject(new Error('连接超时')); }, timeout);
    s.once('connect', () => { clearTimeout(timer); });
    s.once('error', (e) => { clearTimeout(timer); reject(e); });
  });
  return PROXY.kind === 'http' || PROXY.kind === 'https'
    ? httpConnect(host, port, timeout)
    : socksConnect(host, port, timeout);
}

/** 建立到目标的 TLS 连接（必要时走代理） */
async function connectTls(host, port, opts = {}, timeout = 10000) {
  const raw = await connectRaw(host, port, timeout);
  return new Promise((resolve, reject) => {
    const set = {
      socket: raw,
      servername: host,
      rejectUnauthorized: opts.rejectUnauthorized !== false
    };
    if (opts.ca) set.ca = opts.ca;
    const s = tls.connect(set, () => resolve(s));
    const timer = setTimeout(() => { try { s.destroy(); } catch (_) {} reject(new Error('TLS 握手超时')); }, timeout);
    s.once('secureConnect', () => clearTimeout(timer));
    s.once('error', (e) => { clearTimeout(timer); reject(e); });
  });
}

/** 简易 JSON/文本 GET-POST，走代理时用 https.request，否则用全局 fetch */
function requestJson(url, { method = 'GET', headers = {}, body, token, timeout = 12000 } = {}) {
  const u = new URL(url);
  if (!proxyActive()) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    return fetch(url, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}, headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    }).then(parseRes).finally(() => clearTimeout(t));
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, val) => { if (settled) return; settled = true; err ? reject(err) : resolve(val); };
    // 自定义 agent：createConnection 负责「SOCKS 隧道 + TLS」，https.request 只做 HTTP 语义
    const agent = new https.Agent({ keepAlive: false });
    agent.createConnection = (opts, cb) => {
      connectTls(opts.host || u.hostname, opts.port || 443, {}, timeout).then((s) => cb(null, s)).catch((e) => cb(e));
    };
    const req = https.request({
      host: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      agent,
      headers: Object.assign(
        { 'Content-Type': 'application/json', Host: u.hostname },
        token ? { Authorization: 'Bearer ' + token } : {},
        headers
      )
    }, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { buf += d; });
      res.on('end', () => {
        try {
          parseText(res.statusCode, buf).then((v) => done(null, v)).catch(done);
        } catch (e) { done(e); }
      });
    });
    req.setTimeout(timeout, () => { try { req.destroy(new Error('请求超时')); } catch (_) {} });
    req.on('error', done);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseText(status, text) {
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  if (status >= 400) {
    const err = new Error(`HTTP ${status}: ${(json && (json.error || json.errcode)) || (text || '').slice(0, 120)}`);
    err.status = status;
    throw err;
  }
  return Promise.resolve(json);
}

function parseRes(r) {
  return r.text().then((text) => {
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) {}
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}: ${(json && (json.error || json.errcode)) || text.slice(0, 120)}`);
      err.status = r.status;
      throw err;
    }
    return json;
  });
}

module.exports = { connectRaw, connectTls, requestJson, proxyActive, describe };

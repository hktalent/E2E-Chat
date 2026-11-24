/**
 * 极简 TCP 端口转发（零依赖）。
 * 用途：本机 SOCKS/HTTP 代理只监听 127.0.0.1 时，容器访问不到；
 *       用它在宿主机把 0.0.0.0:10811 转发到 127.0.0.1:1081，容器即可用
 *       IM_SOCKS_PROXY=socks5://host.docker.internal:10811。
 *
 * 用法：node app/im/proxy-relay.js            （默认 0.0.0.0:10811 -> 127.0.0.1:1081）
 *       LISTEN=0.0.0.0:10811 UPSTREAM=127.0.0.1:1081 node app/im/proxy-relay.js
 */
const net = require('net');

const LISTEN = (process.env.LISTEN || '0.0.0.0:10811').split(':');
const UPSTREAM = (process.env.UPSTREAM || '127.0.0.1:1081').split(':');

net.createServer((client) => {
  const up = net.connect({ host: UPSTREAM[0], port: parseInt(UPSTREAM[1], 10) });
  const kill = () => { client.destroy(); up.destroy(); };
  client.on('error', kill); up.on('error', kill);
  client.on('close', () => up.destroy()); up.on('close', () => client.destroy());
  client.pipe(up).pipe(client);
}).listen(parseInt(LISTEN[1], 10), LISTEN[0], () => {
  console.log(`[relay] ${LISTEN[0]}:${LISTEN[1]} -> ${UPSTREAM[0]}:${UPSTREAM[1]}`);
});

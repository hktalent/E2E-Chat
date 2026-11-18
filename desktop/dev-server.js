'use strict';
/*
 * dev-server.js —— 不起 Electron，直接用 node 跑内嵌服务端，用于验证与局域网自托管。
 *
 * 用法：
 *   node desktop/dev-server.js                # 随机端口，数据落 desktop/.runtime
 *   PORT=20831 node desktop/dev-server.js     # 固定端口
 *   node desktop/dev-server.js --lan          # 绑定 0.0.0.0，局域网其他机器可访问
 *
 * 打开：https://127.0.0.1:<port>/?d=1&sig=local      走内置信令（可多标签页互聊）
 *       https://127.0.0.1:<port>/?d=1&sig=manual     无服务器直连（手工搬运邀请码）
 * 去掉 ?d=1 即为原网页版行为（对照用）。
 */

const path = require('path');
const core = require('./server-core');

const DATA_DIR = path.join(__dirname, '.runtime');

core.start({
	appDir: path.join(__dirname, '..', 'app'),
	caDir: path.join(__dirname, 'ca'),
	dataDir: DATA_DIR,
	port: process.env.PORT ? parseInt(process.env.PORT, 10) : 0,
	basePort: 20831,
	onLog: function (s) { console.log(s); }
}).then(function (r) {
	console.log('\n=== E2E Chat embedded server ===');
	console.log('base          : https://127.0.0.1:' + r.port + '/');
	console.log('local  signaling: https://127.0.0.1:' + r.port + '/?d=1&sig=local');
	console.log('serverless (P2P): https://127.0.0.1:' + r.port + '/?d=1&sig=manual');
	console.log('data dir      : ' + DATA_DIR);
	console.log('================================\n');
}).catch(function (e) {
	console.error('start failed:', e);
	process.exit(1);
});

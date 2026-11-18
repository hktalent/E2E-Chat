'use strict';
/*
 * server-core.js —— 桌面端内嵌服务端（与 Electron 解耦，可单独用 node 跑起来做验证 / 局域网自托管）
 *
 * 关键点：不复制、不重写任何服务端逻辑，只是以「调用方」身份 new 一次 myapp_51pwn.js，
 * 因此 chat.51pwn.com 的网页版与该桌面版共用同一份代码与同一套 static 资源。
 */

const path = require('path');
const fs = require('fs');
const net = require('net');

const APP_DIR = path.join(__dirname, '..', 'app');
const CA_DIR = path.join(__dirname, 'ca');

/**
 * 找一个真正可用的端口。
 * 探测时的绑定范围必须与 myapp 内部 server.listen(port) 一致（通配地址），
 * 否则会出现「探测说空闲、真正监听时 EADDRINUSE」的假空闲。
 */
function findFreePort(start) {
	return new Promise(function (resolve, reject) {
		let port = start;
		(function tryPort() {
			if (port > start + 200) return reject(new Error('no free port near ' + start));
			const srv = net.createServer();
			srv.once('error', function () { port++; tryPort(); });
			srv.once('listening', function () { srv.close(function () { resolve(port); }); });
			srv.listen(port);
		})();
	});
}

/**
 * 准备可写运行时目录，并把 cwd 切过去：
 *   dbChat / dbChatIp / resImg / p2f.json / static/js/,.js 等相对路径全部落在 dataDir
 */
function prepareDataDir(appDir, dataDir, onLog) {
	fs.mkdirSync(dataDir, { recursive: true });
	const st = path.join(dataDir, 'static');
	fs.mkdirSync(path.join(st, 'js'), { recursive: true });
	fs.mkdirSync(path.join(st, 'css'), { recursive: true });
	['index.html', 'index_en.html'].forEach(function (f) {
		const src = path.join(appDir, 'static', f);
		if (!fs.existsSync(src)) return;
		try { fs.copyFileSync(src, path.join(st, f)); } catch (e) { onLog && onLog('copy ' + f + ' failed: ' + e.message); }
	});
	fs.mkdirSync(path.join(dataDir, 'resImg'), { recursive: true });
	process.chdir(dataDir);
}

async function start(opts) {
	opts = opts || {};
	const appDir = opts.appDir || APP_DIR;
	const dataDir = opts.dataDir;
	const onLog = opts.onLog || function () { };
	let port = opts.port || 0;

	if (dataDir) prepareDataDir(appDir, dataDir, onLog);
	if (!port) port = await findFreePort(opts.basePort || 20831);

	const caDir = opts.caDir || CA_DIR;
	const keyPath = path.join(caDir, 'local.key');
	const certPath = path.join(caDir, 'local.cert');
	if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
		throw new Error('缺少本地自签证书：' + caDir + '（请保留 desktop/ca/local.key, local.cert）');
	}

	const myapp = require(path.join(appDir, 'myapp_51pwn.js'));
	const p2pchat = require(path.join(appDir, 'p2pchat.js'));

	function attempt(p) {
		return new Promise(function (resolve, reject) {
			let settled = false;
			const done = function () {
				if (settled) return;
				settled = true;
				resolve({ port: p, appDir: appDir });
			};
			try {
				new myapp({
					serverRootPath: appDir + path.sep,
					webStaticPath: path.join(appDir, 'static') + path.sep,
					singleIpMaxConnect: 100,
					useHttps: true,
					caKey: keyPath,
					caCert: certPath,
					port: p,
					onError: function (e) { onLog('server error: ' + String((e && e.stack) || e)); },
					onLog: function (s) { onLog('[srv] ' + s); },
					cbkApp: function () { },
					cbk4ServerAppIo: function (server, expressApp, io) {
						p2pchat.fnInit(io.of('/pChat'));
						server.once('listening', done);
						server.once('error', function (e) { if (!settled) { settled = true; reject(e); } });
					}
				});
				setTimeout(done, 2000);
			} catch (e) {
				if (!settled) { settled = true; reject(e); }
			}
		});
	}

	const maxTry = opts.maxPortTry || 6;
	let p = port;
	for (let i = 0; i < maxTry; i++) {
		try {
			return await attempt(p);
		} catch (e) {
			if (e && e.code === 'EADDRINUSE') { onLog('port ' + p + ' 被占用，换下一个'); p++; continue; }
			throw e;
		}
	}
	throw new Error('连续 ' + maxTry + ' 个端口都被占用，请先关闭其他实例');
}

module.exports = { start: start, findFreePort: findFreePort, prepareDataDir: prepareDataDir, CA_DIR: CA_DIR, APP_DIR: APP_DIR };

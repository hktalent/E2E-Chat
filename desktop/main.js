'use strict';
/*
 * E2E Chat Desktop —— Electron 主进程
 *
 * 设计原则（与 chat.51pwn.com 网页版完全解耦）：
 *   1. 不修改 server.js / myapp_51pwn.js 的逻辑，只作为「调用方」复用；
 *   2. 复用同一套 static 资源与同一套 socket.io /pChat 信令实现，网页版行为零变化；
 *   3. 本地 https://127.0.0.1:<port>（自签证书）；https 保证 CSP 的
 *      upgrade-insecure-requests 依然成立，因此无需改动任何 CSP 头；
 *   4. 运行时数据（dbChat / resImg / 合并缓存）全部落 userData，安装包内 resources 可只读。
 */

const { app, BrowserWindow, session, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const core = require('./server-core');

const IS_PACKED = app.isPackaged;
const APP_DIR = IS_PACKED ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..', 'app');
const CA_DIR = IS_PACKED ? path.join(process.resourcesPath, 'app-ca') : path.join(__dirname, 'ca');
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const LOG_FILE = path.join(app.getPath('userData'), 'desktop.log');

let mainWindow = null;
let serverPort = 0;
let logStream = null;

function log() {
	const s = new Date().toISOString() + ' ' + Array.prototype.slice.call(arguments).map(function (a) {
		return typeof a === 'string' ? a : JSON.stringify(a);
	}).join(' ');
	try { if (!logStream) logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' }); logStream.write(s + '\n'); } catch (e) { }
	console.log(s);
}

function createWindow(sigMode) {
	const q = 'd=1&sig=' + (sigMode || 'manual') + '&_=' + Date.now();
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 820,
		minWidth: 900,
		minHeight: 600,
		backgroundColor: '#0f172a',
		title: 'E2E Chat',
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			spellcheck: false
		}
	});
	mainWindow.loadURL('https://127.0.0.1:' + serverPort + '/?' + q);
	mainWindow.on('closed', function () { mainWindow = null; });
	mainWindow.webContents.setWindowOpenHandler(function (d) {
		shell.openExternal(d.url);
		return { action: 'deny' };
	});
	mainWindow.webContents.on('console-message', function (evt) {
		log('[ui]', evt.level, String(evt.message).slice(0, 300));
	});
}

function buildMenu() {
	Menu.setApplicationMenu(Menu.buildFromTemplate([
		{
			label: '信令 Signaling',
			submenu: [
				{ label: '无服务器直连（跨网，手工搬运码）', click: function () { createWindow('manual'); } },
				{ label: '局域网（自带信令，同一台机器）', click: function () { createWindow('local'); } },
				{ type: 'separator' },
				{ label: '重新加载', role: 'reload' },
				{ label: '开发者工具', role: 'toggleDevTools' }
			]
		},
		{ label: '数据目录', click: function () { shell.openPath(app.getPath('userData')); } },
		{ label: '日志', click: function () { shell.openPath(LOG_FILE); } },
		{
			role: 'help',
			submenu: [{
				label: '关于',
				click: function () {
					dialog.showMessageBox({
						type: 'info',
						title: 'E2E Chat Desktop',
						message: 'E2E Chat Desktop ' + app.getVersion(),
						detail: '本地实例：https://127.0.0.1:' + serverPort +
							'\n数据目录：' + app.getPath('userData') +
							'\n\n与网页版 chat.51pwn.com 共用同一套客户端代码，互不影响。'
					});
				}
			}]
		}
	]));
}

if (!app.requestSingleInstanceLock()) {
	app.quit();
} else {
	app.on('second-instance', function () {
		if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
	});

	// 只放行 127.0.0.1 / localhost 的自签证书
	app.on('certificate-error', function (event, webContents, url, error, certificate, callback) {
		if (/^https:\/\/(127\.0\.0\.1|localhost)/.test(url)) { event.preventDefault(); callback(true); return; }
		callback(false);
	});

	process.on('uncaughtException', function (e) { log('uncaughtException', String((e && e.stack) || e)); });
	process.on('unhandledRejection', function (e) { log('unhandledRejection', String((e && e.stack) || e)); });

	app.whenReady().then(async function () {
		session.defaultSession.setPermissionRequestHandler(function (wc, permission, cb) {
			cb(['media', 'mediaKeySystem', 'geolocation', 'notifications', 'clipboard-read',
				'clipboard-sanitized-write', 'display-capture', 'fullscreen', 'pointerLock'].indexOf(permission) > -1);
		});
		session.defaultSession.setPermissionCheckHandler(function (wc, permission) {
			return ['media', 'geolocation', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen']
				.indexOf(permission) > -1;
		});

		try {
			const r = await core.start({
				appDir: APP_DIR,
				caDir: CA_DIR,
				dataDir: DATA_DIR,
				basePort: 20831,
				onLog: function (s) { log(s); }
			});
			serverPort = r.port;
		} catch (e) {
			log('fatal', String((e && e.stack) || e));
			dialog.showErrorBox('E2E Chat 启动失败', String((e && e.message) || e));
			app.quit();
			return;
		}

		log('server ready on', serverPort);
		buildMenu();
		createWindow(process.env.E2E_SIG || 'manual');
		app.on('activate', function () {
			if (BrowserWindow.getAllWindows().length === 0) createWindow('manual');
		});
	});

	app.on('window-all-closed', function () {
		if (process.platform !== 'darwin') app.quit();
	});
}
